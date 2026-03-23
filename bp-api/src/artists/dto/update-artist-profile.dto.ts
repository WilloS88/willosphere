import { IsDateString, IsOptional, IsString, IsUrl } from "class-validator";

export class UpdateArtistProfileDto {
  @IsOptional()
  @IsString()
  bio?: string | null;

  @IsOptional()
  @IsUrl()
  bannerImageUrl?: string | null;

  @IsOptional()
  @IsDateString()
  artistSince?: string | null;
}
