import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";
import { PaginateQueryDto } from "../../common/dto/paginate-query.dto";

export class ListProductsQueryDto extends PaginateQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  artistId?: number;

  @IsOptional()
  @IsIn(["physical", "digital"])
  type?: "physical" | "digital";
}
