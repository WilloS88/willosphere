import { IsIn, IsOptional, IsString } from "class-validator";
import { PaginateQueryDto } from "../../common/dto/paginate-query.dto";
import { Role } from "../../entities/role.enum";

export class ListUsersQueryDto extends PaginateQueryDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsIn([Role.LISTENER, Role.ARTIST, Role.ADMIN])
  role?: Role;
}
