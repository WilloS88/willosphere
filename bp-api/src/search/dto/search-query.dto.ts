import { IsOptional, IsString, MaxLength, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number;
}
