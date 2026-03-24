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
import { TracksService } from "./tracks.service";
import { TrackDto } from "./dto/track.dto";
import { CreateTrackDto } from "./dto/create-track.dto";
import { UpdateTrackDto } from "./dto/update-track.dto";
import { ListTracksQueryDto } from "./dto/list-tracks-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../auth/guard/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../entities/role.enum";

@Controller("tracks")
export class TracksController {
  constructor(private readonly tracks: TracksService) {}

  @Get()
  findAll(@Query() query: ListTracksQueryDto): Promise<PaginatedResult<TrackDto>> {
    return this.tracks.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Promise<TrackDto> {
    return this.tracks.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.ADMIN)
  create(@Body() dto: CreateTrackDto): Promise<TrackDto> {
    return this.tracks.create(dto);
  }

  @Patch(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.ADMIN)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTrackDto,
  ): Promise<TrackDto> {
    return this.tracks.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ARTIST, Role.ADMIN)
  @HttpCode(204)
  remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.tracks.remove(id);
  }
}
