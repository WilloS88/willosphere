import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { Transform, Type } from "class-transformer";
import { PaginateQueryDto } from "../../common/dto/paginate-query.dto";

export class ListPlaylistsQueryDto extends PaginateQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isPublic?: boolean;
}
