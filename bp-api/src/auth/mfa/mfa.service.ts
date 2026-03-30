import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import * as OTPAuth from "otpauth";

import { UserMfa } from "../../entities/user-mfa.entity";
import { MfaChallenge } from "../../entities/mfa-challenge.entity";
import { User } from "../../entities/user.entity";
import { AesGcmCrypto } from "../crypto/aes-gcm.crypto";

const TOTP_ISSUER             = "Willosphere";
const CHALLENGE_TTL_MINUTES   = 2;
const MAX_CHALLENGE_ATTEMPTS  = 5;

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(UserMfa)
    private readonly mfaRepo: Repository<UserMfa>,

    @InjectRepository(MfaChallenge)
    private readonly challengeRepo: Repository<MfaChallenge>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly crypto: AesGcmCrypto,
  ) {}

  async enroll(userId: number): Promise<{ otpAuthUrl: string; secret: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if(!user)
      throw new NotFoundException("User not found");

    const totp = new OTPAuth.TOTP({
      issuer: TOTP_ISSUER,
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    const secret    = totp.secret.base32;
    const encrypted = this.crypto.encrypt(secret);
    const existing  = await this.mfaRepo.findOne({ where: { userId } });

    if(existing) {
      await this.mfaRepo.update({ userId }, { secret: encrypted, enabled: false });
    } else {
      await this.mfaRepo.save({
        userId,
        secret: encrypted,
        enabled: false,
      });
    }

    return {
      otpAuthUrl: totp.toString(),
      secret,
    };
  }

  async confirmEnrollment(userId: number, code: string): Promise<void> {
    const mfa = await this.mfaRepo.findOne({ where: { userId } });
    if(!mfa)
      throw new BadRequestException("MFA not enrolled — call /mfa/enroll first");

    const secret  = this.crypto.decrypt(mfa.secret);
    const isValid = this.verifyTotp(secret, code);

    if(!isValid) {
      throw new UnauthorizedException("Invalid TOTP code");
    }

    await this.mfaRepo.update({ userId }, { enabled: true });
  }

  async createLoginChallenge(userId: number): Promise<string> {
    const challengeId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_MINUTES * 60 * 1000);

    await this.challengeRepo.save({
      id: challengeId,
      userId,
      purpose: "LOGIN",
      expiresAt,
      attempts: 0,
      verifiedAt: null,
    });

    return challengeId;
  }

  async verifyLoginChallenge(challengeId: string, code: string): Promise<MfaChallenge> {
    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });

    if(!challenge) {
      throw new UnauthorizedException("Invalid challenge");
    }

    if (challenge.isVerified()) {
      throw new UnauthorizedException("Challenge already verified");
    }

    if (challenge.isExpired()) {
      throw new UnauthorizedException("Challenge expired");
    }

    if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
      throw new ForbiddenException("Too many attempts — create a new login");
    }

    const mfa = await this.mfaRepo.findOne({ where: { userId: challenge.userId } });
    if(!mfa || !mfa.enabled) {
      throw new UnauthorizedException("MFA not enabled for this user");
    }

    const secret  = this.crypto.decrypt(mfa.secret);
    const isValid = this.verifyTotp(secret, code);

    challenge.attempts += 1;

    if(!isValid) {
      await this.challengeRepo.save(challenge);
      throw new UnauthorizedException("Invalid TOTP code");
    }

    challenge.verifiedAt = new Date();
    await this.challengeRepo.save(challenge);

    return challenge;
  }

  async isMfaEnabled(userId: number): Promise<boolean> {
    const mfa = await this.mfaRepo.findOne({ where: { userId } });
    return !!mfa?.enabled;
  }

  private verifyTotp(base32Secret: string, code: string): boolean {
    const totp = new OTPAuth.TOTP({
      issuer: TOTP_ISSUER,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(base32Secret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }

  private maskSecret(secret: string): string {
    if (secret.length <= 4)
      return "****";

    return "****" + secret.substring(secret.length - 4);
  }
}
