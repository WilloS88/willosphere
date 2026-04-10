export class SearchTrackItem {
  id!: number;
  title!: string;
  durationSeconds!: number;
  coverImageUrl?: string | null;
  artists!: { artistId: number; displayName: string; profileImageUrl?: string | null }[];
  genres!: { id: number; name: string }[];
}

export class SearchArtistItem {
  userId!: number;
  displayName!: string;
  profileImageUrl?: string | null;
}

export class SearchAlbumItem {
  id!: number;
  title!: string;
  coverImageUrl?: string | null;
  artists!: { artistId: number; displayName: string }[];
}

export class SearchResultDto {
  tracks!: SearchTrackItem[];
  artists!: SearchArtistItem[];
  albums!: SearchAlbumItem[];
}
