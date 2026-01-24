import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { RefreshToken } from "../entities/refresh-token.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]), 
    UsersModule
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}