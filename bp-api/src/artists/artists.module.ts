import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.entity";
import { ArtistsController } from "./artists.controller";
import { ArtistsService } from "./artists.service";
import { CloudFrontService } from "../common/cloudfront.service";

@Module({
  imports: [TypeOrmModule.forFeature([ArtistProfile, User, UserRole])],
  controllers: [ArtistsController],
  providers: [ArtistsService, CloudFrontService],
  exports: [ArtistsService],
})
export class ArtistsModule {}
