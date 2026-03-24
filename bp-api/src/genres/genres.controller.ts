import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { GenresService } from "./genres.service";
import { GenreDto } from "./dto/genre.dto";
import { CreateGenreDto } from "./dto/create-genre.dto";
import { UpdateGenreDto } from "./dto/update-genre.dto";
import { ListGenresQueryDto } from "./dto/list-genres-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../entities/role.enum";

@Controller("genres")
export class GenresController {
  constructor(private readonly genres: GenresService) {}

  @Get()
  findAll(@Query() query: ListGenresQueryDto): Promise<PaginatedResult<GenreDto>> {
    return this.genres.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Promise<GenreDto> {
    return this.genres.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateGenreDto): Promise<GenreDto> {
    return this.genres.create(dto);
  }

  @Patch(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateGenreDto,
  ): Promise<GenreDto> {
    return this.genres.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(204)
  remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.genres.remove(id);
  }
}
