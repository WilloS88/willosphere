import { Controller, Get, Param, Post, Body, Patch, Query } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Role } from "../entities/role.enum";
import { User } from "../entities/user.entity";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const u = await this.users.create(dto);
    return plainToInstance(User, u);
  }

  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    const u = await this.users.findById(+id);
    return plainToInstance(User, u);
  }

  @Get()
  async findByEmail(@Query("email") email?: string) {
    if (email) 
      return this.users.findByEmail(email);
    return this.users.findAll();
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    const u = await this.users.update(+id, dto);
    return plainToInstance(User, u);
  }

  @Post(":id/roles/:role")
  addRole(@Param("id") id: string, @Param("role") role: Role) {
    return this.users.addRole(+id, role);
  }
}
