import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { AlgorithmConfig } from "../entities/algorithm-config.entity";
import { MonthlyRoyalty, RoyaltyTier } from "../entities/monthly-royalty.entity";

interface StreamRow {
  user_id:              number;
  artist_id:            number;
  source:               string;
  listen_duration_sec:  number;
  track_duration_sec:   number;
}

interface EngagementRow {
  user_id:    number;
  artist_id:  number;
  bonus:      number;
}

interface ArtistStats {
  artist_id:          number;
  total_streams:      number;
  unique_listeners:   number;
  avg_completion:     number;
  account_age_months: number;
}

@Injectable()
export class RoyaltyCalculationService {
  private readonly logger = new Logger(RoyaltyCalculationService.name);

  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
    @InjectRepository(AlgorithmConfig)
    private readonly configRepo: Repository<AlgorithmConfig>,
    @InjectRepository(MonthlyRoyalty)
    private readonly royaltyRepo: Repository<MonthlyRoyalty>,
  ) {}

  /** Runs on the 1st of each month at 2 AM */
  @Cron("0 2 1 * *")
  async handleMonthlyCron(): Promise<void> {
    const now       = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStr  = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
    this.logger.log(`Cron triggered: calculating royalties for ${monthStr}`);
    await this.calculateMonthlyRoyalties(monthStr);
  }

  /** Manual trigger for admin */
  async calculateMonthlyRoyalties(month: string): Promise<void> {
    this.logger.log(`Starting royalty calculation for ${month}`);

    // 1. Load config
    const config        = await this.loadConfig();
    const fPlatform     = config.get("F_platform") ?? 0.25;
    const dFundRate     = config.get("D_fund_rate") ?? 0.05;
    const tDiscovery    = config.get("T_discovery") ?? 1000;
    const tMinListen    = config.get("T_min_listen") ?? 30;
    const mActionCap    = config.get("M_action_cap") ?? 1.5;
    const tMinListeners = config.get("T_min_listeners") ?? 10;
    const tAccountAge   = config.get("T_account_age") ?? 24;

    const monthStart  = `${month}-01`;
    const monthEnd    = this.getMonthEnd(month);

    // 2. Load donation pool — actual donations per user for the month
    const userDonations = await this.getUserDonations(monthStart, monthEnd);
    const totalRevenue  = Array.from(userDonations.values()).reduce((a, b) => a + b, 0);

    if(totalRevenue === 0) {
      this.logger.warn(`No donations found for ${month} — nothing to distribute`);
      return;
    }

    this.logger.log(`Donation pool for ${month}: ${totalRevenue.toFixed(2)} CZK from ${userDonations.size} donors`);

    // 3. Load all valid stream events for the month
    const streams: StreamRow[] = await this.ds.query(
      `SELECT user_id, artist_id, source, listen_duration_sec, track_duration_sec
       FROM stream_events
       WHERE created_at >= ? AND created_at < ?
         AND listen_duration_sec >= ?`,
      [monthStart, monthEnd, tMinListen],
    );

    if (streams.length === 0) {
      this.logger.warn(`No valid streams found for ${month}`);
      return;
    }

    // 4. Load engagement actions for the month
    const engagementRows: EngagementRow[] = await this.ds.query(
      `SELECT
         user_id,
         artist_id,
         SUM(CASE action_type
           WHEN 'like_track'      THEN 0.05
           WHEN 'save_to_library' THEN 0.05
           WHEN 'add_to_playlist' THEN 0.08
           WHEN 'share_track'     THEN 0.10
           WHEN 'follow_artist'   THEN 0.15
           WHEN 'purchase_merch'  THEN 0.20
           ELSE 0
         END) AS bonus
       FROM engagement_actions
       WHERE created_at >= ? AND created_at < ?
       GROUP BY user_id, artist_id`,
      [monthStart, monthEnd],
    );

    // Build engagement lookup: "userId:artistId" -> bonus
    const engagementMap = new Map<string, number>();
    for (const row of engagementRows) {
      const key = `${row.user_id}:${row.artist_id}`;
      engagementMap.set(key, Math.min(Number(row.bonus), mActionCap - 1));
    }

    // 5. Compute per-stream weights and aggregate W(u, a)
    // Map: userId -> Map<artistId, totalWeight>
    const userArtistWeights = new Map<number, Map<number, number>>();

    for (const s of streams) {
      const mSource = this.getSourceMultiplier(s.source);
      const mListen = this.getListenMultiplier(
        s.listen_duration_sec,
        s.track_duration_sec,
      );

      if(mListen === 0)
        continue;

      const engKey    = `${s.user_id}:${s.artist_id}`;
      const engBonus  = engagementMap.get(engKey) ?? 0;
      const mAction   = Math.min(1.0 + engBonus, mActionCap);

      const weight    = 1.0 * mSource * mListen * mAction;

      if(!userArtistWeights.has(s.user_id)) {
        userArtistWeights.set(s.user_id, new Map());
      }
      const artistMap = userArtistWeights.get(s.user_id)!;
      artistMap.set(s.artist_id, (artistMap.get(s.artist_id) ?? 0) + weight);
    }

    // 6. User-centric allocation (donation-based)
    // Only users who donated contribute to payouts.
    // base_payout(a) = sum over donors [ donation_u * (1 - F) * share(u, a) ]
    const artistBasePayout      = new Map<number, number>();
    const artistWeightedStreams = new Map<number, number>();

    for (const [userId, artistMap] of userArtistWeights) {
      const donation = userDonations.get(userId) ?? 0;

      if(donation === 0)
        continue; // user didn't donate — no payout contribution

      const netDonation = donation * (1 - fPlatform);
      const totalW      = Array.from(artistMap.values()).reduce((a, b) => a + b, 0);

      if(totalW === 0)
        continue;

      for (const [artistId, weight] of artistMap) {
        const share   = weight / totalW;
        const payout  = netDonation * share;

        artistBasePayout.set(
          artistId,
          (artistBasePayout.get(artistId) ?? 0) + payout,
        );
        artistWeightedStreams.set(
          artistId,
          (artistWeightedStreams.get(artistId) ?? 0) + weight,
        );
      }
    }

    // 7. Discovery bonus
    const artistStats   = await this.getArtistStats(monthStart, monthEnd, tAccountAge);
    const discoveryFund = totalRevenue * dFundRate;

    const artistBonuses = new Map<number, { bonus: number; tier: RoyaltyTier }>();
    let totalBonuses    = 0;

    for (const stats of artistStats) {
      if(stats.total_streams >= tDiscovery)
        continue;
      if(stats.unique_listeners < tMinListeners)
        continue;
      if(stats.avg_completion < 0.5)
        continue;
      if(stats.account_age_months > tAccountAge)
        continue;

      const basePayout = artistBasePayout.get(stats.artist_id) ?? 0;

      if(basePayout === 0)
        continue;

      let tier:   RoyaltyTier;
      let dRate:  number;

      if(stats.total_streams < 100) {
        tier  = RoyaltyTier.NEW;
        dRate = 0.15;
      } else if (stats.total_streams < 500) {
        tier  = RoyaltyTier.GROWING;
        dRate = 0.10;
      } else {
        tier = RoyaltyTier.EMERGING;
        dRate = 0.05;
      }

      const bonus = basePayout * dRate;
      artistBonuses.set(stats.artist_id, { bonus, tier });
      totalBonuses += bonus;
    }

    // Proportional scaling if over fund
    let scalingFactor = 1;
    if(totalBonuses > discoveryFund && totalBonuses > 0) {
      scalingFactor = discoveryFund / totalBonuses;
    }

    // 7. Build unique listeners map
    const listenerCounts = await this.getUniqueListenerCounts(monthStart, monthEnd);

    // 8. Save results
    const royalties: Partial<MonthlyRoyalty>[] = [];

    for (const [artistId, basePayout] of artistBasePayout) {
      const bonusInfo       = artistBonuses.get(artistId);
      const discoveryBonus  = bonusInfo ? bonusInfo.bonus * scalingFactor : 0;
      const tier            = bonusInfo?.tier ?? RoyaltyTier.NONE;
      const totalPayout     = basePayout + discoveryBonus;

      royalties.push({
        artistId,
        month:                monthStart,
        basePayout:           basePayout.toFixed(2),
        discoveryBonus:       discoveryBonus.toFixed(2),
        totalPayout:          totalPayout.toFixed(2),
        totalWeightedStreams: (artistWeightedStreams.get(artistId) ?? 0).toFixed(4),
        uniqueListeners:      listenerCounts.get(artistId) ?? 0,
        tier,
      });
    }

    // Upsert into monthly_royalties
    for (const r of royalties) {
      await this.ds.query(
        `INSERT INTO monthly_royalties
           (artist_id, month, base_payout, discovery_bonus, total_payout, total_weighted_streams, unique_listeners, tier)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           base_payout              = VALUES(base_payout),
           discovery_bonus          = VALUES(discovery_bonus),
           total_payout             = VALUES(total_payout),
           total_weighted_streams   = VALUES(total_weighted_streams),
           unique_listeners         = VALUES(unique_listeners),
           tier                     = VALUES(tier),
           updated_at               = NOW()`,
        [
          r.artistId,
          r.month,
          r.basePayout,
          r.discoveryBonus,
          r.totalPayout,
          r.totalWeightedStreams,
          r.uniqueListeners,
          r.tier,
        ],
      );
    }

    this.logger.log(
      `Royalty calculation complete for ${month}: ${royalties.length} artists processed`,
    );
  }

  // --- Multiplier helpers ---

  private getSourceMultiplier(source: string): number {
    const map: Record<string, number> = {
      search:         1.5,
      artist_page:    1.4,
      direct_link:    1.3,
      user_playlist:  1.1,
      browse:         1.0,
      editorial:      1.0,
      algorithm:      0.8,
      radio:          0.7,
    };
    return map[source] ?? 1.0;
  }

  private getListenMultiplier(
    listenDuration: number,
    trackDuration:  number,
  ): number {
    if(trackDuration <= 0)
      return 1.0;

    const ratio = listenDuration / trackDuration;

    if(ratio < 0.10)
      return 0.0;
    if(ratio < 0.50)
      return 0.5;
    if(ratio < 0.75)
      return 0.8;
    if(ratio < 1.00)
      return 1.0;
    return 1.2;
  }

  // --- Data helpers ---

  private async loadConfig(): Promise<Map<string, number>> {
    const rows  = await this.configRepo.find();
    const map   = new Map<string, number>();

    for (const row of rows) {
      map.set(row.paramKey, Number(row.paramValue));
    }
    return map;
  }

  private getMonthEnd(month: string): string {
    const [year, m] = month.split("-").map(Number);
    const nextMonth = new Date(year, m, 1);

    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  }

  private async getArtistStats(
    monthStart:     string,
    monthEnd:       string,
    maxAccountAge:  number,
  ): Promise<ArtistStats[]> {
    return this.ds.query(
      `SELECT
         se.artist_id,
         COUNT(*) AS total_streams,
         COUNT(DISTINCT se.user_id) AS unique_listeners,
         AVG(se.listen_duration_sec / GREATEST(se.track_duration_sec, 1)) AS avg_completion,
         TIMESTAMPDIFF(MONTH, ap.created_at, NOW()) AS account_age_months
       FROM stream_events se
       JOIN ArtistProfile ap ON ap.user_id = se.artist_id
       WHERE se.created_at >= ? AND se.created_at < ?
       GROUP BY se.artist_id, ap.created_at`,
      [monthStart, monthEnd],
    );
  }

  /**
   * Load total donations per user for the given month from the Purchase table.
   * Every Purchase is treated as a platform donation.
   */
  private async getUserDonations(
    monthStart: string,
    monthEnd: string,
  ): Promise<Map<number, number>> {
    const rows: Array<{ user_id: number; total: string }> = await this.ds.query(
      `SELECT user_id, SUM(total_price) AS total
       FROM Purchase
       WHERE purchase_date >= ? AND purchase_date < ?
       GROUP BY user_id`,
      [monthStart, monthEnd],
    );
    const map = new Map<number, number>();
    for (const r of rows) {
      map.set(r.user_id, Number(r.total));
    }
    return map;
  }

  private async getUniqueListenerCounts(
    monthStart: string,
    monthEnd: string,
  ): Promise<Map<number, number>> {
    const rows: Array<{ artist_id: number; cnt: number }> = await this.ds.query(
      `SELECT artist_id, COUNT(DISTINCT user_id) AS cnt
       FROM stream_events
       WHERE created_at >= ? AND created_at < ?
       GROUP BY artist_id`,
      [monthStart, monthEnd],
    );
    const map = new Map<number, number>();
    for (const r of rows) {
      map.set(r.artist_id, Number(r.cnt));
    }
    return map;
  }
}
