"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Music, Clock, Search, Play, ListPlus } from "lucide-react";
import { PageHeader, LikeButton } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { usePlayer } from "@/app/context/PlayerContext";
import { PlaylistPicker } from "@/app/components/home/PlaylistPicker";
import { ShareButton } from "@/app/components/home/ShareButton";
import { VHSSpinner } from "@/app/components/ui/VHSSpinner";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { TrackDto, GenreDto } from "@/app/types/track";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

const PAGE_SIZE = 20;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TracksPage() {
  const t              = useTranslations("Store");
  const { isDark }     = useTheme();
  const { playTrack, addToQueue, track: currentTrack, isPlaying, likedItems, toggleLike } = usePlayer();

  const [tracks, setTracks]     = useState<TrackDto[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);

  const [genres, setGenres]           = useState<GenreDto[]>([]);
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [search, setSearch]           = useState("");

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback(async (p: number, genreId: number | null, title: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if(genreId)
        params.set("genreId", String(genreId));
      if(title)
        params.set("title",   title);

      const { data } = await api.get<PaginatedResponse<TrackDto>>(
        `${API_ENDPOINTS.tracks.list}?${params}`,
      );
      setTracks(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1, null, "");
    api.get<PaginatedResponse<GenreDto>>(`${API_ENDPOINTS.genres.list}?limit=100`)
      .then(({ data }) => setGenres(data.data))
      .catch(console.error);
  }, [load]);

  const handleGenreClick = (id: number | null) => {
    setActiveGenre(id);
    setPage(1);
    void load(1, id, search);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => void load(1, activeGenre, value), 400);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    void load(p, activeGenre, search);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const base = isDark
    ? {
      card: "border-royalblue/20 bg-vhs-card hover:border-royalblue/40",
      text: "text-vhs-white",
      muted: "text-vhs-muted",
      badge: "bg-royalblue/20 text-vhs-cyan border-royalblue/30",
      activeBadge: "bg-royalblue text-white border-royalblue",
      input: "bg-vhs-card border-royalblue/30 text-vhs-white placeholder:text-vhs-muted"
    }
    : {
      card: "border-[#a89888]/30 bg-white/80 hover:border-[#a89888]/60",
      text: "text-[#2a2520]",
      muted: "text-[#635b53]",
      badge: "bg-[#f5f0e8] text-[#6b5f4e] border-[#d4c8b0]",
      activeBadge: "bg-[#c4234e] text-white border-[#c4234e]",
      input: "bg-white border-[#a89888] text-[#2a2520] placeholder:text-[#635b53]"
    };

  return (
    <>
      <PageHeader title={t("tracks")} count={total} />

      {/* Search */}
      <div className={`relative mb-4 flex items-center gap-2 rounded border px-3 py-2 ${base.input}`}>
        <Search size={14} className={base.muted} />
        <input
          className="flex-1 bg-transparent text-xs tracking-wide outline-none"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Genre chips */}
      {genres.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            className={`rounded border px-3 py-1 text-xs tracking-widest transition-colors ${activeGenre === null ? base.activeBadge : base.badge}`}
            onClick={() => handleGenreClick(null)}
          >
            {t("allGenres")}
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              className={`rounded border px-3 py-1 text-xs tracking-widest transition-colors ${activeGenre === g.id ? base.activeBadge : base.badge}`}
              onClick={() => handleGenreClick(g.id)}
            >
              {g.name.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <VHSSpinner size="lg" />
        </div>
      ) : tracks.length === 0 ? (
        <div className={`py-16 text-center text-xs tracking-widest ${base.muted}`}>
          {t("noTracks")}
        </div>
      ) : (
        <>
          <div className="space-y-1">
            {tracks.map((track, i) => (
              <div
                key={track.id}
                className={`animate-slide-up flex items-center gap-3 rounded border px-3 py-2.5 transition-all hover:-translate-y-px cursor-pointer ${base.card} ${currentTrack?.id === track.id ? (isDark ? "border-royalblue/60" : "border-[#c4234e]/40") : ""}`}
                style={{ animationDelay: `${i * 0.03}s` }}
                onClick={() => playTrack(track, tracks, "browse")}
              >
                {/* Cover / play indicator */}
                <div
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded border overflow-hidden ${isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#a89888]/40 bg-[#f5f0e8]"}`}
                >
                  {track.coverImageUrl ? (
                    <img src={track.coverImageUrl} alt={track.title} className="h-full w-full object-cover" />
                  ) : (
                    <Music size={16} className={base.muted} />
                  )}
                  {currentTrack?.id === track.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      {isPlaying
                        ? <span className="flex gap-[2px] items-end h-4">{[3,5,4].map((h,i) => <span key={i} className="w-[3px] bg-white rounded-full animate-pulse" style={{ height: `${h * 3}px`, animationDelay: `${i * 0.15}s` }} />)}</span>
                        : <Play size={12} className="text-white" />}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className={`truncate text-xs font-bold tracking-wider ${base.text}`}>
                    {track.title}
                  </div>
                  <div className={`truncate text-xs tracking-wide ${base.muted}`}>
                    {track.artists.map((a) => a.displayName).join(", ")}
                  </div>
                </div>

                {/* Genres */}
                <div className="hidden sm:flex flex-wrap gap-1">
                  {track.genres.slice(0, 2).map((g) => (
                    <span key={g.id} className={`rounded border px-1.5 py-0.5 text-xs tracking-wider ${base.badge}`}>
                      {g.name}
                    </span>
                  ))}
                </div>

                {/* Duration */}
                <div className={`hidden sm:flex items-center gap-1 tabular-nums text-xs ${base.muted}`}>
                  <Clock size={11} />
                  {formatDuration(track.durationSeconds)}
                </div>

                {/* Price */}
                {track.price != null && (
                  <div className={`hidden sm:block text-xs font-semibold tracking-wider ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}>
                    {track.price} CZK
                  </div>
                )}

                <span onClick={(e) => e.stopPropagation()}>
                  <LikeButton itemId={track.id} liked={likedItems.has(track.id)} onToggle={() => toggleLike(track.id, track)} />
                </span>
                <button
                  className={`hidden sm:flex items-center justify-center shrink-0 w-9 h-9 rounded-sm transition-colors ${isDark ? "hover:bg-royalblue/20 text-vhs-muted hover:text-vhs-white" : "hover:bg-[#c4234e]/10 text-[#635b53] hover:text-[#2a2520]"}`}
                  title={t("addToQueue")}
                  onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
                >
                  <ListPlus size={14} />
                </button>
                <span className="hidden sm:flex items-center">
                  <PlaylistPicker trackId={track.id} />
                </span>
                <span className="hidden sm:flex items-center">
                  <ShareButton track={track} />
                </span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-1">
              <button
                className={`rounded border px-3 py-2 text-xs transition-colors ${base.badge}`}
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                ‹
              </button>
              {(() => {
                const pages: (number | "…")[] = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push("…");
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                  if (page < totalPages - 2) pages.push("…");
                  pages.push(totalPages);
                }
                return pages.map((n, idx) =>
                  n === "…" ? (
                    <span key={`ellipsis-${idx}`} className={`px-2 py-2 text-xs ${base.muted}`}>…</span>
                  ) : (
                    <button
                      key={n}
                      className={`rounded border px-3 py-2 text-xs transition-colors ${n === page ? base.activeBadge : base.badge}`}
                      onClick={() => handlePageChange(n)}
                    >
                      {n}
                    </button>
                  )
                );
              })()}
              <button
                className={`rounded border px-3 py-2 text-xs transition-colors ${base.badge}`}
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
