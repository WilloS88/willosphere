export type SearchTrackItem = {
  id:               number;
  title:            string;
  durationSeconds:  number;
  coverImageUrl?:   string | null;
  artists: { artistId: number; displayName: string; profileImageUrl?: string | null }[];
  genres: { id: number; name: string }[];
};

export type SearchArtistItem = {
  userId:           number;
  displayName:      string;
  profileImageUrl?: string | null;
};

export type SearchAlbumItem = {
  id:                   number;
  title:                string;
  coverImageUrl?:       string | null;
  artists: { artistId:  number; displayName: string }[];
};

export type SearchResultDto = {
  tracks:   SearchTrackItem[];
  artists:  SearchArtistItem[];
  albums:   SearchAlbumItem[];
};
