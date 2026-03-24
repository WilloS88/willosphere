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
import { AlbumsService } from "./albums.service";
import { AlbumDto } from "./dto/album.dto";
import { CreateAlbumDto } from "./dto/create-album.dto";
import { UpdateAlbumDto } from "./dto/update-album.dto";
import { ListAlbumsQueryDto } from "./dto/list-albums-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../entities/role.enum";

@Controller("albums")
export class AlbumsController {
  constructor(private readonly albums: AlbumsService) {}

  @Get()
  findAll(@Query() query: ListAlbumsQueryDto): Promise<PaginatedResult<AlbumDto>> {
    return this.albums.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Promise<AlbumDto> {
    return this.albums.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.ADMIN)
  create(@Body() dto: CreateAlbumDto): Promise<AlbumDto> {
    return this.albums.create(dto);
  }

  @Patch(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.ADMIN)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAlbumDto,
  ): Promise<AlbumDto> {
    return this.albums.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.ADMIN)
  @HttpCode(204)
  remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.albums.remove(id);
  }
}
