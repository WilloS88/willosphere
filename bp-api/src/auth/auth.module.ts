import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { MfaModule } from "./mfa/mfa.module";
import { RefreshToken } from "../entities/refresh-token.entity";
import { CloudFrontService } from "../common/cloudfront.service";


@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]), 
    UsersModule,
    MfaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, CloudFrontService],
  exports: [AuthService],
})
export class AuthModule {}