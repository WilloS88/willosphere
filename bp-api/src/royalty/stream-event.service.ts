import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StreamEvent, StreamSource } from "../entities/stream-event.entity";
import { TrackArtist } from "../entities/track-artist.entity";
import { Track } from "../entities/track.entity";
import { CreateStreamEventDto } from "./dto/create-stream-event.dto";

@Injectable()
export class StreamEventService {
  private readonly logger = new Logger(StreamEventService.name);

  constructor(
    @InjectRepository(StreamEvent)
    private readonly repo: Repository<StreamEvent>,
    @InjectRepository(TrackArtist)
    private readonly trackArtistRepo: Repository<TrackArtist>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
  ) {}

  async record(userId: number, dto: CreateStreamEventDto): Promise<void> {
    // Lookup primary artist for the track
    const primaryArtist = await this.trackArtistRepo.findOne({
      where: { trackId: dto.trackId, role: "primary" },
      select: ["artistId"],
    });

    if (!primaryArtist) {
      this.logger.warn(`No primary artist found for track ${dto.trackId}`);
      return;
    }

    // Anti-fraud: max 20 plays of same track per user per day
    const todayCount = await this.repo
      .createQueryBuilder("se")
      .where("se.userId = :userId", { userId })
      .andWhere("se.trackId = :trackId", { trackId: dto.trackId })
      .andWhere("se.createdAt >= CURDATE()")
      .getCount();

    if(todayCount >= 20) {
      this.logger.warn(
        `Anti-fraud: user ${userId} exceeded 20 plays for track ${dto.trackId} today`,
      );
      return;
    }

    // Resolve track duration if not provided
    let trackDurationSec = dto.trackDurationSec;

    if(!trackDurationSec) {
      const track = await this.trackRepo.findOne({
        where: { id: dto.trackId },
        select: ["durationSeconds"],
      });
      trackDurationSec = track?.durationSeconds ?? 0;
    }

    const event = this.repo.create({
      userId,
      trackId:            dto.trackId,
      artistId:           primaryArtist.artistId,
      source:             dto.source ?? StreamSource.BROWSE,
      listenDurationSec:  dto.listenDurationSec,
      trackDurationSec,
    });

    await this.repo.save(event);
  }
}
