import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Track } from "../entities/track.entity";
import { TrackArtist } from "../entities/track-artist.entity";
import { TrackGenre } from "../entities/track-genre.entity";
import { Genre } from "../entities/genre.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { TrackDto } from "./dto/track.dto";
import { CreateTrackDto } from "./dto/create-track.dto";
import { UpdateTrackDto } from "./dto/update-track.dto";
import { ListTracksQueryDto } from "./dto/list-tracks-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { CloudFrontService } from "../common/cloudfront.service";

@Injectable()
export class TracksService {
  constructor(
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
    @InjectRepository(ArtistProfile)
    private readonly artistRepo: Repository<ArtistProfile>,
    @InjectDataSource()
    private readonly ds: DataSource,
    private readonly cf: CloudFrontService,
  ) {}

  async findAll(dto: ListTracksQueryDto): Promise<PaginatedResult<TrackDto>> {
    const page  = dto.page  ?? 1;
    const limit = dto.limit ?? 20;

    const ALLOWED_SORT: Record<string, string> = {
      title:     "t.title",
      duration:  "t.durationSeconds",
      bpm:       "t.bpm",
      price:     "t.price",
      createdAt: "t.createdAt",
    };
    const sortCol = (dto.sortBy && ALLOWED_SORT[dto.sortBy]) ? ALLOWED_SORT[dto.sortBy] : "t.createdAt";
    const sortDir = dto.sortDir ?? "DESC";

    const qb = this.trackRepo
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.trackArtists", "ta")
      .leftJoinAndSelect("ta.artist",      "ap")
      .leftJoinAndSelect("ap.user",        "u")
      .leftJoinAndSelect("t.trackGenres",  "tg")
      .leftJoinAndSelect("tg.genre",       "g");

    if(dto.title)
      qb.andWhere("t.title LIKE :title", { title: `%${dto.title}%` });

    if(dto.artistId)
      qb.andWhere("ta.artistId = :artistId", { artistId: dto.artistId });

    if(dto.genreId)
      qb.andWhere("tg.genreId = :genreId", { genreId: dto.genreId });

    qb.orderBy(sortCol, sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [tracks, total] = await qb.getManyAndCount();

    return {
      data: tracks.map((t) => this.signTrackUrls(TrackDto.fromEntity(t))),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<TrackDto> {
    const track = await this.trackRepo
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.trackArtists", "ta")
      .leftJoinAndSelect("ta.artist",      "ap")
      .leftJoinAndSelect("ap.user",        "u")
      .leftJoinAndSelect("t.trackGenres",  "tg")
      .leftJoinAndSelect("tg.genre",       "g")
      .where("t.id = :id", { id })
      .getOne();

    if (!track)
      throw new NotFoundException("Track not found");

    return this.signTrackUrls(TrackDto.fromEntity(track));
  }

  async create(dto: CreateTrackDto): Promise<TrackDto> {
    const hasPrimary = dto.artists.some((a) => a.role === "primary");

    if(!hasPrimary)
      throw new BadRequestException("At least one artist with role 'primary' is required");

    await this.validateArtistIds(dto.artists.map((a) => a.artistId));
    await this.validateGenreIds(dto.genreIds);

    const savedId = await this.ds.transaction(async (trx) => {
      const track = trx.getRepository(Track).create({
        title:           dto.title,
        durationSeconds: dto.durationSeconds,
        bpm:             dto.bpm ?? null,
        audioUrl:        dto.audioUrl,
        price:           dto.price != null ? String(dto.price) : null,
        coverImageUrl:   dto.coverImageUrl ?? null,
        albumId:         dto.albumId ?? null,
      });

      const saved = await trx.getRepository(Track).save(track);

      await trx.getRepository(TrackArtist).save(
        dto.artists.map((a) => ({
          trackId:  saved.id,
          artistId: a.artistId,
          role:     a.role,
        })),
      );

      if(dto.genreIds.length > 0) {
        await trx.getRepository(TrackGenre).save(
          dto.genreIds.map((genreId) => ({ trackId: saved.id, genreId })),
        );
      }

      return saved.id;
    });

    return this.findOne(savedId);
  }

  async update(id: number, dto: UpdateTrackDto): Promise<TrackDto> {
    const track = await this.trackRepo.findOne({ where: { id } });

    if(!track)
      throw new NotFoundException("Track not found");

    if(dto.artists !== undefined) {
      const hasPrimary = dto.artists.some((a) => a.role === "primary");

      if(!hasPrimary)
        throw new BadRequestException("At least one artist with role 'primary' is required");

      await this.validateArtistIds(dto.artists.map((a) => a.artistId));
    }

    if (dto.genreIds !== undefined)
      await this.validateGenreIds(dto.genreIds);

    await this.ds.transaction(async (trx) => {
      if(dto.title !== undefined)
        track.title                         = dto.title;
      if(dto.durationSeconds !== undefined)
        track.durationSeconds               = dto.durationSeconds;
      if(dto.bpm !== undefined)
        track.bpm                           = dto.bpm;
      if(dto.audioUrl !== undefined)
        track.audioUrl                      = dto.audioUrl;
      if(dto.price !== undefined)
        track.price                         = String(dto.price);
      if(dto.coverImageUrl !== undefined)
        track.coverImageUrl                 = dto.coverImageUrl;
      if(dto.albumId !== undefined)
        track.albumId                       = dto.albumId;

      await trx.getRepository(Track).save(track);

      if(dto.artists !== undefined) {
        await trx.getRepository(TrackArtist).delete({ trackId: id });
        await trx.getRepository(TrackArtist).save(
          dto.artists.map((a) => ({ trackId: id, artistId: a.artistId, role: a.role })),
        );
      }

      if(dto.genreIds !== undefined) {
        await trx.getRepository(TrackGenre).delete({ trackId: id });

        if(dto.genreIds.length > 0) {
          await trx.getRepository(TrackGenre).save(
            dto.genreIds.map((genreId) => ({ trackId: id, genreId })),
          );
        }
      }
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const track = await this.trackRepo.findOne({ where: { id } });

    if(!track)
      throw new NotFoundException("Track not found");

    await this.trackRepo.delete(id);
  }

  private async validateArtistIds(artistIds: number[]): Promise<void> {
    const unique = [...new Set(artistIds)];
    const found  = await this.artistRepo.findByIds(unique);

    if (found.length !== unique.length) {
      const foundIds  = found.map((a) => a.userId);
      const missing   = unique.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Artist profiles not found for ids: ${missing.join(", ")}`);
    }
  }

  private async validateGenreIds(genreIds: number[]): Promise<void> {
    if(genreIds.length === 0)
      return;

    const unique = [...new Set(genreIds)];
    const found  = await this.genreRepo.findByIds(unique);

    if (found.length !== unique.length) {
      const foundIds = found.map((g) => g.id);
      const missing  = unique.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Genres not found for ids: ${missing.join(", ")}`);
    }
  }

  private signTrackUrls(dto: TrackDto): TrackDto {
    dto.audioUrl = this.cf.signUrl(dto.audioUrl);
    if (dto.coverImageUrl) {
      dto.coverImageUrl = this.cf.signUrl(dto.coverImageUrl);
    }
    return dto;
  }
}
