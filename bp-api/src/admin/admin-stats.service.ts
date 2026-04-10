import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { AdminStatsDto, RecentActivityItem } from "./dto/admin-stats.dto";

@Injectable()
export class AdminStatsService {
  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async getStats(): Promise<AdminStatsDto> {
    const [counts, streamsToday, donationStats, recentActivity] =
      await Promise.all([
        this.getCounts(),
        this.getStreamsToday(),
        this.getDonationStats(),
        this.getRecentActivity(),
      ]);

    return { ...counts, streamsToday, ...donationStats, recentActivity };
  }

  private async getCounts() {
    const rows: Array<{ tbl: string; cnt: string }> = await this.ds.query(`
      SELECT 'users'      AS tbl, COUNT(*) AS cnt FROM users
      UNION ALL
      SELECT 'artists',           COUNT(*)        FROM ArtistProfile
      UNION ALL
      SELECT 'tracks',            COUNT(*)        FROM Track
      UNION ALL
      SELECT 'albums',            COUNT(*)        FROM Album
      UNION ALL
      SELECT 'playlists',         COUNT(*)        FROM Playlist
      UNION ALL
      SELECT 'orders',            COUNT(*)        FROM Purchase
      UNION ALL
      SELECT 'revenue',           COALESCE(SUM(total_price), 0) FROM Purchase
    `);

    const map = Object.fromEntries(rows.map((r) => [r.tbl, Number(r.cnt)]));

    return {
      totalUsers:     map.users ?? 0,
      totalArtists:   map.artists ?? 0,
      totalTracks:    map.tracks ?? 0,
      totalAlbums:    map.albums ?? 0,
      totalPlaylists: map.playlists ?? 0,
      totalOrders:    map.orders ?? 0,
      totalRevenue:   map.revenue ?? 0,
    };
  }

  private async getStreamsToday(): Promise<number> {
    const [row]: [{ cnt: string }] = await this.ds.query(`
      SELECT COUNT(*) AS cnt
      FROM Listen_History
      WHERE listened_at >= CURDATE()
    `);

    return Number(row.cnt);
  }

  private async getDonationStats(): Promise<{
    donationPoolThisMonth: number;
    donationCountThisMonth: number;
    totalDonorsThisMonth: number;
  }> {
    const [row]: [{ pool: string; cnt: string; donors: string }] =
      await this.ds.query(`
        SELECT
          COALESCE(SUM(total_price), 0)    AS pool,
          COUNT(*)                          AS cnt,
          COUNT(DISTINCT user_id)           AS donors
        FROM Purchase
        WHERE purchase_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      `);

    return {
      donationPoolThisMonth:  Number(row.pool),
      donationCountThisMonth: Number(row.cnt),
      totalDonorsThisMonth:   Number(row.donors),
    };
  }

  private async getRecentActivity(): Promise<RecentActivityItem[]> {
    const rows: Array<{
      type:       string;
      user_name:  string;
      detail:     string | null;
      order_id:   number | null;
      timestamp:  Date;
    }> = await this.ds.query(`
      (
        SELECT
          'listen'        AS type,
          u.display_name  AS user_name,
          t.title         AS detail,
          NULL            AS order_id,
          lh.listened_at  AS timestamp
        FROM Listen_History lh
        JOIN users u ON u.id = lh.user_id
        JOIN Track t ON t.id = lh.track_id
        ORDER BY lh.listened_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT
          'signup'        AS type,
          u.display_name  AS user_name,
          NULL            AS detail,
          NULL            AS order_id,
          u.created_at    AS timestamp
        FROM users u
        ORDER BY u.created_at DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT
          'purchase'                                      AS type,
          u.display_name                                  AS user_name,
          CONCAT(p.total_price, ' ', p.currency_code)     AS detail,
          p.id                                            AS order_id,
          p.purchase_date                                 AS timestamp
        FROM Purchase p
        JOIN users u ON u.id = p.user_id
        ORDER BY p.purchase_date DESC
        LIMIT 3
      )
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    return rows.map((r) => ({
      type:       r.type as RecentActivityItem["type"],
      userName:   r.user_name,
      detail:     r.detail ?? null,
      orderId:    r.order_id ?? null,
      timestamp:  r.timestamp,
    }));
  }
}
