import { Playlist } from "../../entities/playlist.entity";
import { TrackDto } from "../../tracks/dto/track.dto";

export class PlaylistTrackItem {
  position!: number;
  track!:    TrackDto;
}

export class PlaylistDto {
  id!:              number;
  title!:           string;
  userId!:          number;
  isPublic!:        boolean;
  isCollaborative!: boolean;
  trackCount!:      number;
  tracks?:          PlaylistTrackItem[];
  createdAt!:       Date;
  updatedAt!:       Date;

  static fromEntity(playlist: Playlist, includeTracks = false): PlaylistDto {
    const dto             = new PlaylistDto();
    dto.id                = playlist.id;
    dto.title             = playlist.title;
    dto.userId            = playlist.userId;
    dto.isPublic          = Boolean(playlist.isPublic);
    dto.isCollaborative   = Boolean(playlist.isCollaborative);
    dto.trackCount        = playlist.playlistTracks?.length ?? 0;
    dto.createdAt         = playlist.createdAt;
    dto.updatedAt         = playlist.updatedAt;

    if (includeTracks && playlist.playlistTracks) {
      dto.tracks = playlist.playlistTracks
        .sort((a, b) => a.position - b.position)
        .map((pt) => ({
          position: pt.position,
          track:    TrackDto.fromEntity(pt.track),
        }));
    }

    return dto;
  }
}
