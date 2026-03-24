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

export class TrackArtistInputDto {
  @IsInt()
  @Min(1)
  artistId!: number;

  @IsIn(["primary", "feat"])
  role!: "primary" | "feat";
}

export class CreateTrackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsInt()
  @Min(1)
  durationSeconds!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  bpm?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  audioUrl!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  coverImageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  albumId?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TrackArtistInputDto)
  artists!: TrackArtistInputDto[];

  @IsArray()
  @IsInt({ each: true })
  genreIds!: number[];
}
