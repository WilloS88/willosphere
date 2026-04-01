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

@Controller("listen-history")
@UseGuards(AuthGuard)
export class ListenHistoryController {
  constructor(private readonly service: ListenHistoryService) {}

  @Post()
  @HttpCode(204)
  record(
    @Req() req: Request,
    @Body() dto: CreateListenHistoryDto,
  ): Promise<void> {
    const userId = (req as any).userId as number;
    return this.service.record(userId, dto);
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
