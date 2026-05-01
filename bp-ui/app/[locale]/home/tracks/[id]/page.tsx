"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Clock, ListPlus, Music, Play } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/hooks";
import { usePlayer } from "@/app/context/PlayerContext";
import { VHSSpinner } from "@/app/components/ui/VHSSpinner";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { ShareButton } from "@/app/components/home/ShareButton";
import { LikeButton } from "@/app/components/ui/elastic-slider/StoreUI";
import { PlaylistPicker } from "@/app/components/home/PlaylistPicker";
import { formatTime } from "@/lib/store-data";
import type { TrackDto } from "@/app/types/track";
import api from "@/lib/axios";

export default function TrackDetailPage() {
  const t              = useTranslations("Store");
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const { isDark }     = useTheme();
  const [track, setTrack]     = useState<TrackDto | null>(null);
  const [loading, setLoading] = useState(true);

  const { playTrack, addToQueue, track: currentTrack, isPlaying, likedItems, toggleLike } = usePlayer();

  useEffect(() => {
    if (!id) return;

    api.get<TrackDto>(API_ENDPOINTS.tracks.detail(Number(id)))
      .then(({ data }) => setTrack(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <VHSSpinner size="lg" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className={`py-32 text-center text-xs tracking-widest uppercase ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
        {t("trackNotFound")}
      </div>
    );
  }

  const active = currentTrack?.id === track.id;

  return (
    <div className="min-h-full">
      <Link
        href={`/${locale}/home/tracks`}
        className={`mb-4 inline-flex items-center gap-1.5 text-xs tracking-widest transition-colors ${isDark ? "text-vhs-muted hover:text-vhs-white" : "text-[#635b53] hover:text-[#2a2520]"}`}
      >
        <ArrowLeft size={12} /> <span className="uppercase">{t("tracks")}</span>
      </Link>

      {/* Hero */}
      <div className={`relative mb-6 overflow-hidden rounded-lg ${isDark ? "bg-vhs-card border-royalblue/20" : "bg-white/80 border-[#a89888]/30"} border`}>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 p-4 sm:p-5">
          <div className={`shrink-0 h-28 w-28 sm:h-44 sm:w-44 rounded-lg border overflow-hidden flex items-center justify-center ${isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#a89888]/40 bg-[#f5f0e8]"}`}>
            {track.coverImageUrl ? (
              <img src={track.coverImageUrl} alt={track.title} className="h-full w-full object-cover" />
            ) : (
              <Music size={40} className={isDark ? "text-vhs-muted" : "text-[#635b53]"} />
            )}
          </div>

          <div className="flex flex-col justify-end min-w-0">
            <div className={`text-xs tracking-widest mb-1 uppercase ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
              {t("track")}
            </div>
            <h1 className={`text-xl sm:text-3xl font-bold tracking-wide truncate mb-1 ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
              {track.title.toUpperCase()}
            </h1>
            <div className={`text-xs tracking-wide mb-2 ${isDark ? "text-vhs-light" : "text-[#4a4540]"}`}>
              {track.artists.map((a) => a.displayName).join(", ")}
            </div>
            <div className={`flex flex-wrap gap-4 text-xs tracking-widest ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
              <span className="flex items-center gap-1"><Clock size={10} /> {formatTime(track.durationSeconds)}</span>
              {track.bpm && <span>{track.bpm} BPM</span>}
              {track.genres.length > 0 && <span>{track.genres.map((g) => g.name).join(" · ")}</span>}
              {track.price != null && (
                <span className={`font-semibold ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}>
                  {track.price} CZK
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => playTrack(track, [track], "direct_link")}
          className="flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
          style={{ background: isDark ? "var(--color-fear)" : "#c4234e" }}
        >
          <Play size={14} fill="white" /> <span className="uppercase">{t("playAll")}</span>
        </button>

        <span onClick={(e) => e.stopPropagation()}>
          <LikeButton itemId={track.id} liked={likedItems.has(track.id)} onToggleAction={() => toggleLike(track.id, track)} />
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
          title={t("addToQueue")}
          className={`p-2 rounded-full border transition-colors ${isDark ? "border-royalblue/30 hover:bg-royalblue/20 text-vhs-muted hover:text-vhs-white" : "border-[#a89888]/40 hover:bg-[#c4234e]/10 text-[#635b53] hover:text-[#2a2520]"}`}
        >
          <ListPlus size={16} />
        </button>

        <PlaylistPicker trackId={track.id} />

        <ShareButton track={track} size={16} />
      </div>

      {/* Track info table */}
      <div className={`rounded-lg border p-4 ${isDark ? "bg-vhs-card border-royalblue/20" : "bg-white/80 border-[#a89888]/30"}`}>
        <div className={`text-xs tracking-widest font-bold mb-3 uppercase ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
          {t("details")}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-xs tracking-wider">
          <dt className={isDark ? "text-vhs-muted" : "text-[#635b53]"}>{t("artists")}</dt>
          <dd className={isDark ? "text-vhs-white" : "text-[#2a2520]"}>{track.artists.map((a) => a.displayName).join(", ")}</dd>

          {track.genres.length > 0 && (
            <>
              <dt className={isDark ? "text-vhs-muted" : "text-[#635b53]"}>{t("genres")}</dt>
              <dd className={isDark ? "text-vhs-white" : "text-[#2a2520]"}>{track.genres.map((g) => g.name).join(", ")}</dd>
            </>
          )}

          <dt className={isDark ? "text-vhs-muted" : "text-[#635b53]"}>{t("duration")}</dt>
          <dd className={isDark ? "text-vhs-white" : "text-[#2a2520]"}>{formatTime(track.durationSeconds)}</dd>

          {track.bpm && (
            <>
              <dt className={isDark ? "text-vhs-muted" : "text-[#635b53]"}>BPM</dt>
              <dd className={isDark ? "text-vhs-white" : "text-[#2a2520]"}>{track.bpm}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
