import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Playlist } from "../entities/playlist.entity";
import { PlaylistTrack } from "../entities/playlist-track.entity";
import { Track } from "../entities/track.entity";
import { PlaylistDto } from "./dto/playlist.dto";
import { CreatePlaylistDto } from "./dto/create-playlist.dto";
import { UpdatePlaylistDto } from "./dto/update-playlist.dto";
import { ListPlaylistsQueryDto } from "./dto/list-playlists-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { Role } from "../entities/role.enum";

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,
    @InjectRepository(PlaylistTrack)
    private readonly playlistTrackRepo: Repository<PlaylistTrack>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
  ) {}

  async findAll(dto: ListPlaylistsQueryDto): Promise<PaginatedResult<PlaylistDto>> {
    const page  = dto.page  ?? 1;
    const limit = dto.limit ?? 20;

    const ALLOWED_SORT: Record<string, string> = {
      title:     "p.title",
      createdAt: "p.createdAt",
    };
    const sortCol = (dto.sortBy && ALLOWED_SORT[dto.sortBy]) ? ALLOWED_SORT[dto.sortBy] : "p.createdAt";
    const sortDir = dto.sortDir ?? "DESC";

    const qb = this.playlistRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.playlistTracks", "pt");

    if(dto.title)
      qb.andWhere("p.title LIKE :title", { title: `%${dto.title}%` });

    if(dto.userId)
      qb.andWhere("p.userId = :userId", { userId: dto.userId });

    if(dto.isPublic !== undefined)
      qb.andWhere("p.isPublic = :isPublic", { isPublic: dto.isPublic ? 1 : 0 });

    qb.orderBy(sortCol, sortDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [playlists, total] = await qb.getManyAndCount();

    return {
      data: playlists.map((p) => PlaylistDto.fromEntity(p)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<PlaylistDto> {
    const playlist = await this.playlistRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.playlistTracks",         "pt")
      .leftJoinAndSelect("pt.track",                 "t")
      .leftJoinAndSelect("t.trackArtists",           "ta")
      .leftJoinAndSelect("ta.artist",                "ap")
      .leftJoinAndSelect("ap.user",                  "u")
      .leftJoinAndSelect("t.trackGenres",            "tg")
      .leftJoinAndSelect("tg.genre",                 "g")
      .where("p.id = :id", { id })
      .addOrderBy("pt.position", "ASC")
      .getOne();

    if(!playlist)
      throw new NotFoundException("Playlist not found");

    return PlaylistDto.fromEntity(playlist, true);
  }

  async create(dto: CreatePlaylistDto, userId: number): Promise<PlaylistDto> {
    const playlist = this.playlistRepo.create({
      title:           dto.title,
      userId,
      isPublic:        dto.isPublic         ?? false,
      isCollaborative: dto.isCollaborative  ?? false,
    });
    const saved = await this.playlistRepo.save(playlist);
    return this.findOne(saved.id);
  }

  async update(
    id:               number,
    dto:              UpdatePlaylistDto,
    requestingUserId: number,
    requestingRoles:  string[],
  ): Promise<PlaylistDto> {
    const playlist = await this.playlistRepo.findOne({ where: { id } });

    if (!playlist)
      throw new NotFoundException("Playlist not found");

    this.assertOwnerOrAdmin(playlist.userId, requestingUserId, requestingRoles);

    if(dto.title           !== undefined) playlist.title           = dto.title;
    if(dto.isPublic        !== undefined) playlist.isPublic        = dto.isPublic;
    if(dto.isCollaborative !== undefined) playlist.isCollaborative = dto.isCollaborative;

    await this.playlistRepo.save(playlist);
    return this.findOne(id);
  }

  async remove(id: number, requestingUserId: number, requestingRoles: string[]): Promise<void> {
    const playlist = await this.playlistRepo.findOne({ where: { id } });

    if(!playlist)
      throw new NotFoundException("Playlist not found");

    this.assertOwnerOrAdmin(playlist.userId, requestingUserId, requestingRoles);
    await this.playlistRepo.delete(id);
  }

  async addTrack(id: number, trackId: number, requestingUserId: number, requestingRoles: string[]): Promise<PlaylistDto> {
    const playlist = await this.playlistRepo.findOne({ where: { id } });

    if(!playlist)
      throw new NotFoundException("Playlist not found");

    this.assertOwnerOrAdmin(playlist.userId, requestingUserId, requestingRoles);
    const track = await this.trackRepo.findOne({ where: { id: trackId } });

    if(!track)
      throw new NotFoundException("Track not found");

    const existing = await this.playlistTrackRepo.findOne({
      where: { playlistId: id, trackId },
    });

    if(existing)
      throw new ConflictException("Track already in playlist");

    const maxResult = await this.playlistTrackRepo
      .createQueryBuilder("pt")
      .select("MAX(pt.position)", "max")
      .where("pt.playlistId = :id", { id })
      .getRawOne<{ max: number | null }>();

    const nextPosition = (maxResult?.max ?? 0) + 1;

    await this.playlistTrackRepo.save({ playlistId: id, trackId, position: nextPosition });
    return this.findOne(id);
  }

  async removeTrack(id: number, trackId: number, requestingUserId: number, requestingRoles: string[]): Promise<PlaylistDto> {
    const playlist = await this.playlistRepo.findOne({ where: { id } });

    if(!playlist)
      throw new NotFoundException("Playlist not found");

    this.assertOwnerOrAdmin(playlist.userId, requestingUserId, requestingRoles);

    const entry = await this.playlistTrackRepo.findOne({
      where: { playlistId: id, trackId },
    });

    if(!entry)
      throw new NotFoundException("Track not in playlist");

    await this.playlistTrackRepo.delete({ playlistId: id, position: entry.position });
    return this.findOne(id);
  }

  private assertOwnerOrAdmin(ownerId: number, requestingUserId: number, requestingRoles: string[]): void {
    if(ownerId !== requestingUserId && !requestingRoles.includes(Role.ADMIN))
      throw new ForbiddenException("Access denied");
  }
}
