import { IsOptional, IsString } from "class-validator";
import { PaginateQueryDto } from "../../common/dto/paginate-query.dto";

export class ListGenresQueryDto extends PaginateQueryDto {
  @IsOptional()
  @IsString()
  name?: string;
}
