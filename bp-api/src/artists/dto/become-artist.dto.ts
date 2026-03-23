import { IsDateString, IsOptional, IsString, IsUrl } from "class-validator";

export class BecomeArtistDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  bannerImageUrl?: string;

  @IsOptional()
  @IsDateString()
  artistSince?: string;
}
