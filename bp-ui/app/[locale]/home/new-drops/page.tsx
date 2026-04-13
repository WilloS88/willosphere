"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Music, Clock } from "lucide-react";
import { PageHeader, Badge } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { TrackDto } from "@/app/types/track";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

export default function NewDropsPage() {
  const t           = useTranslations("Store");
  const { isDark }  = useTheme();

  const [tracks, setTracks]   = useState<TrackDto[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PaginatedResponse<TrackDto>>(`${API_ENDPOINTS.tracks.list}?limit=20&sortBy=createdAt&sortDir=DESC`)
      .then(({ data }) => {
        setTracks(data.data);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title={t("newDrops")} count={total} />
      <div
        className={`mb-5 flex items-center gap-3 rounded border p-3 ${
          isDark
            ? "border-fearyellow/20 bg-fearyellow/5"
            : "border-[#c4a800]/20 bg-[#c4a800]/5"
        }`}
      >
        <span className="animate-pulse-vhs text-lg">◉</span>
        <div>
          <div
            className={`text-xs font-bold tracking-wider ${isDark ? "text-fearyellow" : "text-[#c4a800]"}`}
          >
            {t("freshUploads")}
          </div>
          <div
            className={`mt-0.5 text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
          >
            {t("newRecordsAdded", { count: tracks.length })}
          </div>
        </div>
        <Badge variant="yellow" className="ml-auto">
          {t("new")}
        </Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`} />
        </div>
      ) : tracks.length === 0 ? (
        <div className={`py-16 text-center text-xs tracking-widest ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
          {t("noTracks")}
        </div>
      ) : (
        <div className="space-y-1">
          {tracks.map((track, i) => (
            <div
              key={track.id}
              className={`animate-slide-up flex items-center gap-3 rounded border px-3 py-2.5 transition-all hover:-translate-y-px cursor-pointer ${
                isDark
                  ? "border-royalblue/20 bg-vhs-card hover:border-royalblue/40"
                  : "border-[#a89888]/30 bg-white/80 hover:border-[#a89888]/50"
              }`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border overflow-hidden ${
                  isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#a89888]/40 bg-[#f5f0e8]"
                }`}
              >
                {track.coverImageUrl ? (
                  <img src={track.coverImageUrl} alt={track.title} className="h-full w-full object-cover" />
                ) : (
                  <Music size={16} className={isDark ? "text-vhs-muted" : "text-[#635b53]"} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-xs font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
                  {track.title}
                </div>
                <div className={`truncate text-xs tracking-wide ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
                  {track.artists.map(a => a.displayName).join(", ")}
                </div>
              </div>
              <div className={`flex items-center gap-1 text-xs ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
                <Clock size={11} />
                {Math.floor(track.durationSeconds / 60)}:{String(track.durationSeconds % 60).padStart(2, "0")}
              </div>
              <Badge variant="yellow">{t("new")}</Badge>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
