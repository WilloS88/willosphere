import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ListenHistory } from "../entities/listen-history.entity";
import { Track } from "../entities/track.entity";
import { CreateListenHistoryDto } from "./dto/create-listen-history.dto";
import { ListenHistoryDto } from "./dto/listen-history.dto";
import { ListListenHistoryQueryDto } from "./dto/list-listen-history-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { CloudFrontService } from "../common/cloudfront.service";

@Injectable()
export class ListenHistoryService {
  constructor(
    @InjectRepository(ListenHistory)
    private readonly repo: Repository<ListenHistory>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    private readonly cf: CloudFrontService,
  ) {}

  async record(
    userId: number,
    dto: CreateListenHistoryDto,
  ): Promise<void> {
    const trackExists = await this.trackRepo.findOne({
      where: { id: dto.trackId },
      select: ["id"],
    });

    if(!trackExists)
      throw new NotFoundException("Track not found");

    const recent = await this.repo
      .createQueryBuilder("lh")
      .where("lh.userId = :userId", { userId })
      .andWhere("lh.trackId = :trackId", { trackId: dto.trackId })
      .andWhere("lh.listenedAt > DATE_SUB(NOW(), INTERVAL 30 SECOND)")
      .getOne();

    if(recent)
      return;

    const entry = this.repo.create({
      userId,
      trackId: dto.trackId,
      secondsPlayed: dto.secondsPlayed,
      deviceInfo: dto.deviceInfo ?? null,
      listenedAt: new Date(),
    });

    await this.repo.save(entry);
  }

  async findByUser(
    userId: number,
    query:  ListListenHistoryQueryDto,
  ): Promise<PaginatedResult<ListenHistoryDto>> {
    const page  = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.repo
      .createQueryBuilder("lh")
      .leftJoinAndSelect("lh.track", "t")
      .where("lh.userId = :userId", { userId });

    if(query.trackId)
      qb.andWhere("lh.trackId = :trackId", { trackId: query.trackId });

    const ALLOWED_SORT: Record<string, string> = {
      listenedAt: "lh.listenedAt",
      secondsPlayed: "lh.secondsPlayed",
    };
    const sortCol =
      query.sortBy && ALLOWED_SORT[query.sortBy]
        ? ALLOWED_SORT[query.sortBy]
        : "lh.listenedAt";
    const sortDir = query.sortDir ?? "DESC";

    qb.orderBy(sortCol, sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [entries, total] = await qb.getManyAndCount();

    return {
      data: entries.map((e) => this.signUrls(ListenHistoryDto.fromEntity(e))),
      total,
      page,
      limit,
    };
  }

  private signUrls(dto: ListenHistoryDto): ListenHistoryDto {
    if(dto.track) {
      dto.track.audioUrl = this.cf.signUrl(dto.track.audioUrl);
      if(dto.track.coverImageUrl)
        dto.track.coverImageUrl = this.cf.signUrl(dto.track.coverImageUrl);
    }
    return dto;
  }
}
