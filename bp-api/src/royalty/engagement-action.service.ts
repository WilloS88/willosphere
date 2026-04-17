import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  EngagementAction,
  EngagementActionType,
} from "../entities/engagement-action.entity";
import { CreateEngagementActionDto } from "./dto/create-engagement-action.dto";
import { PlaylistsService } from "../playlists/playlists.service";

/** Actions that are limited to once per artist per month */
const ONCE_PER_MONTH_ACTIONS: EngagementActionType[] = [
  EngagementActionType.FOLLOW_ARTIST,
  EngagementActionType.PURCHASE_MERCH,
];

@Injectable()
export class EngagementActionService {
  constructor(
    @InjectRepository(EngagementAction)
    private readonly repo: Repository<EngagementAction>,
    @Inject(forwardRef(() => PlaylistsService))
    private readonly playlistsService: PlaylistsService,
  ) {}

  async record(
    userId: number,
    dto: CreateEngagementActionDto,
  ): Promise<void> {
    // Dedup: once-per-month actions
    if (ONCE_PER_MONTH_ACTIONS.includes(dto.actionType)) {
      const existing = await this.repo
        .createQueryBuilder("ea")
        .where("ea.userId = :userId", { userId })
        .andWhere("ea.artistId = :artistId", { artistId: dto.artistId })
        .andWhere("ea.actionType = :actionType", { actionType: dto.actionType })
        .andWhere("ea.createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01')")
        .getOne();

      if(existing)
        return;
    }

    // Dedup: prevent duplicate like_track for the same user + track
    if(dto.actionType === EngagementActionType.LIKE_TRACK && dto.trackId) {
      const alreadyLiked = await this.repo.findOne({
        where: { userId, trackId: dto.trackId, actionType: EngagementActionType.LIKE_TRACK },
      });
      if(alreadyLiked)
        return;
    }

    const action = this.repo.create({
      userId,
      artistId:   dto.artistId,
      trackId:    dto.trackId ?? null,
      actionType: dto.actionType,
    });

    await this.repo.save(action);

    if (dto.actionType === EngagementActionType.LIKE_TRACK && dto.trackId) {
      await this.playlistsService.addTrackToLikedPlaylist(userId, dto.trackId);
    }
  }

  async getLikedTrackIds(userId: number): Promise<number[]> {
    const actions = await this.repo.find({
      where: {
        userId,
        actionType: EngagementActionType.LIKE_TRACK,
      },
      select: ["trackId"],
    });

    return actions
      .filter((a) => a.trackId != null)
      .map((a) => a.trackId as number);
  }

  async isLiked(userId: number, trackId: number): Promise<boolean> {
    const action = await this.repo.findOne({
      where: {
        userId,
        trackId,
        actionType: EngagementActionType.LIKE_TRACK,
      },
    });
    return !!action;
  }

  async unlike(userId: number, trackId: number): Promise<void> {
    await this.repo.delete({
      userId,
      trackId,
      actionType: EngagementActionType.LIKE_TRACK,
    });

    await this.playlistsService.removeTrackFromLikedPlaylist(userId, trackId);
  }
}
