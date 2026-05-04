import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { generateKeyPairSync } from "crypto";
import * as bcrypt from "bcryptjs";

import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { MfaService } from "./mfa/mfa.service";
import { RsaKeyProvider } from "./crypto/rsa-key.provider";
import { CloudFrontService } from "../common/cloudfront.service";
import { RefreshToken } from "../entities/refresh-token.entity";
import { Role } from "../entities/role.enum";
import { sha256Base64Url } from "./crypto/hash.util";

type MockRepo<T = unknown> = {
  findOne: jest.Mock;
  save: jest.Mock;
} & Record<string, jest.Mock>;

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  email: "user@willosphere.test",
  displayName: "Test User",
  profileImageUrl: null,
  roles: [{ role: Role.LISTENER }],
  ...overrides,
});

describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, "findByEmail" | "findById">>;
  let mfaService: jest.Mocked<
    Pick<MfaService, "isMfaEnabled" | "createLoginChallenge" | "verifyLoginChallenge">
  >;
  let refreshRepo: MockRepo<RefreshToken>;
  let cf: jest.Mocked<Pick<CloudFrontService, "signUrl">>;

  beforeEach(async () => {
    // Vygeneruj efemérní RSA keypair, aby jwt.sign měl validní klíče.
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });

    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    mfaService = {
      isMfaEnabled: jest.fn(),
      createLoginChallenge: jest.fn(),
      verifyLoginChallenge: jest.fn(),
    };

    refreshRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockResolvedValue({}),
    };

    cf = { signUrl: jest.fn((url: string) => url) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: MfaService, useValue: mfaService },
        {
          provide: ConfigService,
          useValue: {
            get: <T>(_: string, def?: T) => def,
          },
        },
        { provide: RsaKeyProvider, useValue: { privateKey, publicKey } },
        { provide: CloudFrontService, useValue: cf },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  describe("login", () => {
    it("returns user + token pair on valid credentials (no MFA)", async () => {
      const passwordHash = await bcrypt.hash("password123", 4);
      usersService.findByEmail.mockResolvedValue(
        makeUser({ passwordHash }) as never,
      );
      usersService.findById.mockResolvedValue(makeUser() as never);
      mfaService.isMfaEnabled.mockResolvedValue(false);

      const result = await service.login(
        "user@willosphere.test",
        "password123",
        "device-1",
      );

      expect(result.mfaRequired).toBe(false);
      expect(result.user).toBeDefined();
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(refreshRepo.save).toHaveBeenCalledTimes(1);
    });

    it("throws UnauthorizedException when password is wrong", async () => {
      const passwordHash = await bcrypt.hash("correct-password", 4);
      usersService.findByEmail.mockResolvedValue(
        makeUser({ passwordHash }) as never,
      );

      await expect(
        service.login("user@willosphere.test", "wrong-password", "device-1"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("throws UnauthorizedException when user does not exist", async () => {
      usersService.findByEmail.mockResolvedValue(null as never);

      await expect(
        service.login("nobody@willosphere.test", "any", "device-1"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      // Po negativním nálezu se MFA dotaz nesmí ani spustit (nepotvrzuje existenci uživatele).
      expect(mfaService.isMfaEnabled).not.toHaveBeenCalled();
    });

    it("returns mfaRequired=true with challengeId when MFA is enabled", async () => {
      const passwordHash = await bcrypt.hash("pw", 4);
      usersService.findByEmail.mockResolvedValue(
        makeUser({ passwordHash }) as never,
      );
      mfaService.isMfaEnabled.mockResolvedValue(true);
      mfaService.createLoginChallenge.mockResolvedValue("challenge-uuid-1");

      const result = await service.login(
        "user@willosphere.test",
        "pw",
        "device-1",
      );

      expect(result.mfaRequired).toBe(true);
      expect(result.challengeId).toBe("challenge-uuid-1");
      expect(result.user).toBeNull();
      expect(result.accessToken).toBeNull();
      expect(result.refreshToken).toBeNull();
      // Při MFA větvi se ŽÁDNÝ refresh token nesmí uložit.
      expect(refreshRepo.save).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe("refresh", () => {
    const futureDate = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

    it("rotates the token successfully", async () => {
      const oldRaw = "raw-old-token";
      const oldHash = sha256Base64Url(oldRaw);

      const existing = {
        id: 1,
        userId: 42,
        deviceId: "device-1",
        tokenHash: oldHash,
        expiresAt: futureDate(),
        revokedAt: null,
        replacedByHash: null,
      };

      refreshRepo.findOne.mockResolvedValue(existing as never);
      usersService.findById.mockResolvedValue(
        makeUser({ id: 42 }) as never,
      );

      const result = await service.refresh(oldRaw, "device-1");

      // Save volán dvakrát: 1. revokace starého, 2. uložení nového.
      expect(refreshRepo.save).toHaveBeenCalledTimes(2);
      expect(existing.revokedAt).toBeInstanceOf(Date);
      expect(existing.replacedByHash).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).not.toBe(oldRaw);
    });

    it("rejects reuse of an already-revoked token (theft detection)", async () => {
      refreshRepo.findOne.mockResolvedValue({
        userId: 42,
        deviceId: "device-1",
        expiresAt: futureDate(),
        revokedAt: new Date(),
      } as never);

      await expect(service.refresh("any-raw", "device-1")).rejects.toThrow(
        /revoked/i,
      );
      expect(refreshRepo.save).not.toHaveBeenCalled();
    });

    it("rejects an expired token", async () => {
      refreshRepo.findOne.mockResolvedValue({
        userId: 42,
        deviceId: "device-1",
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: null,
      } as never);

      await expect(service.refresh("raw", "device-1")).rejects.toThrow(
        /expired/i,
      );
    });

    it("rejects when device id does not match", async () => {
      refreshRepo.findOne.mockResolvedValue({
        userId: 42,
        deviceId: "real-device",
        expiresAt: futureDate(),
        revokedAt: null,
      } as never);

      await expect(service.refresh("raw", "different-device")).rejects.toThrow(
        /device/i,
      );
    });

    it("rejects an unknown token hash", async () => {
      refreshRepo.findOne.mockResolvedValue(null as never);

      await expect(service.refresh("raw", "device-1")).rejects.toThrow(
        /invalid/i,
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe("logout", () => {
    it("sets revokedAt on the matching token", async () => {
      const token: { revokedAt: Date | null } = { revokedAt: null };
      refreshRepo.findOne.mockResolvedValue(token as never);

      await service.logout("raw");

      expect(token.revokedAt).toBeInstanceOf(Date);
      expect(refreshRepo.save).toHaveBeenCalledWith(token);
    });

    it("is a no-op when refresh token is undefined", async () => {
      await service.logout(undefined);
      expect(refreshRepo.findOne).not.toHaveBeenCalled();
      expect(refreshRepo.save).not.toHaveBeenCalled();
    });

    it("does nothing when token already revoked", async () => {
      refreshRepo.findOne.mockResolvedValue({
        revokedAt: new Date(2020, 0, 1),
      } as never);

      await service.logout("raw");
      expect(refreshRepo.save).not.toHaveBeenCalled();
    });
  });
});
