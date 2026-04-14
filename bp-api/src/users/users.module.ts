import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { RefreshToken } from "../entities/refresh-token.entity";
import { CloudFrontService } from "../common/cloudfront.service";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole, ArtistProfile, RefreshToken])],
  controllers: [UsersController],
  providers: [UsersService, CloudFrontService],
  exports: [UsersService],
})
export class UsersModule {}
