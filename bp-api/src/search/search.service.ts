import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Track } from "../entities/track.entity";
import { ArtistProfile } from "../entities/artist-profile.entity";
import { Album } from "../entities/album.entity";
import { ListenHistory } from "../entities/listen-history.entity";
import { EngagementAction, EngagementActionType } from "../entities/engagement-action.entity";
import { CloudFrontService } from "../common/cloudfront.service";
import { SearchQueryDto } from "./dto/search-query.dto";
import {
  SearchResultDto,
  SearchTrackItem,
  SearchArtistItem,
  SearchAlbumItem,
} from "./dto/search-result.dto";

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Track)
    private readonly trackRepo: Repository<Track>,
    @InjectRepository(ArtistProfile)
    private readonly artistRepo: Repository<ArtistProfile>,
    @InjectRepository(Album)
    private readonly albumRepo: Repository<Album>,
    @InjectRepository(ListenHistory)
    private readonly historyRepo: Repository<ListenHistory>,
    @InjectRepository(EngagementAction)
    private readonly engageRepo: Repository<EngagementAction>,
    private readonly cf: CloudFrontService,
  ) {}

  async search(userId: number, dto: SearchQueryDto): Promise<SearchResultDto> {
    const limit = dto.limit ?? 5;
    const q     = dto.q?.trim();

    if(q && q.length > 0) {
      return this.searchByQuery(userId, q, limit);
    }

    return this.getSuggestions(userId, limit);
  }

  private async searchByQuery(
    userId: number,
    q:      string,
    limit:  number,
  ): Promise<SearchResultDto> {
    const pattern = `%${q}%`;

    const [tracks, artists, albums, likedTrackIds] = await Promise.all([
      this.searchTracks(pattern, limit),
      this.searchArtists(pattern, limit),
      this.searchAlbums(pattern, limit),
      this.getLikedTrackIds(userId),
    ]);

    // Personalizace: lajknuté skladby nahoru
    if(likedTrackIds.size > 0) {
      tracks.sort((a, b) => {
        const aLiked = likedTrackIds.has(a.id) ? 1 : 0;
        const bLiked = likedTrackIds.has(b.id) ? 1 : 0;

        return bLiked - aLiked;
      });
    }

    return { tracks, artists, albums };
  }

  private async getSuggestions(
    userId: number,
    limit:  number,
  ): Promise<SearchResultDto> {
    const [tracks, artists, albums] = await Promise.all([
      this.getRecentlyPlayed(userId, limit),
      this.getFavoriteArtists(userId, limit),
      this.getNewAlbums(limit),
    ]);

    return { tracks, artists, albums };
  }

  // ── Search mode queries
  private async searchTracks(
    pattern: string,
    limit:  number,
  ): Promise<SearchTrackItem[]> {
    const tracks = await this.trackRepo
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.trackArtists", "ta")
      .leftJoinAndSelect("ta.artist", "ap")
      .leftJoinAndSelect("ap.user", "u")
      .leftJoinAndSelect("t.trackGenres", "tg")
      .leftJoinAndSelect("tg.genre", "g")
      .where("t.title LIKE :pattern", { pattern })
      .orderBy("t.createdAt", "DESC")
      .take(limit)
      .getMany();

    return tracks.map((t) => this.mapTrack(t));
  }

  private async searchArtists(
    pattern: string,
    limit: number,
  ): Promise<SearchArtistItem[]> {
    const profiles = await this.artistRepo
      .createQueryBuilder("ap")
      .innerJoinAndSelect("ap.user", "u")
      .where("u.displayName LIKE :pattern", { pattern })
      .orderBy("u.displayName", "ASC")
      .take(limit)
      .getMany();

    return profiles.map((p) => this.mapArtist(p));
  }

  private async searchAlbums(
    pattern: string,
    limit: number,
  ): Promise<SearchAlbumItem[]> {
    const albums = await this.albumRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.albumArtists", "aa")
      .leftJoinAndSelect("aa.artist", "ap")
      .leftJoinAndSelect("ap.user", "u")
      .where("a.title LIKE :pattern", { pattern })
      .orderBy("a.createdAt", "DESC")
      .take(limit)
      .getMany();

    return albums.map((a) => this.mapAlbum(a));
  }

  // ── Suggestion mode queries
  private async getRecentlyPlayed(
    userId: number,
    limit: number,
  ): Promise<SearchTrackItem[]> {
    const history = await this.historyRepo
      .createQueryBuilder("h")
      .select("DISTINCT h.track_id", "trackId")
      .addSelect("MAX(h.listened_at)", "lastPlayed")
      .where("h.user_id = :userId", { userId })
      .groupBy("h.track_id")
      .orderBy("lastPlayed", "DESC")
      .limit(limit)
      .getRawMany<{ trackId: number }>();

    if (history.length === 0) return [];

    const trackIds = history.map((h) => h.trackId);

    const tracks = await this.trackRepo
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.trackArtists", "ta")
      .leftJoinAndSelect("ta.artist", "ap")
      .leftJoinAndSelect("ap.user", "u")
      .leftJoinAndSelect("t.trackGenres", "tg")
      .leftJoinAndSelect("tg.genre", "g")
      .whereInIds(trackIds)
      .getMany();

    const trackMap = new Map(tracks.map((t) => [t.id, t]));
    return trackIds
      .map((id) => trackMap.get(id))
      .filter(Boolean)
      .map((t) => this.mapTrack(t!));
  }

  private async getFavoriteArtists(
    userId: number,
    limit: number,
  ): Promise<SearchArtistItem[]> {
    const rows = await this.engageRepo
      .createQueryBuilder("e")
      .select("e.artist_id", "artistId")
      .addSelect("COUNT(*)", "cnt")
      .where("e.user_id = :userId", { userId })
      .andWhere("e.action_type IN (:...types)", {
        types: [EngagementActionType.LIKE_TRACK, EngagementActionType.FOLLOW_ARTIST],
      })
      .groupBy("e.artist_id")
      .orderBy("cnt", "DESC")
      .limit(limit)
      .getRawMany<{ artistId: number }>();

    if(rows.length === 0)
      return [];

    const artistIds = rows.map((r) => Number(r.artistId));

    const profiles = await this.artistRepo
      .createQueryBuilder("ap")
      .innerJoinAndSelect("ap.user", "u")
      .where("ap.userId IN (:...ids)", { ids: artistIds })
      .getMany();

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));
    return artistIds
      .map((id) => profileMap.get(id))
      .filter(Boolean)
      .map((p) => this.mapArtist(p!));
  }

  private async getNewAlbums(limit: number): Promise<SearchAlbumItem[]> {
    const albums = await this.albumRepo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.albumArtists", "aa")
      .leftJoinAndSelect("aa.artist", "ap")
      .leftJoinAndSelect("ap.user", "u")
      .orderBy("a.createdAt", "DESC")
      .take(limit)
      .getMany();

    return albums.map((a) => this.mapAlbum(a));
  }

  // ── Helpers

  private async getLikedTrackIds(userId: number): Promise<Set<number>> {
    const rows = await this.engageRepo
      .createQueryBuilder("e")
      .select("e.track_id", "trackId")
      .where("e.user_id = :userId", { userId })
      .andWhere("e.action_type = :type", { type: EngagementActionType.LIKE_TRACK })
      .getRawMany<{ trackId: number }>();

    return new Set(rows.map((r) => Number(r.trackId)));
  }

  private mapTrack(t: Track): SearchTrackItem {
    const item = new SearchTrackItem();
    item.id               = t.id;
    item.title            = t.title;
    item.durationSeconds  = t.durationSeconds;
    item.coverImageUrl    = t.coverImageUrl
      ? this.cf.signUrl(t.coverImageUrl)
      : null;
    item.artists = (t.trackArtists ?? []).map((ta) => ({
      artistId:         ta.artistId,
      displayName:      ta.artist.user.displayName,
      profileImageUrl:  ta.artist.user.profileImageUrl
        ? this.cf.signUrl(ta.artist.user.profileImageUrl)
        : null,
    }));
    item.genres = (t.trackGenres ?? []).map((tg) => ({
      id:   tg.genreId,
      name: tg.genre.name,
    }));
    return item;
  }

  private mapArtist(p: ArtistProfile): SearchArtistItem {
    const item = new SearchArtistItem();

    item.userId           = p.userId;
    item.displayName      = p.user.displayName;
    item.profileImageUrl  = p.user.profileImageUrl
      ? this.cf.signUrl(p.user.profileImageUrl)
      : null;
    return item;
  }

  private mapAlbum(a: Album): SearchAlbumItem {
    const item = new SearchAlbumItem();

    item.id             = a.id;
    item.title          = a.title;
    item.coverImageUrl  = a.coverImageUrl
      ? this.cf.signUrl(a.coverImageUrl)
      : null;
    item.artists = (a.albumArtists ?? []).map((aa) => ({
      artistId:     aa.artistId,
      displayName:  aa.artist.user.displayName,
    }));
    return item;
  }
}
