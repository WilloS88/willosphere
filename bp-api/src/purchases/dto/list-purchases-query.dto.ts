import { IsDateString, IsInt, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";
import { PaginateQueryDto } from "../../common/dto/paginate-query.dto";

export class ListPurchasesQueryDto extends PaginateQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;
}
