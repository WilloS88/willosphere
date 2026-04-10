import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { AuthGuard } from "../auth/guard/jwt-auth.guard";
import { EngagementActionService } from "./engagement-action.service";
import { CreateEngagementActionDto } from "./dto/create-engagement-action.dto";

@Controller("engagement-actions")
@UseGuards(AuthGuard)
export class EngagementController {
  constructor(private readonly service: EngagementActionService) {}

  @Post()
  @HttpCode(204)
  async record(
    @Req() req: Request,
    @Body() dto: CreateEngagementActionDto,
  ): Promise<void> {
    const userId = (req as any).userId as number;
    await this.service.record(userId, dto);
  }

  @Get("likes")
  async getLikes(@Req() req: Request): Promise<{ trackIds: number[] }> {
    const userId    = (req as any).userId as number;
    const trackIds  = await this.service.getLikedTrackIds(userId);

    return { trackIds };
  }

  @Delete("likes/:trackId")
  @HttpCode(204)
  async unlike(
    @Req() req: Request,
    @Param("trackId", ParseIntPipe) trackId: number,
  ): Promise<void> {
    const userId = (req as any).userId as number;
    await this.service.unlike(userId, trackId);
  }
}
