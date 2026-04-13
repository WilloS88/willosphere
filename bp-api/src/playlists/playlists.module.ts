import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Playlist } from "../entities/playlist.entity";
import { PlaylistTrack } from "../entities/playlist-track.entity";
import { Track } from "../entities/track.entity";
import { TrackArtist } from "../entities/track-artist.entity";
import { TrackGenre } from "../entities/track-genre.entity";
import { PlaylistsController } from "./playlists.controller";
import { PlaylistsService } from "./playlists.service";
import { RoyaltyModule } from "../royalty/royalty.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Playlist, PlaylistTrack, Track, TrackArtist, TrackGenre]),
    forwardRef(() => RoyaltyModule),
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
