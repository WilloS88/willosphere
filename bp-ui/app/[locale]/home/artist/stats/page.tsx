"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, BarChart3, Music, Play, Users } from "lucide-react";

import { useTheme } from "@/lib/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { SectionLabel } from "@/app/components/ui/elastic-slider/StoreUI";
import { VHSSpinner } from "@/app/components/ui/VHSSpinner";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import api from "@/lib/axios";

interface TopTrack {
  trackId:        number;
  title:          string;
  coverImageUrl:  string | null;
  plays:          number;
}

interface ArtistStats {
  totalPlays:       number;
  playsToday:       number;
  playsThisMonth:   number;
  uniqueListeners:  number;
  topTracks:        TopTrack[];
  dailyPlays:       { date: string; plays: number }[];
  monthlyPlays:     { month: string; plays: number }[];
}

type ViewMode = "daily" | "monthly";

function StatsContent() {
  const { locale }    = useParams<{ locale: string }>();
  const { isDark }    = useTheme();
  const { session }   = useAuth();
  const t             = useTranslations("Artist");

  const [stats, setStats]       = useState<ArtistStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    api
      .get<ArtistStats>(API_ENDPOINTS.artists.stats)
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  const statCls   = `text-center p-4 rounded border ${isDark ? "bg-darkblue/60 border-royalblue/20" : "bg-[#ede7db]/60 border-[#a89888]/20"}`;
  const cardCls   = `rounded border p-5 sm:p-6 ${isDark ? "bg-vhs-card/60 border-royalblue/20" : "border-[#a89888]/30 bg-white/70"}`;
  const mutedCls  = isDark ? "text-vhs-muted" : "text-[#635b53]";

  type ChartPoint = { key: string; label: string; plays: number };

  const chartData: ChartPoint[] = viewMode === "daily"
    ? (stats?.dailyPlays ?? []).map((d) => ({
        key:   d.date,
        label: d.date.slice(8),
        plays: d.plays,
      }))
    : (stats?.monthlyPlays ?? []).map((d) => ({
        key:   d.month,
        label: d.month.slice(5),
        plays: d.plays,
      }));

  const maxPlays = Math.max(...chartData.map((d) => d.plays), 1);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href={`/${locale}/home/artist`}
            className={`mb-2 flex items-center gap-1 text-xs tracking-widest uppercase no-underline ${mutedCls} hover:${isDark ? "text-fear" : "text-[#c4234e]"}`}
          >
            <ArrowLeft size={12} /> {t("back")}
          </Link>
          <SectionLabel className="mb-1">{t("stats")}</SectionLabel>
          <h1
            className={`text-2xl font-bold tracking-[3px] sm:text-3xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
          >
            {session?.user.displayName ?? "ARTIST"}
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <VHSSpinner />
        </div>
      ) : !stats || stats.totalPlays === 0 ? (
        <div className={`py-16 text-center text-xs tracking-widest uppercase ${mutedCls}`}>
          {t("noStatsYet")}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t("totalPlays"), value: stats.totalPlays, icon: <Play size={14} />, color: "text-vhs-green" },
              { label: t("playsToday"), value: stats.playsToday, icon: <BarChart3 size={14} />, color: "text-fear" },
              { label: t("playsThisMonth"), value: stats.playsThisMonth, icon: <Music size={14} />, color: "text-vhs-purple" },
              { label: t("uniqueListeners"), value: stats.uniqueListeners, icon: <Users size={14} />, color: "text-vhs-cyan" },
            ].map((s) => (
              <div key={s.label} className={statCls}>
                <div className={`mb-1 flex items-center justify-center gap-1 text-xs tracking-wider uppercase ${mutedCls}`}>
                  {s.icon} {s.label}
                </div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className={`mb-6 ${cardCls}`}>
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>
                {viewMode === "daily" ? t("last30days") : t("last12months")}
              </SectionLabel>
              <div className="flex gap-1">
                {(["daily", "monthly"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`cursor-pointer rounded-sm border px-3 py-1 text-xs font-bold tracking-[2px] uppercase transition-all ${
                      viewMode === mode
                        ? isDark
                          ? "border-fear bg-fear/10 text-fear"
                          : "border-[#c4234e] bg-[#c4234e]/10 text-[#c4234e]"
                        : isDark
                          ? "border-royalblue/30 text-vhs-muted hover:border-fear/30"
                          : "border-[#a89888]/30 text-[#635b53] hover:border-[#c4234e]/20"
                    }`}
                  >
                    {t(mode)}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className={`py-8 text-center text-xs tracking-widest uppercase ${mutedCls}`}>
                {t("noStatsYet")}
              </div>
            ) : (
              <div className="flex items-end gap-[2px] sm:gap-1" style={{ height: 160 }}>
                {chartData.map((d) => {
                  const height = Math.max((d.plays / maxPlays) * 100, 2);

                  return (
                    <div
                      key={d.key}
                      className="group relative flex flex-1 flex-col items-center justify-end"
                      style={{ height: "100%" }}
                    >
                      {/* Tooltip */}
                      <div
                        className={`pointer-events-none absolute -top-7 rounded px-2 py-0.5 text-[10px] font-bold opacity-0 transition-opacity group-hover:opacity-100 ${
                          isDark ? "bg-fear text-darkblue" : "bg-[#c4234e] text-white"
                        }`}
                      >
                        {d.plays}
                      </div>
                      <div
                        className={`w-full rounded-t transition-all ${isDark ? "bg-fear/70 group-hover:bg-fear" : "bg-[#c4234e]/60 group-hover:bg-[#c4234e]"}`}
                        style={{ height: `${height}%` }}
                      />
                      <div className={`mt-1 text-[8px] sm:text-[10px] ${mutedCls}`}>{d.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top tracks */}
          {stats.topTracks.length > 0 && (
            <div className={cardCls}>
              <SectionLabel className="mb-4">{t("topTracks")}</SectionLabel>
              <div className="space-y-1">
                {stats.topTracks.map((track, i) => (
                  <div
                    key={track.trackId}
                    className={`flex items-center gap-3 rounded border px-3 py-2 ${isDark ? "border-royalblue/20 bg-royalblue/5" : "border-[#a89888]/20 bg-[#faf8f5]"}`}
                  >
                    <div className={`w-5 text-center text-xs font-bold tabular-nums ${isDark ? "text-fear" : "text-[#c4234e]"}`}>
                      {i + 1}
                    </div>
                    {track.coverImageUrl ? (
                      <img
                        src={track.coverImageUrl}
                        alt={track.title}
                        className="h-8 w-8 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border ${isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#a89888]/30 bg-[#f5f0e8]"}`}
                      >
                        <Music size={11} className={mutedCls} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-xs font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
                        {track.title}
                      </div>
                    </div>
                    <div className={`shrink-0 text-xs font-bold tabular-nums ${isDark ? "text-vhs-green" : "text-[#c4234e]"}`}>
                      {track.plays} {t("plays").toLowerCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function ArtistStatsPage() {
  return <StatsContent />;
}
