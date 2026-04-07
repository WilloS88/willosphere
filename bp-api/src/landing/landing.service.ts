import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { TracksService } from "../tracks/tracks.service";
import { TrackDto } from "../tracks/dto/track.dto";
import {
  LandingDto,
  LandingGenreDto,
  LandingStatsDto,
  SpotlightArtistDto,
} from "./landing.dto";

@Injectable()
export class LandingService {
  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
    private readonly tracksService: TracksService,
  ) {}

  async getLanding(): Promise<LandingDto> {
    const [stats, spotlightArtists, trendingTracks, genres] = await Promise.all([
      this.getStats(),
      this.getSpotlightArtists(),
      this.getTrendingTracks(),
      this.getGenres(),
    ]);

    return { stats, spotlightArtists, trendingTracks, genres };
  }

  private async getStats(): Promise<LandingStatsDto> {
    const rows: Array<{ tbl: string; cnt: string }> = await this.ds.query(`
      SELECT 'artists'   AS tbl, COUNT(*) AS cnt FROM ArtistProfile
      UNION ALL
      SELECT 'tracks',           COUNT(*)        FROM Track
      UNION ALL
      SELECT 'listeners',        COUNT(*)        FROM users
      UNION ALL
      SELECT 'plays',            COUNT(*)        FROM Listen_History
    `);

    const map = Object.fromEntries(rows.map((r) => [r.tbl, Number(r.cnt)]));

    return {
      totalArtists:   map.artists   ?? 0,
      totalTracks:    map.tracks    ?? 0,
      totalListeners: map.listeners ?? 0,
      totalPlays:     map.plays     ?? 0,
    };
  }

  private async getSpotlightArtists(): Promise<SpotlightArtistDto[]> {
    const rows: Array<{
      user_id:           number;
      display_name:      string;
      profile_image_url: string | null;
      track_count:       string;
    }> = await this.ds.query(`
      SELECT
        ap.user_id,
        u.display_name,
        u.profile_image_url,
        COUNT(ta.track_id) AS track_count
      FROM ArtistProfile ap
      JOIN users u          ON u.id = ap.user_id
      LEFT JOIN Track_Artist ta ON ta.artist_id = ap.user_id
      GROUP BY ap.user_id, u.display_name, u.profile_image_url
      ORDER BY track_count DESC
      LIMIT 4
    `);

    return rows.map((r) => ({
      userId:          r.user_id,
      displayName:     r.display_name,
      profileImageUrl: r.profile_image_url ?? null,
      trackCount:      Number(r.track_count),
    }));
  }

  private async getGenres(): Promise<LandingGenreDto[]> {
    const rows: Array<{
      id:          number;
      name:        string;
      track_count: string;
    }> = await this.ds.query(`
      SELECT g.id, g.name, COUNT(tg.track_id) AS track_count
      FROM Genre g
      LEFT JOIN Track_Genre tg ON tg.genre_id = g.id
      GROUP BY g.id, g.name
      ORDER BY track_count DESC
      LIMIT 8
    `);

    return rows.map((r) => ({
      id:         r.id,
      name:       r.name,
      trackCount: Number(r.track_count),
    }));
  }

  private async getTrendingTracks(): Promise<TrackDto[]> {
    const result = await this.tracksService.findAll({
      page:    1,
      limit:   6,
      sortBy:  "createdAt",
      sortDir: "DESC",
    });

    return result.data;
  }
}
