import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { Album } from "../entities/album.entity";
import { AlbumArtist } from "../entities/album-artist.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { Track } from "../entities/track.entity";
import { AlbumDto } from "./dto/album.dto";
import { CreateAlbumDto } from "./dto/create-album.dto";
import { UpdateAlbumDto } from "./dto/update-album.dto";
import { ListAlbumsQueryDto } from "./dto/list-albums-query.dto";
import { TrackDto } from "../tracks/dto/track.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { CloudFrontService } from "../common/cloudfront.service";

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private readonly albumRepo: Repository<Album>,
    @InjectRepository(ArtistProfile)
    private readonly artistRepo: Repository<ArtistProfile>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectDataSource()
    private readonly ds: DataSource,
    private readonly cf: CloudFrontService,
  ) {}

  private signAlbumUrls(dto: AlbumDto): AlbumDto {
    if(dto.coverImageUrl) {
      dto.coverImageUrl = this.cf.signUrl(dto.coverImageUrl);
    }
    for (const a of dto.artists ?? []) {
      if(a.profileImageUrl) {
        a.profileImageUrl = this.cf.signUrl(a.profileImageUrl);
      }
    }
    for (const t of dto.tracks ?? []) {
      t.audioUrl = this.cf.signUrl(t.audioUrl);
      if(t.coverImageUrl) {
        t.coverImageUrl = this.cf.signUrl(t.coverImageUrl);
      }
      for (const a of t.artists ?? []) {
        if(a.profileImageUrl) {
          a.profileImageUrl = this.cf.signUrl(a.profileImageUrl);
        }
      }
    }
    return dto;
  }

  async findAll(dto: ListAlbumsQueryDto): Promise<PaginatedResult<AlbumDto>> {
    const page  = dto.page  ?? 1;
    const limit = dto.limit ?? 20;

    const ALLOWED_SORT: Record<string, string> = {
      title:       "a.title",
      releaseDate: "a.releaseDate",
      price:       "a.price",
      createdAt:   "a.createdAt",
    };
    const sortCol = (dto.sortBy && ALLOWED_SORT[dto.sortBy]) ? ALLOWED_SORT[dto.sortBy] : "a.createdAt";
    const sortDir = dto.sortDir ?? "DESC";

    const qb = this.albumRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.albumArtists", "aa")
      .leftJoinAndSelect("aa.artist",      "ap")
      .leftJoinAndSelect("ap.user",        "u");

    if (dto.title)
      qb.andWhere("a.title LIKE :title", { title: `%${dto.title}%` });

    if (dto.artistId)
      qb.andWhere("aa.artistId = :artistId", { artistId: dto.artistId });

    qb.orderBy(sortCol, sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [albums, total] = await qb.getManyAndCount();

    return {
      data: albums.map((a) => this.signAlbumUrls(AlbumDto.fromEntity(a))),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<AlbumDto> {
    const album = await this.albumRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.albumArtists",        "aa")
      .leftJoinAndSelect("aa.artist",              "ap")
      .leftJoinAndSelect("ap.user",                "u")
      .leftJoinAndSelect("a.tracks",               "t")
      .leftJoinAndSelect("t.trackArtists",         "ta")
      .leftJoinAndSelect("ta.artist",              "tap")
      .leftJoinAndSelect("tap.user",               "tu")
      .leftJoinAndSelect("t.trackGenres",          "tg")
      .leftJoinAndSelect("tg.genre",               "g")
      .where("a.id = :id", { id })
      .orderBy("t.createdAt", "ASC")
      .getOne();

    if(!album)
      throw new NotFoundException("Album not found");

    const tracks = album.tracks.map(TrackDto.fromEntity);
    return this.signAlbumUrls(AlbumDto.fromEntity(album, tracks));
  }

  async create(dto: CreateAlbumDto): Promise<AlbumDto> {
    const hasPrimary = dto.artists.some((a) => a.role === "primary");

    if(!hasPrimary)
      throw new BadRequestException("At least one artist with role 'primary' is required");

    await this.validateArtistIds(dto.artists.map((a) => a.artistId));

    if(dto.trackIds?.length)
      await this.validateTrackIds(dto.trackIds);

    const savedId = await this.ds.transaction(async (trx) => {
      const album = trx.getRepository(Album).create({
        title:        dto.title,
        releaseDate:  dto.releaseDate,
        coverImageUrl: dto.coverImageUrl,
        price:        String(dto.price),
      });
      const saved = await trx.getRepository(Album).save(album);

      await trx.getRepository(AlbumArtist).save(
        dto.artists.map((a) => ({
          albumId:  saved.id,
          artistId: a.artistId,
          role:     a.role,
        })),
      );

      if(dto.trackIds?.length) {
        await trx.getRepository(Track)
          .createQueryBuilder()
          .update()
          .set({ albumId: saved.id })
          .whereInIds(dto.trackIds)
          .execute();
      }

      return saved.id;
    });

    return this.findOne(savedId);
  }

  async update(id: number, dto: UpdateAlbumDto): Promise<AlbumDto> {
    const album = await this.albumRepo.findOne({ where: { id } });

    if(!album)
      throw new NotFoundException("Album not found");

    if(dto.artists !== undefined) {
      const hasPrimary = dto.artists.some((a) => a.role === "primary");

      if (!hasPrimary)
        throw new BadRequestException("At least one artist with role 'primary' is required");

      await this.validateArtistIds(dto.artists.map((a) => a.artistId));
    }

    if(dto.trackIds?.length)
      await this.validateTrackIds(dto.trackIds);

    await this.ds.transaction(async (trx) => {
      if (dto.title         !== undefined) album.title         = dto.title;
      if (dto.releaseDate   !== undefined) album.releaseDate   = dto.releaseDate;
      if (dto.coverImageUrl !== undefined) album.coverImageUrl = dto.coverImageUrl;
      if (dto.price         !== undefined) album.price         = String(dto.price);

      await trx.getRepository(Album).save(album);

      if(dto.artists !== undefined) {
        await trx.getRepository(AlbumArtist).delete({ albumId: id });
        await trx.getRepository(AlbumArtist).save(
          dto.artists.map((a) => ({ albumId: id, artistId: a.artistId, role: a.role })),
        );
      }

      if(dto.trackIds !== undefined) {
        // Detach currently linked tracks
        await trx.getRepository(Track)
          .createQueryBuilder()
          .update()
          .set({ albumId: null })
          .where("album_id = :id", { id })
          .execute();

        if(dto.trackIds.length) {
          await trx.getRepository(Track)
            .createQueryBuilder()
            .update()
            .set({ albumId: id })
            .whereInIds(dto.trackIds)
            .execute();
        }
      }
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const album = await this.albumRepo.findOne({ where: { id } });
    if (!album)
      throw new NotFoundException("Album not found");
    await this.albumRepo.delete(id);
  }

  private async validateArtistIds(artistIds: number[]): Promise<void> {
    const unique = [...new Set(artistIds)];
    const found  = await this.artistRepo.findBy({ userId: In(unique) });

    if (found.length !== unique.length) {
      const foundIds = found.map((a) => a.userId);
      const missing  = unique.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Artist profiles not found for ids: ${missing.join(", ")}`);
    }
  }

  private async validateTrackIds(trackIds: number[]): Promise<void> {
    const unique = [...new Set(trackIds)];
    const found  = await this.trackRepo.findBy({ id: In(unique) });

    if (found.length !== unique.length) {
      const foundIds = found.map((t) => t.id);
      const missing  = unique.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Tracks not found for ids: ${missing.join(", ")}`);
    }
  }
}
