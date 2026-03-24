import { Album } from "../../entities/album.entity";
import { TrackDto } from "../../tracks/dto/track.dto";

export class AlbumArtistInfo {
  artistId!:        number;
  displayName!:     string;
  profileImageUrl?: string | null;
  role!:            "primary" | "collaborator";
}

export class AlbumDto {
  id!:            number;
  title!:         string;
  releaseDate!:   string;
  coverImageUrl!: string;
  price!:         number;
  artists!:       AlbumArtistInfo[];
  tracks?:        TrackDto[];
  createdAt!:     Date;
  updatedAt!:     Date;

  static fromEntity(album: Album, tracks?: TrackDto[]): AlbumDto {
    const dto         = new AlbumDto();
    dto.id            = album.id;
    dto.title         = album.title;
    dto.releaseDate   = album.releaseDate;
    dto.coverImageUrl = album.coverImageUrl;
    dto.price         = parseFloat(album.price);
    dto.artists       = album.albumArtists.map((aa) => ({
      artistId:        aa.artistId,
      displayName:     aa.artist.user.displayName,
      profileImageUrl: aa.artist.user.profileImageUrl ?? null,
      role:            aa.role,
    }));
    if (tracks !== undefined) dto.tracks = tracks;
    dto.createdAt = album.createdAt;
    dto.updatedAt = album.updatedAt;
    return dto;
  }
}
