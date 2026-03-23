import { ArtistProfile } from "../../entities/artist-profile.entity";
import { User } from "../../entities/user.entity";

export class ArtistDto {
  userId!:            number;
  email!:             string;
  displayName!:       string;
  profileImageUrl?:   string | null;
  bio?:               string | null;
  bannerImageUrl?:    string | null;
  artistSince?:       string | null;
  memberSince!:       Date;

  static fromEntities(user: User, profile: ArtistProfile): ArtistDto {
    const dto           = new ArtistDto();
    dto.userId          = user.id;
    dto.email           = user.email;
    dto.displayName     = user.displayName;
    dto.profileImageUrl = user.profileImageUrl ?? null;
    dto.bio             = profile.bio ?? null;
    dto.bannerImageUrl  = profile.bannerImageUrl ?? null;
    dto.artistSince     = profile.artistSince ?? null;
    dto.memberSince     = profile.createdAt;
    return dto;
  }
}
