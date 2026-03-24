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
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { PlaylistsService } from "./playlists.service";
import { PlaylistDto } from "./dto/playlist.dto";
import { CreatePlaylistDto } from "./dto/create-playlist.dto";
import { UpdatePlaylistDto } from "./dto/update-playlist.dto";
import { AddTrackDto } from "./dto/add-track.dto";
import { ListPlaylistsQueryDto } from "./dto/list-playlists-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";

@Controller("playlists")
export class PlaylistsController {
  constructor(private readonly playlists: PlaylistsService) {}

  @Get()
  findAll(@Query() query: ListPlaylistsQueryDto): Promise<PaginatedResult<PlaylistDto>> {
    return this.playlists.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Promise<PlaylistDto> {
    return this.playlists.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Req() req: Request,
    @Body() dto: CreatePlaylistDto,
  ): Promise<PlaylistDto> {
    return this.playlists.create(dto, (req as any).userId);
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: Request,
    @Body() dto: UpdatePlaylistDto,
  ): Promise<PlaylistDto> {
    return this.playlists.update(id, dto, (req as any).userId, (req as any).userRoles);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @HttpCode(204)
  remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<void> {
    return this.playlists.remove(id, (req as any).userId, (req as any).userRoles);
  }

  @Post(":id/tracks")
  @UseGuards(AuthGuard)
  addTrack(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: Request,
    @Body() dto: AddTrackDto,
  ): Promise<PlaylistDto> {
    return this.playlists.addTrack(id, dto.trackId, (req as any).userId, (req as any).userRoles);
  }

  @Delete(":id/tracks/:trackId")
  @UseGuards(AuthGuard)
  removeTrack(
    @Param("id", ParseIntPipe) id: number,
    @Param("trackId", ParseIntPipe) trackId: number,
    @Req() req: Request,
  ): Promise<PlaylistDto> {
    return this.playlists.removeTrack(id, trackId, (req as any).userId, (req as any).userRoles);
  }
}
