import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";
import { PaginateQueryDto } from "../../common/dto/paginate-query.dto";

export class ListListenHistoryQueryDto extends PaginateQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trackId?: number;
}
