"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ListPlus, Check, Loader } from "lucide-react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useTheme } from "@/lib/hooks";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { PlaylistDto } from "@/app/types/playlist";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

interface Props {
  trackId: number;
}

export function PlaylistPicker({ trackId }: Props) {
  const t              = useTranslations("Store");
  const { session }    = useAuth();
  const { isDark }     = useTheme();

  const [open, setOpen]           = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistDto[]>([]);
  const [loading, setLoading]     = useState(false);
  const [adding, setAdding]       = useState<number | null>(null);
  const [added, setAdded]         = useState<Set<number>>(new Set());
  const [error, setError]         = useState<number | null>(null);
  const containerRef              = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if(!open)
      return;

    const handler = (e: MouseEvent) => {
      if(containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const fetchPlaylists = async () => {
    if(!session?.user?.id)
      return;

    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse<PlaylistDto>>(
        `${API_ENDPOINTS.playlists.list}?userId=${session.user.id}&limit=50`,
      );
      setPlaylists(data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(!open)
      void fetchPlaylists();

    setOpen((v) => !v);
  };

  const handleAdd = async (e: React.MouseEvent, playlistId: number) => {
    e.stopPropagation();
    if(added.has(playlistId) || adding !== null)
      return;

    setError(null);
    setAdding(playlistId);
    try {
      await api.post(API_ENDPOINTS.playlists.tracks(playlistId), { trackId });
      setAdded((prev) => new Set(prev).add(playlistId));
    } catch {
      setError(playlistId);
    } finally {
      setAdding(null);
    }
  };

  if(!session?.user?.id)
    return null;

  const btn = isDark
    ? "text-vhs-muted hover:text-vhs-cyan"
    : "text-[#635b53] hover:text-[#c4234e]";

  const dropdown = isDark
    ? "bg-vhs-surface border-royalblue/30 text-vhs-white"
    : "bg-white border-[#a89888]/40 text-[#2a2520]";

  const item = isDark
    ? "hover:bg-royalblue/20 text-vhs-light"
    : "hover:bg-[#f5f0e8] text-[#4a4540]";

  return (
    <div ref={containerRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        title={t("addToPlaylist")}
        className={`transition-colors ${btn}`}
        onClick={handleOpen}
      >
        <ListPlus size={14} />
      </button>

      {open && (
        <div className={`absolute right-0 bottom-full mb-1 z-50 min-w-[160px] rounded border shadow-lg text-xs tracking-wider ${dropdown}`}>
          <div className={`px-3 py-1.5 text-[11px] font-bold border-b ${isDark ? "border-royalblue/20 text-vhs-muted" : "border-[#e8e0d4] text-[#635b53]"}`}>
            {t("selectPlaylist")}
          </div>

          {loading ? (
            <div className="flex justify-center py-3">
              <Loader size={14} className={`animate-spin ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`} />
            </div>
          ) : playlists.length === 0 ? (
            <div className={`px-3 py-2 text-[11px] ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
              {t("noPlaylists")}
            </div>
          ) : (
            <ul className="max-h-48 overflow-y-auto py-1">
              {playlists.map((pl) => {
                const isAdded   = added.has(pl.id);
                const isAdding  = adding === pl.id;
                const isError   = error === pl.id;
                return (
                  <li key={pl.id}>
                    <button
                      className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 transition-colors ${item} ${isAdded ? "opacity-60" : ""}`}
                      onClick={(e) => void handleAdd(e, pl.id)}
                      disabled={isAdding}
                    >
                      <span className="truncate">{pl.title}</span>
                      {isAdding && <Loader size={10} className="animate-spin shrink-0" />}
                      {isAdded && !isAdding && <Check size={10} className={`shrink-0 ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`} />}
                      {isError && !isAdding && (
                        <span className="shrink-0 text-red-400">!</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
