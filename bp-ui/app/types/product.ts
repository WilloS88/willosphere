export type ProductArtistInfo = {
  artistId:        number;
  displayName:     string;
  profileImageUrl: string | null;
};

export type ProductLinkedTrack = {
  id:    number;
  title: string;
};

export type ProductLinkedAlbum = {
  id:    number;
  title: string;
};

export type ProductDto = {
  id:           number;
  name:         string;
  type:         "physical" | "digital";
  description:  string | null;
  price:        number;
  artist:       ProductArtistInfo;
  track?:       ProductLinkedTrack | null;
  album?:       ProductLinkedAlbum | null;
  createdAt:    string;
  updatedAt:    string;
};
