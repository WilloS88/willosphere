import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Track } from "../entities/track.entity";
import { TrackArtist } from "../entities/track-artist.entity";
import { TrackGenre } from "../entities/track-genre.entity";
import { Genre } from "../entities/genre.entity";
import { Album } from "../entities/album.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { TracksController } from "./tracks.controller";
import { TracksService } from "./tracks.service";
import { CloudFrontService } from "../common/cloudfront.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Track, TrackArtist, TrackGenre, Genre, Album, ArtistProfile]),
  ],
  controllers: [TracksController],
  providers: [TracksService, CloudFrontService],
  exports: [TracksService],
})
export class TracksModule {}
