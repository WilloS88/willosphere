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
  Req,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";
import { ArtistsService } from "./artists.service";
import { ArtistDto } from "./dto/artist.dto";
import { BecomeArtistDto } from "./dto/become-artist.dto";
import { UpdateArtistProfileDto } from "./dto/update-artist-profile.dto";
import { ListArtistsQueryDto } from "./dto/list-artists-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";

@Controller("artists")
export class ArtistsController {
  constructor(private readonly artists: ArtistsService) {}

  @Get()
  findAll(@Query() query: ListArtistsQueryDto): Promise<PaginatedResult<ArtistDto>> {
    return this.artists.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Promise<ArtistDto> {
    return this.artists.findOne(id);
  }

  @Post("become")
  @UseGuards(AuthGuard)
  become(
    @Req() req: Request,
    @Body() dto: BecomeArtistDto,
  ): Promise<ArtistDto> {
    return this.artists.becomeArtist((req as any).userId, dto);
  }

  @Patch("me")
  @UseGuards(AuthGuard)
  updateProfile(
    @Req() req: Request,
    @Body() dto: UpdateArtistProfileDto,
  ): Promise<ArtistDto> {
    return this.artists.updateProfile((req as any).userId, dto);
  }

  @Delete("me")
  @UseGuards(AuthGuard)
  @HttpCode(204)
  resign(@Req() req: Request): Promise<void> {
    return this.artists.resign((req as any).userId);
  }

  @Patch(":id")
  updateProfileById(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateArtistProfileDto,
  ): Promise<ArtistDto> {
    return this.artists.updateProfile(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  resignById(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.artists.resign(id);
  }
}
