import {
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

import { UsersService } from "../users/users.service";
import { MfaService } from "./mfa/mfa.service";
import { RefreshToken } from "../entities/refresh-token.entity";
import { RsaKeyProvider } from "./crypto/rsa-key.provider";
import { sha256Base64Url, createRefreshRaw } from "./crypto/hash.util";
import { SignupDto } from "./dto/signup.dto";
import { SignupAsArtistDto } from "./dto/signup-artist.dto";
import { AuthUserDto } from "./dto/auth-user.dto";
import { CloudFrontService } from "../common/cloudfront.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlDays: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly mfaService: MfaService,
    private readonly configService: ConfigService,
    private readonly rsaKeys: RsaKeyProvider,

    private readonly cf: CloudFrontService,

    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {
    this.accessTokenTtlSeconds = this.configService.get<number>(
      "JWT_ACCESS_TOKEN_TTL_SECONDS",
      300,
    );
    this.refreshTokenTtlDays = this.configService.get<number>(
      "REFRESH_TOKEN_TTL_DAYS",
      14,
    );
  }

  async signup(dto: SignupDto) {
    const user    = await this.usersService.create(dto);
    const tokens  = await this.issueTokenPair(user.id, user.email);

    return { user: this.signProfileImage(AuthUserDto.fromEntity(user)), ...tokens };
  }

  async signupAsArtist(dto: SignupAsArtistDto) {
    const user    = await this.usersService.createWithArtistProfile(dto);
    const tokens  = await this.issueTokenPair(user.id, user.email);

    return { user: this.signProfileImage(AuthUserDto.fromEntity(user)), ...tokens };
  }

  async login(email: string, password: string, deviceId: string) {
    const existing = await this.usersService.findByEmail(email);
    if(!existing) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, existing.passwordHash);
    if(!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const mfaEnabled = await this.mfaService.isMfaEnabled(existing.id);

    if (mfaEnabled) {
      const challengeId = await this.mfaService.createLoginChallenge(existing.id);
      return {
        mfaRequired:  true,
        challengeId,
        user:         null,
        accessToken:  null,
        refreshToken: null,
        deviceId,
      };
    }

    const user = await this.usersService.findById(existing.id);
    if(!user)
      throw new UnauthorizedException("Invalid credentials");

    const tokens = await this.issueTokenPair(user.id, user.email, deviceId);

    return {
      mfaRequired:  false,
      challengeId:  null,
      user:         this.signProfileImage(AuthUserDto.fromEntity(user)),
      ...tokens,
    };
  }

  async verifyMfaLogin(challengeId: string, code: string, deviceId: string) {
    const challenge = await this.mfaService.verifyLoginChallenge(challengeId, code);

    const user = await this.usersService.findById(challenge.userId);
    if(!user)
      throw new UnauthorizedException("User not found");

    const tokens = await this.issueTokenPair(user.id, user.email, deviceId);

    return { user: this.signProfileImage(AuthUserDto.fromEntity(user)), ...tokens };
  }

  async refresh(rawRefreshToken: string, deviceId: string) {
    const presentedHash = sha256Base64Url(rawRefreshToken);
    const now           = new Date();

    const existing = await this.refreshRepo.findOne({
      where: { tokenHash: presentedHash },
    });

    if(!existing) {
      this.logger.warn("Refresh attempt with unknown token hash");
      throw new UnauthorizedException("Invalid refresh token");
    }

    if(existing.revokedAt !== null && existing.revokedAt !== undefined) {
      this.logger.warn(
        `Attempt to use revoked refresh token (userId=${existing.userId}). ` +
        `Possible token theft detected!`
      );
      throw new UnauthorizedException("Refresh token was revoked");
    }

    if(existing.expiresAt.getTime() <= now.getTime()) {
      this.logger.debug(`Refresh token expired for userId=${existing.userId}`);
      throw new UnauthorizedException("Refresh token expired");
    }

    if(existing.deviceId !== deviceId) {
      this.logger.warn(
        `Device ID mismatch on refresh (userId=${existing.userId}): ` +
        `expected=${existing.deviceId}, got=${deviceId}`
      );

      throw new UnauthorizedException("Device mismatch");
    }

    const newRaw  = createRefreshRaw();
    const newHash = sha256Base64Url(newRaw);

    existing.revokedAt      = now;
    existing.replacedByHash = newHash;

    await this.refreshRepo.save(existing);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenTtlDays);

    await this.refreshRepo.save({
      userId: existing.userId,
      deviceId,
      tokenHash: newHash,
      expiresAt,
    });

    const user = await this.usersService.findById(existing.userId);
    if(!user)
      new UnauthorizedException("User not found");

    const roles       = (user.roles ?? []).map((r) => r.role);
    const accessToken = this.signAccessToken(user.id, user.email, roles);

    return {
      user: this.signProfileImage(AuthUserDto.fromEntity(user)),
      accessToken,
      refreshToken: newRaw,
    };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if(!rawRefreshToken)
      return;

    const hash      = sha256Base64Url(rawRefreshToken);
    const existing  = await this.refreshRepo.findOne({
      where: { tokenHash: hash },
    });

    if(existing && !existing.revokedAt) {
      existing.revokedAt = new Date();
      await this.refreshRepo.save(existing);
    }
  }

  async me(userId: number) {
    const user = await this.usersService.findById(userId);
    if(!user)
      throw new UnauthorizedException("User not found");

    return this.signProfileImage(AuthUserDto.fromEntity(user));
  }

  private signProfileImage(dto: AuthUserDto): AuthUserDto {
    if(dto.profileImageUrl) {
      dto.profileImageUrl = this.cf.signUrl(dto.profileImageUrl);
    }
    return dto;
  }

  private signAccessToken(
    userId: number,
    email:  string,
    roles:  string[],
  ): string {
    const payload = {
      sub: userId,
      email,
      roles,
    };

    return jwt.sign(payload, this.rsaKeys.privateKey, {
      algorithm: "RS256",
      expiresIn: this.accessTokenTtlSeconds,
    });
  }

  private async issueTokenPair(
    userId:     number,
    email:      string,
    deviceId?:  string,
  ) {
    const user  = await this.usersService.findById(userId);
    const roles = (user?.roles ?? []).map((r) => r.role);

    const accessToken = this.signAccessToken(userId, email, roles);

    const refreshRaw      = createRefreshRaw();
    const refreshHash     = sha256Base64Url(refreshRaw);
    const actualDeviceId  = deviceId ?? require("crypto").randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenTtlDays);

    await this.refreshRepo.save({
      userId,
      deviceId: actualDeviceId,
      tokenHash: refreshHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: refreshRaw,
      deviceId: actualDeviceId,
    };
  }
}
