import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Album } from "../entities/album.entity";
import { AlbumArtist } from "../entities/album-artist.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { Track } from "../entities/track.entity";
import { TrackArtist } from "../entities/track-artist.entity";
import { TrackGenre } from "../entities/track-genre.entity";
import { AlbumsController } from "./albums.controller";
import { AlbumsService } from "./albums.service";
import { CloudFrontService } from "../common/cloudfront.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Album, AlbumArtist, ArtistProfile, Track, TrackArtist, TrackGenre]),
  ],
  controllers: [AlbumsController],
  providers: [AlbumsService, CloudFrontService],
  exports: [AlbumsService],
})
export class AlbumsModule {}
