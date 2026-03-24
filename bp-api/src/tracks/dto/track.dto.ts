import { Track } from "../../entities/track.entity";

export class TrackArtistInfo {
  artistId!:        number;
  displayName!:     string;
  profileImageUrl?: string | null;
  role!:            "primary" | "feat";
}

export class TrackGenreInfo {
  id!:   number;
  name!: string;
}

export class TrackDto {
  id!:              number;
  title!:           string;
  durationSeconds!: number;
  bpm?:             number | null;
  audioUrl!:        string;
  price?:           number | null;
  coverImageUrl?:   string | null;
  albumId?:         number | null;
  artists!:         TrackArtistInfo[];
  genres!:          TrackGenreInfo[];
  createdAt!:       Date;
  updatedAt!:       Date;

  static fromEntity(track: Track): TrackDto {
    const dto           = new TrackDto();
    dto.id              = track.id;
    dto.title           = track.title;
    dto.durationSeconds = track.durationSeconds;
    dto.bpm             = track.bpm ?? null;
    dto.audioUrl        = track.audioUrl;
    dto.price           = track.price != null ? parseFloat(track.price) : null;
    dto.coverImageUrl   = track.coverImageUrl ?? null;
    dto.albumId         = track.albumId ?? null;
    dto.artists         = track.trackArtists.map((ta) => ({
      artistId:       ta.artistId,
      displayName:    ta.artist.user.displayName,
      profileImageUrl: ta.artist.user.profileImageUrl ?? null,
      role:           ta.role,
    }));
    dto.genres = track.trackGenres.map((tg) => ({
      id:   tg.genreId,
      name: tg.genre.name,
    }));
    dto.createdAt = track.createdAt;
    dto.updatedAt = track.updatedAt;
    return dto;
  }
}
