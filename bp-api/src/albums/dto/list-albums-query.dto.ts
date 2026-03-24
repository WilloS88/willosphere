import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";
import { PaginateQueryDto } from "../../common/dto/paginate-query.dto";

export class ListAlbumsQueryDto extends PaginateQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  artistId?: number;
}
