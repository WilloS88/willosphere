import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ParseIntPipe, Query,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserDTO, UserDetailDTO } from "./dto/user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../entities/role.enum";

@Controller("users")
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list(@Query() query: ListUsersQueryDto): Promise<PaginatedResult<UserDTO>> {
    return this.users.findAllList(query);
  }

  @Get(":id")
  async detail(@Param("id", ParseIntPipe) id: number): Promise<UserDetailDTO> {
    const u = await this.users.findById(id);
    return UserDetailDTO.fromEntity(u);
  }

  // @Get()
  // async findByEmail(@Query("email") email?: string) {
  //   if(email)
  //     return this.users.findByEmail(email);
  //   return this.users.findAllList();
  // }

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserDetailDTO> {
    const u = await this.users.create(dto);
    return UserDetailDTO.fromEntity(u);
  }

  @Put(":id")
  async update(
      @Param("id", ParseIntPipe) id: number,
      @Body() dto: UpdateUserDto,
  ): Promise<UserDetailDTO> {
    const u = await this.users.update(id, dto);
    return UserDetailDTO.fromEntity(u);
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.users.remove(id);
    return { ok: true };
  }
}
