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
import { TrackArtist } from "../entities/track-artist.entity";
import { PlaylistDto } from "./dto/playlist.dto";
import { CreatePlaylistDto } from "./dto/create-playlist.dto";
import { UpdatePlaylistDto } from "./dto/update-playlist.dto";
import { ListPlaylistsQueryDto } from "./dto/list-playlists-query.dto";
import { PaginatedResult } from "../common/dto/paginated-result";
import { Role } from "../entities/role.enum";
import { EngagementActionService } from "../royalty/engagement-action.service";
import { EngagementActionType } from "../entities/engagement-action.entity";

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,
    @InjectRepository(PlaylistTrack)
    private readonly playlistTrackRepo: Repository<PlaylistTrack>,
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectRepository(TrackArtist)
    private readonly trackArtistRepo: Repository<TrackArtist>,
    private readonly engagementService: EngagementActionService,
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

    if (playlist.isSystem)
      throw new ForbiddenException("System playlists cannot be modified");

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

    if (playlist.isSystem)
      throw new ForbiddenException("System playlists cannot be deleted");

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

    // Record engagement action for the royalty algorithm
    const primaryArtist = await this.trackArtistRepo.findOne({
      where: { trackId, role: "primary" },
      select: ["artistId"],
    });
    if(primaryArtist) {
      this.engagementService
        .record(requestingUserId, {
          actionType: EngagementActionType.ADD_TO_PLAYLIST,
          artistId: primaryArtist.artistId,
          trackId,
        })
        .catch(() => {});
    }

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

  async getOrCreateLikedPlaylist(userId: number): Promise<Playlist> {
    let playlist = await this.playlistRepo.findOne({
      where: { userId, isSystem: true },
    });

    if (!playlist) {
      playlist = this.playlistRepo.create({
        title:           "Liked Tracks",
        userId,
        isPublic:        false,
        isCollaborative: false,
        isSystem:        true,
      });
      playlist = await this.playlistRepo.save(playlist);
    }

    return playlist;
  }

  async addTrackToLikedPlaylist(userId: number, trackId: number): Promise<void> {
    const playlist = await this.getOrCreateLikedPlaylist(userId);

    const existing = await this.playlistTrackRepo.findOne({
      where: { playlistId: playlist.id, trackId },
    });
    if (existing) return;

    const maxResult = await this.playlistTrackRepo
      .createQueryBuilder("pt")
      .select("MAX(pt.position)", "max")
      .where("pt.playlistId = :id", { id: playlist.id })
      .getRawOne<{ max: number | null }>();

    const nextPosition = (maxResult?.max ?? 0) + 1;
    await this.playlistTrackRepo.save({ playlistId: playlist.id, trackId, position: nextPosition });
  }

  async removeTrackFromLikedPlaylist(userId: number, trackId: number): Promise<void> {
    const playlist = await this.playlistRepo.findOne({
      where: { userId, isSystem: true },
    });
    if (!playlist) return;

    const entry = await this.playlistTrackRepo.findOne({
      where: { playlistId: playlist.id, trackId },
    });
    if (!entry) return;

    await this.playlistTrackRepo.delete({ playlistId: playlist.id, position: entry.position });
  }

  private assertOwnerOrAdmin(ownerId: number, requestingUserId: number, requestingRoles: string[]): void {
    if(ownerId !== requestingUserId && !requestingRoles.includes(Role.ADMIN))
      throw new ForbiddenException("Access denied");
  }
}
