export type TrackArtistInfo = {
  artistId:        number;
  displayName:     string;
  profileImageUrl?: string | null;
  role:            "primary" | "feat";
};

export type TrackGenreInfo = {
  id:   number;
  name: string;
};

export type TrackDto = {
  id:              number;
  title:           string;
  durationSeconds: number;
  bpm?:            number | null;
  audioUrl:        string;
  price?:          number | null;
  coverImageUrl?:  string | null;
  albumId?:        number | null;
  artists:         TrackArtistInfo[];
  genres:          TrackGenreInfo[];
  createdAt:       string;
  updatedAt:       string;
};

export type GenreDto = {
  id:        number;
  name:      string;
  createdAt: string;
  updatedAt: string;
};
