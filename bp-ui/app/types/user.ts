export type Role = "listener" | "artist" | "admin";

export type UserDTO = {
  id:           number;
  email:        string;
  displayName:  string;
  role:         Role;
  roles:        Role[];
};

export type UserDetailDTO = UserDTO & {
  signupDate:       string;
  timezone:         string;
  language:         string;
  profileImageUrl?: string | null;
  createdAt:        string;
  updatedAt:        string;
  artistProfile?:   ArtistProfileDto | null;
};

export type ArtistProfileDto = {
  bio?:            string | null;
  bannerImageUrl?: string | null;
  artistSince?:    string | null;
  createdAt:       string;
  updatedAt:       string;
};

export type ArtistDto = {
  userId:          number;
  email:           string;
  displayName:     string;
  profileImageUrl?: string | null;
  bio?:            string | null;
  bannerImageUrl?: string | null;
  artistSince?:    string | null;
  memberSince:     string;
};
