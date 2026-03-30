import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserMfa } from "../../entities/user-mfa.entity";
import { MfaChallenge } from "../../entities/mfa-challenge.entity";
import { User } from "../../entities/user.entity";
import { MfaController } from "./mfa.controller";
import { MfaService } from "./mfa.service";
import { AesGcmCrypto } from "../crypto/aes-gcm.crypto";

@Module({
  imports: [TypeOrmModule.forFeature([UserMfa, MfaChallenge, User])],
  controllers: [MfaController],
  providers: [MfaService, AesGcmCrypto],
  exports: [MfaService],
})
export class MfaModule {}
