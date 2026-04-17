"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Play, TrendingUp } from "lucide-react";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { AdminSpinner } from "@/app/components/admin";

type MonthlyRoyaltyDto = {
  id:                   number;
  artistId:             number;
  month:                string;
  basePayout:           string;
  discoveryBonus:       string;
  totalPayout:          string;
  totalWeightedStreams: string;
  uniqueListeners:      number;
  tier:                 "none" | "new" | "growing" | "emerging";
  artist?: {
    id:           number;
    displayName:  string;
    email:        string;
  };
};

const TIER_BADGE: Record<string, string> = {
  none:     "badge-ghost",
  new:      "badge-success",
  growing:  "badge-info",
  emerging: "badge-warning",
};

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPreviousMonth(): string {
  const now   = new Date();
  const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

export default function RoyaltiesPage() {
  const t                             = useTranslations("Admin");
  const [royalties, setRoyalties]     = useState<MonthlyRoyaltyDto[]>([]);
  const [loading, setLoading]         = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [month, setMonth]             = useState(getPreviousMonth());
  const [message, setMessage]         = useState<string | null>(null);

  const fetchRoyalties = (m: string) => {
    setLoading(true);
    api.get<MonthlyRoyaltyDto[]>(API_ENDPOINTS.adminRoyalties.list, {
      params: { month: m },
    })
      .then(({ data }) => setRoyalties(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoyalties(month);
  }, [month]);

  const runCalculation = async () => {
    setCalculating(true);
    setMessage(null);
    try {
      const { data } = await api.post<{ message: string }>(
        API_ENDPOINTS.adminRoyalties.calculate,
        { month },
      );
      setMessage(data.message);
      fetchRoyalties(month);
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? t("royaltiesCalcFailed"));
    } finally {
      setCalculating(false);
    }
  };

  const totalPayout = royalties.reduce(
    (sum, r) => sum + Number(r.totalPayout),
    0,
  );

  // Generate month options for the last 12 months
  const monthOptions: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthOptions.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="min-h-12 sm:h-14 bg-base-100 border-b border-base-300 flex items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} />
          <span className="font-semibold text-sm sm:text-lg">{t("royaltiesTitle")}</span>
        </div>
      </header>

      <main className="p-2 sm:p-4 flex-1 overflow-auto space-y-3 sm:space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="select select-bordered select-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={runCalculation}
            disabled={calculating}
          >
            {calculating ? (
              <AdminSpinner size="xs" />
            ) : (
              <Calculator size={14} />
            )}
            {t("royaltiesRunCalc")}
          </button>

          {message && (
            <div className="alert alert-info alert-sm py-1 px-3 text-sm">
              {message}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="stats stats-vertical sm:stats-horizontal shadow border border-base-300 w-full">
          <div className="stat">
            <div className="stat-title">{t("royaltiesArtists")}</div>
            <div className="stat-value text-xl">{royalties.length}</div>
          </div>
          <div className="stat">
            <div className="stat-title">{t("royaltiesTotalPayout")}</div>
            <div className="stat-value text-xl">{totalPayout.toFixed(2)} CZK</div>
          </div>
        </div>

        {/* Table */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <AdminSpinner size="lg" />
              </div>
            ) : royalties.length === 0 ? (
              <div className="text-center py-8 text-base-content/50">
                {t("royaltiesNoData")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra table-xs sm:table-sm">
                  <thead>
                    <tr>
                      <th>{t("royaltiesColArtist")}</th>
                      <th className="hidden sm:table-cell text-right">{t("royaltiesColBase")}</th>
                      <th className="hidden sm:table-cell text-right">{t("royaltiesColBonus")}</th>
                      <th className="text-right">{t("royaltiesColTotal")}</th>
                      <th className="hidden sm:table-cell text-right">{t("royaltiesColStreams")}</th>
                      <th className="hidden sm:table-cell text-right">{t("royaltiesColListeners")}</th>
                      <th>{t("royaltiesColTier")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {royalties.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="font-semibold">
                            {r.artist?.displayName ?? `Artist #${r.artistId}`}
                          </div>
                          <div className="text-xs text-base-content/50">
                            {r.artist?.email ?? ""}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell text-right font-mono">
                          {Number(r.basePayout).toFixed(2)}
                        </td>
                        <td className="hidden sm:table-cell text-right font-mono">
                          {Number(r.discoveryBonus).toFixed(2)}
                        </td>
                        <td className="text-right font-mono font-bold">
                          {Number(r.totalPayout).toFixed(2)}
                        </td>
                        <td className="hidden sm:table-cell text-right font-mono">
                          {Number(r.totalWeightedStreams).toFixed(2)}
                        </td>
                        <td className="hidden sm:table-cell text-right">{r.uniqueListeners}</td>
                        <td>
                          <span className={`badge badge-sm ${TIER_BADGE[r.tier]}`}>
                            {r.tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
