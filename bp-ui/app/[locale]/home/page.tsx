"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Disc3, Music, Clock, Users, Play, ListPlus } from "lucide-react";
import { PageHeader, SectionLabel, LikeButton } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { VHSSpinner } from "@/app/components/ui/VHSSpinner";
import { usePlayer } from "@/app/context/PlayerContext";
import { PlaylistPicker } from "@/app/components/home/PlaylistPicker";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { AlbumDto } from "@/app/types/album";
import type { TrackDto } from "@/app/types/track";
import type { ArtistDto } from "@/app/types/user";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const ACCENT_COLORS = ["#00e5ff", "#9b59ff", "#ed2c5e", "#00ff88", "#f4e526", "#ff6b35"];

export default function HomePage() {
  const t          = useTranslations("Store");
  const { isDark } = useTheme();
  const { locale } = useParams<{ locale: string }>();
  const { playTrack, addToQueue, track: currentTrack, isPlaying, likedItems, toggleLike } = usePlayer();

  const [albums, setAlbums]     = useState<AlbumDto[]>([]);
  const [tracks, setTracks]     = useState<TrackDto[]>([]);
  const [artists, setArtists]   = useState<ArtistDto[]>([]);
  const [loading, setLoading]   = useState(true);
  const [totalTracks, setTotalTracks] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [albumRes, trackRes, artistRes] = await Promise.all([
        api.get<PaginatedResponse<AlbumDto>>(`${API_ENDPOINTS.albums.list}?limit=6`),
        api.get<PaginatedResponse<TrackDto>>(`${API_ENDPOINTS.tracks.list}?limit=8`),
        api.get<PaginatedResponse<ArtistDto>>(`${API_ENDPOINTS.artists.list}?limit=8`),
      ]);
      setAlbums(albumRes.data.data);
      setTracks(trackRes.data.data);
      setTotalTracks(trackRes.data.total);
      setArtists(artistRes.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const base = isDark
    ? {
      card:   "border-royalblue/20 bg-vhs-card hover:border-royalblue/40",
      text:   "text-vhs-white",
      muted:  "text-vhs-muted",
      accent: "text-vhs-cyan",
      row:    "border-royalblue/15 bg-vhs-card/60 hover:bg-vhs-card",
      cover:  "border-royalblue/20 bg-royalblue/10",
      avatar: "border-royalblue/30",
    }
    : {
      card:   "border-[#a89888]/30 bg-white/80 hover:border-[#a89888]/60",
      text:   "text-[#2a2520]",
      muted:  "text-[#635b53]",
      accent: "text-[#c4234e]",
      row:    "border-[#a89888]/20 bg-white/60 hover:bg-white/90",
      cover:  "border-[#a89888]/40 bg-[#f5f0e8]",
      avatar: "border-[#a89888]/40",
    };

  if (loading) {
    return (
      <>
        <PageHeader title={t("browseMusic")} count={0} />
        <div className="flex justify-center py-16">
          <VHSSpinner size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("browseMusic")} count={totalTracks} />

      {/* ── Albums ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>{t("albums")}</SectionLabel>
          <Link href={`/${locale}/home/albums`} className={`text-xs tracking-wider ${base.accent} hover:underline`}>
            {t("viewAll")} →
          </Link>
        </div>
        {albums.length === 0 ? (
          <div className={`py-8 text-center text-xs tracking-widest ${base.muted}`}>{t("noAlbums")}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/${locale}/home/albums/${album.id}`}
                className={`rounded border p-3 transition-all hover:-translate-y-px cursor-pointer ${base.card}`}
              >
                <div className={`relative mb-3 aspect-square w-full overflow-hidden rounded border ${base.cover}`}>
                  {album.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.coverImageUrl} alt={album.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Disc3 size={32} className={base.muted} />
                    </div>
                  )}
                </div>
                <div className={`truncate text-xs font-bold tracking-wider ${base.text}`}>{album.title}</div>
                <div className={`truncate text-xs tracking-wide mt-0.5 ${base.muted}`}>
                  {album.artists.map((a) => a.displayName).join(", ")}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-xs tracking-wide ${base.muted}`}>
                    {new Date(album.releaseDate).getFullYear()}
                  </span>
                  <span className={`text-xs font-semibold tracking-wider ${base.accent}`}>
                    {album.price} CZK
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Tracks ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>{t("tracks")}</SectionLabel>
          <Link href={`/${locale}/home/tracks`} className={`text-xs tracking-wider ${base.accent} hover:underline`}>
            {t("viewAll")} →
          </Link>
        </div>
        {tracks.length === 0 ? (
          <div className={`py-8 text-center text-xs tracking-widest ${base.muted}`}>{t("noTracks")}</div>
        ) : (
          <div className="space-y-1.5">
            {tracks.map((track, i) => (
              <div
                key={track.id}
                className={`animate-slide-up flex items-center gap-3 rounded border px-3 py-2.5 transition-all hover:-translate-y-px cursor-pointer ${base.row} ${currentTrack?.id === track.id ? (isDark ? "border-royalblue/60" : "border-[#c4234e]/40") : ""}`}
                style={{ animationDelay: `${i * 0.03}s` }}
                onClick={() => playTrack(track, tracks, "browse")}
              >
                <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border ${base.cover}`}>
                  {track.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={track.coverImageUrl} alt={track.title} className="h-full w-full object-cover" />
                  ) : (
                    <Music size={16} className={base.muted} />
                  )}
                  {currentTrack?.id === track.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      {isPlaying
                        ? <span className="flex gap-[2px] items-end h-4">{[3,5,4].map((h,j) => <span key={j} className="w-[3px] bg-white rounded-full animate-pulse" style={{ height: `${h * 3}px`, animationDelay: `${j * 0.15}s` }} />)}</span>
                        : <Play size={12} className="text-white" />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`truncate text-xs font-bold tracking-wider ${base.text}`}>{track.title}</div>
                  <div className={`truncate text-xs tracking-wide ${base.muted}`}>
                    {track.artists.map((a) => a.displayName).join(", ")}
                  </div>
                </div>
                <div className={`hidden sm:flex items-center gap-1 text-xs ${base.muted}`}>
                  <Clock size={10} />
                  {formatDuration(track.durationSeconds)}
                </div>
                {track.price != null && track.price > 0 && (
                  <span className={`hidden sm:inline text-xs font-semibold tracking-wider ${base.accent}`}>
                    {track.price} CZK
                  </span>
                )}
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
            ))}
          </div>
        )}
      </div>

      {/* ── Artists ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>{t("artists")}</SectionLabel>
          <Link href={`/${locale}/home/artists`} className={`text-xs tracking-wider ${base.accent} hover:underline`}>
            {t("viewAll")} →
          </Link>
        </div>
        {artists.length === 0 ? (
          <div className={`py-8 text-center text-xs tracking-widest ${base.muted}`}>{t("noArtists")}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {artists.map((artist, i) => {
              const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
              return (
                <Link
                  key={artist.userId}
                  href={`/${locale}/home/artists/${artist.userId}`}
                  className={`rounded border p-4 text-center transition-all hover:-translate-y-px cursor-pointer ${base.card}`}
                >
                  <div
                    className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 ${base.avatar}`}
                    style={{ background: `linear-gradient(135deg, ${color}33, transparent)`, borderColor: `${color}44` }}
                  >
                    {artist.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={artist.profileImageUrl} alt={artist.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <Users size={20} style={{ color }} />
                    )}
                  </div>
                  <div className={`mb-1 truncate text-xs font-bold tracking-wider ${base.text}`}>
                    {artist.displayName.toUpperCase()}
                  </div>
                  {artist.bio && (
                    <div className={`line-clamp-2 text-[10px] leading-relaxed tracking-wide ${base.muted}`}>
                      {artist.bio}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
