import type { TrackDto } from "./track";

export type AlbumArtistInfo = {
  artistId:        number;
  displayName:     string;
  profileImageUrl: string | null;
  role:            "primary" | "collaborator";
};

export type AlbumDto = {
  id:            number;
  title:         string;
  releaseDate:   string;
  coverImageUrl: string;
  price:         number;
  artists:       AlbumArtistInfo[];
  tracks?:       TrackDto[];
  createdAt:     string;
  updatedAt:     string;
};
