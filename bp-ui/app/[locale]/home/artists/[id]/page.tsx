"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Music, Clock, Play, ArrowLeft, CalendarDays, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/lib/hooks";
import { usePlayer } from "@/app/context/PlayerContext";
import { PlaylistPicker } from "@/app/components/home/PlaylistPicker";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { ArtistDto } from "@/app/types/user";
import type { TrackDto } from "@/app/types/track";
import type { PaginatedResponse } from "@/app/types/pagination";
import { formatTime } from "@/lib/store-data";
import api from "@/lib/axios";

export default function ArtistDetailPage() {
  const t                = useTranslations("Store");
  const { id, locale }   = useParams<{ id: string; locale: string }>();
  const { isDark }       = useTheme();
  const { playTrack, track: currentTrack, isPlaying } = usePlayer();

  const [artist, setArtist]   = useState<ArtistDto | null>(null);
  const [tracks, setTracks]   = useState<TrackDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if(!id)
      return;

    Promise.all([
      api.get<ArtistDto>(API_ENDPOINTS.artists.detail(Number(id))),
      api.get<PaginatedResponse<TrackDto>>(`${API_ENDPOINTS.tracks.list}?artistId=${id}&limit=50`),
    ])
      .then(([artistRes, tracksRes]) => {
        setArtist(artistRes.data);
        setTracks(tracksRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  if(loading) {
    return (
      <div className="flex justify-center py-32">
        <span className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`} />
      </div>
    );
  }

  if(!artist) {
    return (
      <div className={`py-32 text-center text-[11px] tracking-widest ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
        {t("artistNotFound")}
      </div>
    );
  }
  return (
    <div className="min-h-full">
      {/* Back */}
      <Link
        href={`/${locale}/home/artists`}
        className={`mb-4 inline-flex items-center gap-1.5 text-xs tracking-widest transition-colors ${isDark ? "text-vhs-muted hover:text-vhs-white" : "text-[#635b53] hover:text-[#2a2520]"}`}
      >
        <ArrowLeft size={12} /> {t("artists").toUpperCase()}
      </Link>

      {/* Hero */}
      <div className={`relative mb-6 overflow-hidden rounded-lg ${isDark ? "bg-vhs-card" : "bg-white/80"} border ${isDark ? "border-royalblue/20" : "border-[#a89888]/30"}`}>
        {/* Banner */}
        <div className="relative h-40 sm:h-52 w-full">
          {artist.bannerImageUrl ? (
            <img
              src={artist.bannerImageUrl}
              alt="banner"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, rgba(37,48,120,0.8) 0%, rgba(11,15,45,0.9) 100%)"
                  : "linear-gradient(135deg, rgba(196,35,78,0.15) 0%, rgba(196,184,168,0.3) 100%)",
              }}
            />
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Avatar + name */}
        <div className="relative px-5 pb-5">
          <div className="flex items-end gap-4 -mt-10 sm:-mt-14">
            <div
              className="h-20 w-20 sm:h-28 sm:w-28 shrink-0 rounded-full border-4 overflow-hidden flex items-center justify-center font-bold text-xl shadow-lg"
              style={{
                borderColor: isDark ? "var(--color-vhs-surface)" : "#f0ebe3",
                background: isDark ? "rgba(37,48,120,0.9)" : "#f5f0e8",
              }}
            >
              {artist.profileImageUrl ? (
                <img src={artist.profileImageUrl} alt={artist.displayName} className="h-full w-full object-cover" />
              ) : (
                <span className={isDark ? "text-vhs-cyan" : "text-[#c4234e]"}>{initials(artist.displayName)}</span>
              )}
            </div>

            <div className="mb-2 min-w-0 flex-1">
              <div className={`text-xs tracking-widest mb-0.5 ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
                {t("artistLabel")}
              </div>
              <h1 className={`text-xl sm:text-3xl font-bold tracking-wide truncate ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
                {artist.displayName.toUpperCase()}
              </h1>
            </div>
          </div>

          {/* Stats row */}
          <div className={`mt-3 flex flex-wrap gap-4 text-xs tracking-widest ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
            {artist.artistSince && (
              <span className="flex items-center gap-1.5">
                <CalendarDays size={11} />
                {t("since")} {new Date(artist.artistSince).getFullYear()}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <UserCircle2 size={11} />
              {t("memberSince")} {new Date(artist.memberSince).getFullYear()}
            </span>
            {tracks.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Music size={11} />
                {tracks.length} {t("tracks").toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Play all button */}
      {tracks.length > 0 && (
        <button
          onClick={() => playTrack(tracks[0], tracks, "artist_page")}
          className={`mb-5 flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-bold tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-lg`}
          style={{ background: isDark ? "var(--color-fear)" : "#c4234e" }}
        >
          <Play size={14} fill="white" /> {t("playAll")}
        </button>
      )}

      {/* Bio */}
      {artist.bio && (
        <div className={`mb-5 rounded-lg border p-4 ${isDark ? "border-royalblue/20 bg-vhs-card" : "border-[#a89888]/30 bg-white/80"}`}>
          <div className={`mb-2 text-[11px] tracking-widest font-bold ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
            {t("aboutSection")}
          </div>
          <p className={`text-[11px] leading-relaxed tracking-wide ${isDark ? "text-vhs-light" : "text-[#4a4540]"}`}>
            {artist.bio}
          </p>
        </div>
      )}

      {/* Tracks */}
      {tracks.length > 0 && (
        <div>
          <div className={`mb-3 text-[11px] tracking-widest font-bold ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
            {t("tracksSection")}
          </div>
          <div className="space-y-1">
            {tracks.map((track, i) => {
              const active = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, tracks, "artist_page")}
                  className={`flex items-center gap-3 rounded border px-3 py-2.5 cursor-pointer transition-all hover:-translate-y-px ${
                    active
                      ? isDark ? "border-royalblue/60 bg-royalblue/10" : "border-[#c4234e]/40 bg-[#c4234e]/5"
                      : isDark ? "border-royalblue/20 bg-vhs-card hover:border-royalblue/40" : "border-[#a89888]/30 bg-white/80 hover:border-[#a89888]/60"
                  }`}
                >
                  {/* Index / playing indicator */}
                  <div className={`w-5 text-center text-xs tabular-nums shrink-0 ${active ? (isDark ? "text-vhs-cyan" : "text-[#c4234e]") : (isDark ? "text-vhs-muted" : "text-[#635b53]")}`}>
                    {active && isPlaying
                      ? <span className="flex gap-[2px] items-end justify-center h-3">{[3,5,4].map((h, j) => <span key={j} className="w-[2px] bg-current rounded-full animate-pulse" style={{ height: `${h * 2}px`, animationDelay: `${j * 0.15}s` }} />)}</span>
                      : i + 1}
                  </div>

                  {/* Cover */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border overflow-hidden ${isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#a89888]/40 bg-[#f5f0e8]"}`}>
                    {track.coverImageUrl
                      ? <img src={track.coverImageUrl} alt={track.title} className="h-full w-full object-cover" />
                      : <Music size={14} className={isDark ? "text-vhs-muted" : "text-[#635b53]"} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`truncate text-[11px] font-bold tracking-wider ${active ? (isDark ? "text-fearyellow" : "text-[#c4234e]") : (isDark ? "text-vhs-white" : "text-[#2a2520]")}`}>
                      {track.title}
                    </div>
                    <div className={`truncate text-[11px] tracking-wide ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
                      {track.genres.map((g) => g.name).join(" · ")}
                    </div>
                  </div>

                  {/* Price */}
                  {track.price != null && (
                    <div className={`text-xs font-semibold tracking-wider shrink-0 ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}>
                      {track.price} CZK
                    </div>
                  )}

                  {/* Duration */}
                  <div className={`flex items-center gap-1 text-xs tabular-nums shrink-0 ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
                    <Clock size={10} />
                    {formatTime(track.durationSeconds)}
                  </div>

                  <PlaylistPicker trackId={track.id} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tracks.length === 0 && (
        <div className={`py-8 text-center text-[11px] tracking-widest ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
          {t("noTracksYet")}
        </div>
      )}
    </div>
  );
}
