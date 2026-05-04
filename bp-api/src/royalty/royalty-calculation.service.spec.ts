import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, getDataSourceToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { RoyaltyCalculationService } from "./royalty-calculation.service";
import { AlgorithmConfig } from "../entities/algorithm-config.entity";
import { MonthlyRoyalty } from "../entities/monthly-royalty.entity";

/**
 * Privátní pomocné metody jsou předmětem testů 1) a 2) — přístup přes
 * `(svc as unknown as PrivateAccessor)` zachovává typovou bezpečnost,
 * aniž by bylo nutné používat `any`.
 */
interface PrivateAccessor {
  getSourceMultiplier(source: string): number;
  getListenMultiplier(listened: number, total: number): number;
}

describe("RoyaltyCalculationService", () => {
  let service: RoyaltyCalculationService;
  let priv: PrivateAccessor;
  let configRepo: { find: jest.Mock };
  let royaltyRepo: { save: jest.Mock };
  let ds: { query: jest.Mock };

  beforeEach(async () => {
    configRepo = { find: jest.fn() };
    royaltyRepo = { save: jest.fn() };
    ds = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoyaltyCalculationService,
        { provide: getDataSourceToken(), useValue: ds as unknown as DataSource },
        { provide: getRepositoryToken(AlgorithmConfig), useValue: configRepo },
        { provide: getRepositoryToken(MonthlyRoyalty), useValue: royaltyRepo },
      ],
    }).compile();

    service = module.get<RoyaltyCalculationService>(RoyaltyCalculationService);
    priv = service as unknown as PrivateAccessor;
  });

  // ---------------------------------------------------------------------------
  // 1) Source multiplier — m_source ve váze W = 1.0 × m_source × m_listen × m_action
  describe("getSourceMultiplier", () => {
    test.each([
      ["search", 1.5],
      ["artist_page", 1.4],
      ["direct_link", 1.3],
      ["user_playlist", 1.1],
      ["browse", 1.0],
      ["editorial", 1.0],
      ["algorithm", 0.8],
      ["radio", 0.7],
      ["unknown_source", 1.0], // fallback
    ])("source=%s -> multiplier=%f", (source, expected) => {
      expect(priv.getSourceMultiplier(source)).toBeCloseTo(expected, 5);
    });
  });

  // 2) Listen multiplier — odměna podle dokončení (ratio = listened / total)
  describe("getListenMultiplier", () => {
    test.each([
      // Pod prahem 10 % → vyřazeno z výpočtu (m_listen = 0).
      [5, 200, 0.0],
      // 10 % až 50 % → 0.5×.
      [30, 200, 0.5],
      // 50 % až 75 % → 0.8×.
      [120, 200, 0.8],
      // 75 % až 100 % → 1.0×.
      [180, 200, 1.0],
      // 100 % a více → 1.2× (bonus za dokončení).
      [200, 200, 1.2],
      [400, 200, 1.2],
      // Bezpečné dělení nulou — defaultně 1.0.
      [10, 0, 1.0],
    ])(
      "listen=%i / total=%i -> multiplier=%f",
      (listen, total, expected) => {
        expect(priv.getListenMultiplier(listen, total)).toBeCloseTo(expected, 5);
      },
    );
  });

  // ---------------------------------------------------------------------------
  // 3) Plná integrace EWUC — user-centric split + filtry discovery bonusu.
  // Mockujeme všechny SQL dotazy (ds.query) a config (configRepo.find).
  describe("calculateMonthlyRoyalties (user-centric distribution)", () => {
    /**
     * Konfigurace algoritmu odpovídá výchozím hodnotám v calc service:
     *  F_platform = 0.25, T_min_listen = 30, M_action_cap = 1.5,
     *  T_discovery = 1000, T_min_listeners = 10, T_account_age = 24.
     */
    const buildConfig = () => [
      { paramKey: "F_platform", paramValue: "0.25" },
      { paramKey: "D_fund_rate", paramValue: "0.05" },
      { paramKey: "T_discovery", paramValue: "1000" },
      { paramKey: "T_min_listen", paramValue: "30" },
      { paramKey: "M_action_cap", paramValue: "1.5" },
      { paramKey: "T_min_listeners", paramValue: "10" },
      { paramKey: "T_account_age", paramValue: "24" },
    ];

    /**
     * Helper, který vyrobí ds.query implementation reagující podle SQL prefixu.
     * Pořadí volání v calc service:
     *   1. SELECT user_id, SUM(total_price) FROM Purchase ...        (donations)
     *   2. SELECT ... FROM stream_events ...                          (streams)
     *   3. SELECT ... SUM(CASE action_type ...) FROM engagement_actions (engagements)
     *   4. SELECT ... TIMESTAMPDIFF ... FROM stream_events ... ArtistProfile (stats)
     *   5. SELECT artist_id, COUNT(DISTINCT user_id) FROM stream_events (listenerCounts)
     *   6+. INSERT INTO monthly_royalties ON DUPLICATE KEY UPDATE     (upsert)
     */
    const buildQueryStub = (responses: {
      donations: Array<{ user_id: number; total: string }>;
      streams: Array<{
        user_id: number;
        artist_id: number;
        source: string;
        listen_duration_sec: number;
        track_duration_sec: number;
      }>;
      engagements?: Array<{ user_id: number; artist_id: number; bonus: string }>;
      stats?: Array<{
        artist_id: number;
        total_streams: number;
        unique_listeners: number;
        avg_completion: number;
        account_age_months: number;
      }>;
      listenerCounts?: Array<{ artist_id: number; cnt: number }>;
      onUpsert?: (params: unknown[]) => void;
    }) => {
      return jest.fn(async (sql: string, params: unknown[]) => {
        if (sql.includes("FROM Purchase")) return responses.donations;
        if (sql.includes("FROM stream_events") && sql.includes("listen_duration_sec >="))
          return responses.streams;
        if (sql.includes("FROM engagement_actions"))
          return responses.engagements ?? [];
        if (sql.includes("ArtistProfile")) return responses.stats ?? [];
        if (sql.includes("COUNT(DISTINCT user_id)"))
          return responses.listenerCounts ?? [];
        if (sql.startsWith("INSERT INTO monthly_royalties")) {
          responses.onUpsert?.(params);
          return [];
        }
        return [];
      });
    };

    it("splits a donor's contribution between artists proportionally to their weights", async () => {
      configRepo.find.mockResolvedValue(buildConfig());

      // Donor user 1 přispěl 100 CZK → po 25% platform fee zbývá 75 CZK netto.
      // Posloucha 2 umělce:
      //   artist 10: 1 stream search (1.5) + plný poslech (1.0) → weight 1.5
      //   artist 20: 1 stream browse (1.0) + plný poslech (1.0) → weight 1.0
      // share(10) = 1.5/2.5 = 0.6  → payout = 75 × 0.6 = 45 CZK
      // share(20) = 1.0/2.5 = 0.4  → payout = 75 × 0.4 = 30 CZK
      const upserts: Array<{ artistId: number; basePayout: number }> = [];

      ds.query = buildQueryStub({
        donations: [{ user_id: 1, total: "100" }],
        streams: [
          {
            user_id: 1,
            artist_id: 10,
            source: "search",
            listen_duration_sec: 200,
            track_duration_sec: 200,
          },
          {
            user_id: 1,
            artist_id: 20,
            source: "browse",
            listen_duration_sec: 200,
            track_duration_sec: 200,
          },
        ],
        // Discovery filtry zde naschvál neprojdou (mainstream tier),
        // aby výsledek nebyl ovlivněn discovery bonusem.
        stats: [
          {
            artist_id: 10,
            total_streams: 5000,
            unique_listeners: 500,
            avg_completion: 1.0,
            account_age_months: 60,
          },
          {
            artist_id: 20,
            total_streams: 5000,
            unique_listeners: 500,
            avg_completion: 1.0,
            account_age_months: 60,
          },
        ],
        listenerCounts: [
          { artist_id: 10, cnt: 1 },
          { artist_id: 20, cnt: 1 },
        ],
        onUpsert: (params) => {
          upserts.push({
            artistId: Number(params[0]),
            basePayout: Number(params[2]),
          });
        },
      });

      await service.calculateMonthlyRoyalties("2025-04");

      const byArtist = Object.fromEntries(
        upserts.map((u) => [u.artistId, u.basePayout]),
      );
      // Plný poslech (ratio=1.0) spadá do bucket >=1.0 → m_listen = 1.2.
      // Weight artist 10 = 1.5 × 1.2 = 1.80; weight artist 20 = 1.0 × 1.2 = 1.20.
      // Sum = 3.00. Share 10 = 0.60, share 20 = 0.40. Stejný poměr jako bez 1.2 bonusu.
      expect(byArtist[10]).toBeCloseTo(45, 1);
      expect(byArtist[20]).toBeCloseTo(30, 1);
    });

    it("excludes streams under the minimum listen threshold (m_listen = 0)", async () => {
      configRepo.find.mockResolvedValue(buildConfig());
      const upserts: Array<{ artistId: number; basePayout: number }> = [];

      // Stream pod 10% completion → m_listen = 0 → žádný payout.
      ds.query = buildQueryStub({
        donations: [{ user_id: 1, total: "100" }],
        streams: [
          {
            user_id: 1,
            artist_id: 10,
            source: "browse",
            listen_duration_sec: 35, // 35 / 400 = 0.0875 < 0.10
            track_duration_sec: 400,
          },
        ],
        stats: [],
        listenerCounts: [{ artist_id: 10, cnt: 1 }],
        onUpsert: (p) => upserts.push({ artistId: Number(p[0]), basePayout: Number(p[2]) }),
      });

      await service.calculateMonthlyRoyalties("2025-04");

      // Žádný stream s nenulovou váhou → žádný upsert.
      expect(upserts).toHaveLength(0);
    });

    it("ignores artists older than T_account_age in the discovery bonus", async () => {
      configRepo.find.mockResolvedValue(buildConfig());
      const upserts: Array<{ artistId: number; basePayout: number; discoveryBonus: number }> = [];

      // Umělec splňuje filtry kromě stáří účtu (60 > 24) → discovery bonus = 0,
      // ale base payout dostane.
      ds.query = buildQueryStub({
        donations: [{ user_id: 1, total: "100" }],
        streams: [
          {
            user_id: 1,
            artist_id: 10,
            source: "browse",
            listen_duration_sec: 200,
            track_duration_sec: 200,
          },
        ],
        stats: [
          {
            artist_id: 10,
            total_streams: 50, // < T_discovery (1000)
            unique_listeners: 30, // > T_min_listeners (10)
            avg_completion: 0.8, // > 0.5
            account_age_months: 60, // > T_account_age (24)  ← důvod vyřazení
          },
        ],
        listenerCounts: [{ artist_id: 10, cnt: 1 }],
        onUpsert: (p) =>
          upserts.push({
            artistId: Number(p[0]),
            basePayout: Number(p[2]),
            discoveryBonus: Number(p[3]),
          }),
      });

      await service.calculateMonthlyRoyalties("2025-04");

      expect(upserts).toHaveLength(1);
      expect(upserts[0].discoveryBonus).toBeCloseTo(0, 5);
      expect(upserts[0].basePayout).toBeGreaterThan(0);
    });

    it("excludes artists with too few unique listeners from the discovery bonus", async () => {
      configRepo.find.mockResolvedValue(buildConfig());
      const upserts: Array<{ artistId: number; discoveryBonus: number }> = [];

      ds.query = buildQueryStub({
        donations: [{ user_id: 1, total: "100" }],
        streams: [
          {
            user_id: 1,
            artist_id: 10,
            source: "browse",
            listen_duration_sec: 200,
            track_duration_sec: 200,
          },
        ],
        stats: [
          {
            artist_id: 10,
            total_streams: 50,
            unique_listeners: 5, // < T_min_listeners (10)  ← důvod vyřazení
            avg_completion: 0.8,
            account_age_months: 12,
          },
        ],
        listenerCounts: [{ artist_id: 10, cnt: 1 }],
        onUpsert: (p) =>
          upserts.push({
            artistId: Number(p[0]),
            discoveryBonus: Number(p[3]),
          }),
      });

      await service.calculateMonthlyRoyalties("2025-04");

      expect(upserts[0].discoveryBonus).toBeCloseTo(0, 5);
    });

    it("applies engagement bonus capped at M_action_cap (default 1.5)", async () => {
      configRepo.find.mockResolvedValue(buildConfig());
      const upserts: Array<{ basePayout: number }> = [];

      // Bonus 0.5 (90% of cap-1=0.5) — m_action = 1.0 + min(0.5, 0.5) = 1.5 = cap.
      // Druhý umělec bez engagementu → m_action = 1.0.
      ds.query = buildQueryStub({
        donations: [{ user_id: 1, total: "100" }],
        streams: [
          {
            user_id: 1,
            artist_id: 10,
            source: "browse", // m_source = 1.0
            listen_duration_sec: 200,
            track_duration_sec: 200, // m_listen = 1.2
          },
          {
            user_id: 1,
            artist_id: 20,
            source: "browse",
            listen_duration_sec: 200,
            track_duration_sec: 200,
          },
        ],
        engagements: [{ user_id: 1, artist_id: 10, bonus: "1.0" }],
        // Bonus se ořeže na (M_action_cap - 1) = 0.5 a poté m_action = 1.0 + 0.5 = 1.5.
        stats: [],
        listenerCounts: [],
        onUpsert: (p) => upserts.push({ basePayout: Number(p[2]) }),
      });

      await service.calculateMonthlyRoyalties("2025-04");

      // Weight 10 = 1.0 × 1.2 × 1.5 = 1.80; weight 20 = 1.0 × 1.2 × 1.0 = 1.20.
      // Donor netto 75 CZK; share 10 = 1.80 / 3.00 = 0.60 → payout 45 CZK.
      const byArtist = upserts.map((u) => u.basePayout).sort((a, b) => b - a);
      expect(byArtist[0]).toBeCloseTo(45, 1);
      expect(byArtist[1]).toBeCloseTo(30, 1);
    });
  });
});
