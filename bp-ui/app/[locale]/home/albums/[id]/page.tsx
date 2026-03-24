"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Clock, Disc3, Music, Play } from "lucide-react";
import Link from "next/link";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { usePlayer } from "@/app/context/PlayerContext";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { AlbumDto } from "@/app/types/album";
import type { TrackDto } from "@/app/types/track";
import { formatTime } from "@/lib/store-data";
import api from "@/lib/axios";

export default function AlbumDetailPage() {
  const t              = useTranslations("Store");
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const { isDark }     = useStoreTheme();
  const { playTrack, track: currentTrack, isPlaying } = usePlayer();

  const [album, setAlbum]     = useState<AlbumDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!id)
      return;

    api.get<AlbumDto>(API_ENDPOINTS.albums.detail(Number(id)))
      .then(({ data }) => setAlbum(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if(loading) {
    return (
      <div className="flex justify-center py-32">
        <span className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`} />
      </div>
    );
  }

  if (!album) {
    return (
      <div
        className={`py-32 text-center text-[11px] tracking-widest ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
      >
        {t("albumNotFound")}
      </div>
    );
  }

  const tracks: TrackDto[] = album.tracks ?? [];

  return (
    <div className="min-h-full">
      <Link
        href={`/${locale}/home/albums`}
        className={`mb-4 inline-flex items-center gap-1.5 text-[10px] tracking-widest transition-colors ${isDark ? "text-vhs-muted hover:text-vhs-white" : "text-[#8a8578] hover:text-[#2a2520]"}`}
      >
        <ArrowLeft size={12} /> {t("albums").toUpperCase()}
      </Link>

      {/* Hero */}
      <div className={`relative mb-6 overflow-hidden rounded-lg ${isDark ? "bg-vhs-card border-royalblue/20" : "bg-white/80 border-[#c4b8a8]/30"} border`}>
        <div className="flex gap-5 p-5">
          <div className={`shrink-0 h-36 w-36 sm:h-44 sm:w-44 rounded-lg border overflow-hidden flex items-center justify-center ${isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#c4b8a8]/40 bg-[#f5f0e8]"}`}>
            {album.coverImageUrl ? (
              <img src={album.coverImageUrl} alt={album.title} className="h-full w-full object-cover" />
            ) : (
              <Disc3 size={40} className={isDark ? "text-vhs-muted" : "text-[#8a8578]"} />
            )}
          </div>

          <div className="flex flex-col justify-end min-w-0">
            <div className={`text-[10px] tracking-widest mb-1 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
              ALBUM
            </div>
            <h1 className={`text-xl sm:text-3xl font-bold tracking-wide truncate mb-1 ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
              {album.title.toUpperCase()}
            </h1>
            <div className={`text-[11px] tracking-wide mb-2 ${isDark ? "text-vhs-light" : "text-[#4a4540]"}`}>
              {album.artists.map((a) => a.displayName).join(", ")}
            </div>
            <div className={`flex flex-wrap gap-4 text-[10px] tracking-widest ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
              <span>{new Date(album.releaseDate).getFullYear()}</span>
              {tracks.length > 0 && <span>{tracks.length} {t("tracksCount")}</span>}
              <span className={`font-semibold ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}>
                {album.price} CZK
              </span>
            </div>
          </div>
        </div>
      </div>

      {tracks.length > 0 && (
        <button
          onClick={() => playTrack(tracks[0], tracks)}
          className="mb-5 flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-bold tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
          style={{ background: isDark ? "var(--color-fear)" : "#c4234e" }}
        >
          <Play size={14} fill="white" /> {t("playAll")}
        </button>
      )}

      {tracks.length > 0 && (
        <div>
          <div className={`mb-3 text-[9px] tracking-widest font-bold ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
            {t("tracksSection")}
          </div>
          <div className="space-y-1">
            {tracks.map((track, i) => {
              const active = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, tracks)}
                  className={`flex items-center gap-3 rounded border px-3 py-2.5 cursor-pointer transition-all hover:-translate-y-px ${
                    active
                      ? isDark ? "border-royalblue/60 bg-royalblue/10" : "border-[#c4234e]/40 bg-[#c4234e]/5"
                      : isDark ? "border-royalblue/20 bg-vhs-card hover:border-royalblue/40" : "border-[#c4b8a8]/30 bg-white/80 hover:border-[#c4b8a8]/60"
                  }`}
                >
                  <div className={`w-5 text-center text-[10px] tabular-nums shrink-0 ${active ? (isDark ? "text-vhs-cyan" : "text-[#c4234e]") : (isDark ? "text-vhs-muted" : "text-[#8a8578]")}`}>
                    {active && isPlaying
                      ? <span className="flex gap-[2px] items-end justify-center h-3">{[3,5,4].map((h, j) => <span key={j} className="w-[2px] bg-current rounded-full animate-pulse" style={{ height: `${h * 2}px`, animationDelay: `${j * 0.15}s` }} />)}</span>
                      : i + 1}
                  </div>

                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border overflow-hidden ${isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#c4b8a8]/40 bg-[#f5f0e8]"}`}>
                    {track.coverImageUrl
                      ? <img src={track.coverImageUrl} alt={track.title} className="h-full w-full object-cover" />
                      : <Music size={14} className={isDark ? "text-vhs-muted" : "text-[#8a8578]"} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`truncate text-[11px] font-bold tracking-wider ${active ? (isDark ? "text-fearyellow" : "text-[#c4234e]") : (isDark ? "text-vhs-white" : "text-[#2a2520]")}`}>
                      {track.title}
                    </div>
                    <div className={`truncate text-[9px] tracking-wide ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
                      {track.genres.map((g) => g.name).join(" · ")}
                    </div>
                  </div>

                  {track.price != null && (
                    <div className={`text-[10px] font-semibold tracking-wider shrink-0 ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}>
                      {track.price} CZK
                    </div>
                  )}

                  <div className={`flex items-center gap-1 text-[10px] tabular-nums shrink-0 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
                    <Clock size={10} />
                    {formatTime(track.durationSeconds)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tracks.length === 0 && (
        <div className={`py-8 text-center text-[11px] tracking-widest ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
          {t("noTracksYet")}
        </div>
      )}
    </div>
  );
}
