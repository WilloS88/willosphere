import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsIn(["physical", "digital"])
  type!: "physical" | "digital";

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsInt()
  @Min(1)
  artistId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  trackId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  albumId?: number;
}
