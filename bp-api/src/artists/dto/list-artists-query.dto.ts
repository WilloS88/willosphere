import { IsOptional, IsString } from "class-validator";
import { PaginateQueryDto } from "../../common/dto/paginate-query.dto";

export class ListArtistsQueryDto extends PaginateQueryDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
