import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Track } from "../entities/track.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { Album } from "../entities/album.entity";
import { ListenHistory } from "../entities/listen-history.entity";
import { EngagementAction } from "../entities/engagement-action.entity";
import { CloudFrontService } from "../common/cloudfront.service";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Track,
      ArtistProfile,
      Album,
      ListenHistory,
      EngagementAction,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService, CloudFrontService],
})
export class SearchModule {}
