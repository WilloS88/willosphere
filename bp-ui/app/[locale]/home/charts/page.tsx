"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Music, Flame, ListPlus } from "lucide-react";
import { PageHeader, Badge, LikeButton } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { usePlayer } from "@/app/context/PlayerContext";
import { PlaylistPicker } from "@/app/components/home/PlaylistPicker";
import TiltedCard from "@/app/components/ui/react-bits/TiltedCard";
import { cn } from "@/lib/utils";
import { VHSSpinner } from "@/app/components/ui/VHSSpinner";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { TrackDto } from "@/app/types/track";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

const CHART_COLORS = ["#00e5ff", "#9b59ff", "#ed2c5e", "#f4e526", "#00ff88"];

export default function ChartsPage() {
  const t           = useTranslations("Store");
  const { isDark }  = useTheme();
  const { playTrack, addToQueue, track: currentTrack, isPlaying, likedItems, toggleLike } = usePlayer();

  const [tracks, setTracks]   = useState<TrackDto[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PaginatedResponse<TrackDto>>(`${API_ENDPOINTS.tracks.list}?limit=20`)
      .then(({ data }) => {
        setTracks(data.data);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title={t("topCharts")} count={total} />

      {loading ? (
        <div className="flex justify-center py-16">
          <VHSSpinner size="lg" />
        </div>
      ) : tracks.length === 0 ? (
        <div className={`py-16 text-center text-xs tracking-widest ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
          {t("noTracks")}
        </div>
      ) : (
        <>
          {/* Featured #1 — with TiltedCard */}
          <div
            className={`mb-6 flex flex-col items-center gap-4 rounded border p-4 sm:flex-row sm:gap-6 sm:p-6 ${
              isDark
                ? "from-royalblue/20 border-fear/20 bg-gradient-to-r to-transparent"
                : "border-[#c4234e]/15 bg-gradient-to-r from-[#c4234e]/5 to-transparent"
            }`}
          >
            <div className="h-36 w-36 shrink-0 sm:h-44 sm:w-44">
              <TiltedCard
                containerHeight="100%"
                containerWidth="100%"
                imageHeight="140px"
                imageWidth="140px"
                rotateAmplitude={12}
                scaleOnHover={1.08}
                showMobileWarning={false}
                showTooltip={false}
                captionText=""
                imageSrc={tracks[0].coverImageUrl ?? `data:image/svg+xml,${encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${CHART_COLORS[0]}" stop-opacity="0.7"/><stop offset="100%" stop-color="#0b0f2d"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)" rx="12"/><text x="150" y="150" text-anchor="middle" fill="white" font-size="16" font-family="monospace">#1</text></svg>`,
                )}`}
                altText={tracks[0].title}
              />
            </div>
            <div>
              <Badge variant="fear" className="mb-2">
                #{1} {t("thisWeek")}
              </Badge>
              <h2
                className={`mt-2 text-lg font-bold tracking-[3px] sm:text-xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
              >
                {tracks[0].title}
              </h2>
              <p
                className={`mt-1 text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
              >
                {tracks[0].artists.map(a => a.displayName).join(", ")}
              </p>
            </div>
          </div>

          {/* Ranked list */}
          <div className="space-y-2">
            {tracks.map((track, i) => {
              const color = CHART_COLORS[i % CHART_COLORS.length];
              return (
                <div
                  key={track.id}
                  className={cn(
                    "animate-slide-up flex items-center gap-3 rounded border border-transparent p-2.5 transition-all sm:gap-4 sm:p-3 cursor-pointer",
                    isDark
                      ? "hover:bg-royalblue/10 hover:border-royalblue/20"
                      : "hover:border-[#a89888]/30 hover:bg-[#c4234e]/5",
                  )}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => playTrack(track, tracks, "browse")}
                >
                  <span className="text-fear min-w-[28px] text-center text-base font-bold sm:text-lg">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded sm:h-12 sm:w-12 ${isDark ? "bg-royalblue/30" : "bg-[#a89888]/20"}`}
                    style={{ color }}
                  >
                    {track.coverImageUrl ? (
                      <img src={track.coverImageUrl} alt={track.title} className="h-full w-full object-cover rounded" loading="lazy" />
                    ) : (
                      <Music size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-xs font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                    >
                      {track.title}
                    </div>
                    <div
                      className={`text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
                    >
                      {track.artists.map(a => a.displayName).join(", ")}
                    </div>
                  </div>
                  <div
                    className={`hidden text-xs tracking-wider sm:block ${isDark ? "text-vhs-light" : "text-[#524a44]"}`}
                  >
                    {track.durationSeconds ? `${Math.floor(track.durationSeconds / 60)}:${String(track.durationSeconds % 60).padStart(2, "0")}` : ""}
                  </div>
                  <span className="text-xs text-orange-400">{i < 3 ? <Flame size={12} /> : null}</span>
                  <span onClick={(e) => e.stopPropagation()}>
                    <LikeButton itemId={track.id} liked={likedItems.has(track.id)} onToggle={() => toggleLike(track.id, track)} />
                  </span>
                  <button
                    className={`hidden sm:block shrink-0 p-1 rounded transition-colors ${isDark ? "hover:bg-royalblue/20 text-vhs-muted hover:text-vhs-white" : "hover:bg-[#c4234e]/10 text-[#635b53] hover:text-[#2a2520]"}`}
                    title={t("addToQueue")}
                    onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
                  >
                    <ListPlus size={14} />
                  </button>
                  <span className="hidden sm:block">
                    <PlaylistPicker trackId={track.id} />
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
