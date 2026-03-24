import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class AlbumArtistInputDto {
  @IsInt()
  @Min(1)
  artistId!: number;

  @IsIn(["primary", "collaborator"])
  role!: "primary" | "collaborator";
}

export class CreateAlbumDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  releaseDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  coverImageUrl!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AlbumArtistInputDto)
  artists!: AlbumArtistInputDto[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  trackIds?: number[];
}
