export type Role = "listener" | "artist" | "admin";

export type UserDTO = {
  id:           number;
  email:        string;
  displayName:  string;
  role:         Role;
};

export type UserDetailDTO = UserDTO & {
  signupDate:       string;
  timezone:         string;
  language:         string;
  profileImageUrl?: string | null;
  createdAt:        string;
  updatedAt:        string;
  // artistProfile?: any | null;
};
