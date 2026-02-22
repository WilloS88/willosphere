import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ParseIntPipe, Query,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserDTO, UserDetailDTO } from "./dto/user.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list(): Promise<UserDTO[]> {
    const users = await this.users.findAllList();
    return users.map(UserDTO.fromEntity);
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
