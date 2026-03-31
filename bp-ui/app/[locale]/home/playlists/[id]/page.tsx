"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Clock, ListMusic, Music, Play } from "lucide-react";
import Link from "next/link";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { usePlayer } from "@/app/context/PlayerContext";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { PlaylistDto } from "@/app/types/playlist";
import type { TrackDto } from "@/app/types/track";
import { formatTime } from "@/lib/store-data";
import api from "@/lib/axios";

export default function PlaylistDetailPage() {
  const t              = useTranslations("Store");
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const { isDark }     = useStoreTheme();
  const { playTrack, track: currentTrack, isPlaying } = usePlayer();

  const [playlist, setPlaylist] = useState<PlaylistDto | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get<PlaylistDto>(API_ENDPOINTS.playlists.detail(Number(id)))
      .then(({ data }) => setPlaylist(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <span className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`} />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className={`py-32 text-center text-[11px] tracking-widest ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
        PLAYLIST_NOT_FOUND
      </div>
    );
  }

  const tracks: TrackDto[] = playlist.tracks?.map((pt) => pt.track) ?? [];

  return (
    <div className="min-h-full">
      <Link
        href={`/${locale}/home/playlists`}
        className={`mb-4 inline-flex items-center gap-1.5 text-xs tracking-widest transition-colors ${isDark ? "text-vhs-muted hover:text-vhs-white" : "text-[#8a8578] hover:text-[#2a2520]"}`}
      >
        <ArrowLeft size={12} /> {t("playlists").toUpperCase()}
      </Link>

      {/* Hero */}
      <div className={`relative mb-6 overflow-hidden rounded-lg ${isDark ? "bg-vhs-card border-royalblue/20" : "bg-white/80 border-[#c4b8a8]/30"} border`}>
        <div className="flex gap-5 p-5">
          <div className={`shrink-0 h-28 w-28 rounded-lg border flex items-center justify-center ${isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#c4b8a8]/40 bg-[#f5f0e8]"}`}>
            <ListMusic size={36} className={isDark ? "text-vhs-muted" : "text-[#8a8578]"} />
          </div>

          <div className="flex flex-col justify-end min-w-0">
            <div className={`text-xs tracking-widest mb-1 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
              PLAYLIST
            </div>
            <h1 className={`text-xl sm:text-2xl font-bold tracking-wide truncate mb-1 ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
              {playlist.title.toUpperCase()}
            </h1>
            <div className={`flex flex-wrap gap-4 text-xs tracking-widest ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
              <span>{playlist.trackCount} {t("tracksCount")}</span>
              {playlist.isCollaborative && (
                <span className={`${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}>COLLAB</span>
              )}
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
          <div className={`mb-3 text-[11px] tracking-widest font-bold ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
            {t("tracksSection")}
          </div>
          <div className="space-y-1">
            {(playlist.tracks ?? []).map((pt, i) => {
              const track  = pt.track;
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
                  <div className={`w-5 text-center text-xs tabular-nums shrink-0 ${active ? (isDark ? "text-vhs-cyan" : "text-[#c4234e]") : (isDark ? "text-vhs-muted" : "text-[#8a8578]")}`}>
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
                    <div className={`truncate text-[11px] tracking-wide ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
                      {track.artists.map((a) => a.displayName).join(", ")}
                    </div>
                  </div>

                  {track.price != null && (
                    <div className={`text-xs font-semibold tracking-wider shrink-0 ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}>
                      {track.price} CZK
                    </div>
                  )}

                  <div className={`flex items-center gap-1 text-xs tabular-nums shrink-0 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>
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
