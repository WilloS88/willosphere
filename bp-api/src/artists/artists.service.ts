import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { Role } from "../entities/role.enum";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.entity";
import { StreamEvent } from "../entities/stream-event.entity";
import { Track } from "../entities/track.entity";
import { ArtistDto } from "./dto/artist.dto";
import { ArtistStatsDto } from "./dto/artist-stats.dto";
import { BecomeArtistDto } from "./dto/become-artist.dto";
import { UpdateArtistProfileDto } from "./dto/update-artist-profile.dto";
import { ListArtistsQueryDto } from "./dto/list-artists-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { CloudFrontService } from "../common/cloudfront.service";

@Injectable()
export class ArtistsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(ArtistProfile)
    private readonly profileRepo: Repository<ArtistProfile>,
    @InjectRepository(StreamEvent)
    private readonly streamRepo: Repository<StreamEvent>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectDataSource()
    private readonly ds: DataSource,
    private readonly cf: CloudFrontService,
  ) {}

  private signProfileImage(dto: ArtistDto): ArtistDto {
    if(dto.profileImageUrl) {
      dto.profileImageUrl = this.cf.signUrl(dto.profileImageUrl);
    }
    return dto;
  }

  async findAll(dto: ListArtistsQueryDto): Promise<PaginatedResult<ArtistDto>> {
    const page  = dto.page  ?? 1;
    const limit = dto.limit ?? 20;

    const ALLOWED_SORT: Record<string, string> = {
      userId:      "ap.userId",
      displayName: "u.displayName",
      email:       "u.email",
      artistSince: "ap.artistSince",
      memberSince: "ap.createdAt",
    };
    const sortCol = (dto.sortBy && ALLOWED_SORT[dto.sortBy]) ? ALLOWED_SORT[dto.sortBy] : "ap.createdAt";
    const sortDir = dto.sortDir ?? "ASC";

    const qb = this.profileRepo
      .createQueryBuilder("ap")
      .innerJoinAndSelect("ap.user", "u");

    if (dto.displayName)
      qb.andWhere("u.displayName LIKE :dn", { dn: `%${dto.displayName}%` });

    if (dto.email)
      qb.andWhere("u.email LIKE :email", { email: `%${dto.email}%` });

    qb.orderBy(sortCol, sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [profiles, total] = await qb.getManyAndCount();

    return {
      data: profiles.map((p) => this.signProfileImage(ArtistDto.fromEntities(p.user, p))),
      total,
      page,
      limit,
    };
  }

  async findOne(userId: number): Promise<ArtistDto> {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ["user"],
    });

    if(!profile)
      throw new NotFoundException("Artist not found");

    return this.signProfileImage(ArtistDto.fromEntities(profile.user, profile));
  }

  async becomeArtist(userId: number, dto: BecomeArtistDto): Promise<ArtistDto> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ["roles"],
    });

    if(!user)
      throw new NotFoundException("User not found");

    const alreadyArtist = user.roles.some((r) => r.role === Role.ARTIST);

    if(alreadyArtist)
      throw new ConflictException("User is already an artist");

    return this.ds.transaction(async (trx) => {
      await trx.getRepository(UserRole).save({ userId, role: Role.ARTIST });

      const profile = trx.getRepository(ArtistProfile).create({
        userId,
        bio:            dto.bio ?? null,
        bannerImageUrl: dto.bannerImageUrl ?? null,
        artistSince:    dto.artistSince ?? null,
      });
      const savedProfile = await trx.getRepository(ArtistProfile).save(profile);

      return this.signProfileImage(ArtistDto.fromEntities(user, savedProfile));
    });
  }

  async updateProfile(userId: number, dto: UpdateArtistProfileDto): Promise<ArtistDto> {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ["user"],
    });

    if (!profile)
      throw new NotFoundException("Artist profile not found");

    if(dto.bio !== undefined)
      profile.bio             = dto.bio;
    if(dto.bannerImageUrl !== undefined)
      profile.bannerImageUrl  = dto.bannerImageUrl;
    if(dto.artistSince !== undefined)
      profile.artistSince     = dto.artistSince;

    const saved = await this.profileRepo.save(profile);

    return this.signProfileImage(ArtistDto.fromEntities(profile.user, saved));
  }

  async resign(userId: number): Promise<void> {
    const profile = await this.profileRepo.findOne({ where: { userId } });

    if (!profile)
      throw new NotFoundException("Artist profile not found");

    await this.ds.transaction(async (trx) => {
      await trx.getRepository(ArtistProfile).delete({ userId });
      await trx.getRepository(UserRole).delete({ userId, role: Role.ARTIST });
    });
  }

  async getStats(artistId: number): Promise<ArtistStatsDto> {
    const qb = this.streamRepo.createQueryBuilder("se");

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Total plays
    const totalPlays = await qb
      .clone()
      .where("se.artist_id = :artistId", { artistId })
      .getCount();

    // Plays today
    const playsToday = await qb
      .clone()
      .where("se.artist_id = :artistId", { artistId })
      .andWhere("DATE(se.created_at) = :today", { today: todayStr })
      .getCount();

    // Plays this month
    const playsThisMonth = await qb
      .clone()
      .where("se.artist_id = :artistId", { artistId })
      .andWhere("se.created_at >= :monthStart", { monthStart })
      .getCount();

    // Unique listeners this month
    const uniqueRow = await qb
      .clone()
      .select("COUNT(DISTINCT se.user_id)", "cnt")
      .where("se.artist_id = :artistId", { artistId })
      .andWhere("se.created_at >= :monthStart", { monthStart })
      .getRawOne();
    const uniqueListeners = Number(uniqueRow?.cnt ?? 0);

    // Top 5 tracks
    const topTracksRaw: { trackId: number; plays: string }[] = await qb
      .clone()
      .select("se.track_id", "trackId")
      .addSelect("COUNT(*)", "plays")
      .where("se.artist_id = :artistId", { artistId })
      .groupBy("se.track_id")
      .orderBy("plays", "DESC")
      .limit(5)
      .getRawMany();

    const topTracks = await Promise.all(
      topTracksRaw.map(async (row) => {
        const track = await this.trackRepo.findOne({ where: { id: row.trackId } });
        return {
          trackId: row.trackId,
          title: track?.title ?? "Unknown",
          coverImageUrl: track?.coverImageUrl
            ? this.cf.signUrl(track.coverImageUrl)
            : null,
          plays: Number(row.plays),
        };
      }),
    );

    // Daily plays (last 30 days)
    const dailyRaw: { date: string; plays: string }[] = await qb
      .clone()
      .select("DATE(se.created_at)", "date")
      .addSelect("COUNT(*)", "plays")
      .where("se.artist_id = :artistId", { artistId })
      .andWhere("se.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)")
      .groupBy("DATE(se.created_at)")
      .orderBy("date", "ASC")
      .getRawMany();

    const dailyPlays = dailyRaw.map((r) => ({
      date: typeof r.date === "string" ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10),
      plays: Number(r.plays),
    }));

    // Monthly plays (last 12 months)
    const monthlyRaw: { month: string; plays: string }[] = await qb
      .clone()
      .select("DATE_FORMAT(se.created_at, '%Y-%m')", "month")
      .addSelect("COUNT(*)", "plays")
      .where("se.artist_id = :artistId", { artistId })
      .andWhere("se.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)")
      .groupBy("month")
      .orderBy("month", "ASC")
      .getRawMany();

    const monthlyPlays = monthlyRaw.map((r) => ({
      month: r.month,
      plays: Number(r.plays),
    }));

    return {
      totalPlays,
      playsToday,
      playsThisMonth,
      uniqueListeners,
      topTracks,
      dailyPlays,
      monthlyPlays,
    };
  }
}
