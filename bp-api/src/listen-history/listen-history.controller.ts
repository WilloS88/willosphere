import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { ListenHistoryService } from "./listen-history.service";
import { CreateListenHistoryDto } from "./dto/create-listen-history.dto";
import { ListenHistoryDto } from "./dto/listen-history.dto";
import { ListListenHistoryQueryDto } from "./dto/list-listen-history-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";
import { StreamEventService } from "../royalty/stream-event.service";
import { StreamSource } from "../entities/stream-event.entity";

@Controller("listen-history")
@UseGuards(AuthGuard)
export class ListenHistoryController {
  constructor(
    private readonly service: ListenHistoryService,
    private readonly streamEventService: StreamEventService,
  ) {}

  @Post()
  @HttpCode(204)
  async record(
    @Req() req: Request,
    @Body() dto: CreateListenHistoryDto,
  ): Promise<void> {
    const userId = (req as any).userId as number;

    // Record to Listen_History (user-facing history)
    await this.service.record(userId, dto);

    // Record to stream_events (royalty algorithm)
    await this.streamEventService.record(userId, {
      trackId:            dto.trackId,
      source:             dto.source ?? StreamSource.BROWSE,
      listenDurationSec:  dto.secondsPlayed,
      trackDurationSec:   dto.trackDurationSec,
    }).catch(() => {
      // Non-critical: don't fail the listen history recording
    });
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query() query: ListListenHistoryQueryDto,
  ): Promise<PaginatedResult<ListenHistoryDto>> {
    const userId = (req as any).userId as number;
    return this.service.findByUser(userId, query);
  }
}
