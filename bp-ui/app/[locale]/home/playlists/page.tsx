"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Heart, ListMusic, Play, Plus, Search, Trash2, X } from "lucide-react";
import { PageHeader } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { PlaylistDto } from "@/app/types/playlist";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

const PAGE_SIZE = 20;

export default function PlaylistsPage() {
  const t              = useTranslations("Store");
  const { isDark }     = useTheme();
  const { locale }     = useParams<{ locale: string }>();
  const { session }    = useAuth();
  const userId         = session?.user?.id ?? null;

  const [playlists, setPlaylists] = useState<PlaylistDto[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  const [modalOpen, setModalOpen]       = useState(false);
  const [form, setForm]                 = useState({ title: "", isPublic: true, isCollaborative: false });
  const [creating, setCreating]         = useState(false);
  const [createError, setCreateError]   = useState<string | null>(null);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback(async (p: number, title: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE), userId: String(userId) });
      if (title) params.set("title", title);
      const { data } = await api.get<PaginatedResponse<PlaylistDto>>(`${API_ENDPOINTS.playlists.list}?${params}`);
      const sorted = [...data.data].sort((a, b) => (a.isSystem === b.isSystem ? 0 : a.isSystem ? -1 : 1));
      setPlaylists(sorted);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(1, ""); }, [load]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => void load(1, value), 400);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    void load(p, search);
  };

  const openModal = () => {
    setForm({ title: "", isPublic: true, isCollaborative: false });
    setCreateError(null);
    setModalOpen(true);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { setCreateError(t("playlistTitle")); return; }
    setCreating(true);
    setCreateError(null);
    try {
      await api.post(API_ENDPOINTS.playlists.list, {
        title:           form.title.trim(),
        isPublic:        form.isPublic,
        isCollaborative: form.isCollaborative,
      });
      setModalOpen(false);
      void load(1, search);
    } catch {
      setCreateError("Error creating playlist.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, playlist: PlaylistDto) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`${t("deletePlaylistQuestion")} "${playlist.title}"?`)) return;
    try {
      await api.delete(API_ENDPOINTS.playlists.detail(playlist.id));
      void load(page, search);
    } catch { /* ignore */ }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const base = isDark
    ? {
      card:        "border-royalblue/20 bg-vhs-card hover:border-royalblue/40 hover:shadow-[0_8px_24px_rgba(37,48,120,0.25)]",
      text:        "text-vhs-white",
      muted:       "text-vhs-muted",
      badge:       "bg-royalblue/20 text-vhs-cyan border-royalblue/30",
      activeBadge: "bg-royalblue text-white border-royalblue",
      input:       "bg-vhs-card border-royalblue/30 text-vhs-white placeholder:text-vhs-muted",
      accent:      "text-vhs-cyan",
      iconBg:      "bg-gradient-to-br from-royalblue/30 to-vhs-purple/20",
      modal:       "bg-vhs-surface border-royalblue/30",
      modalInput:  "bg-vhs-card border-royalblue/30 text-vhs-white placeholder:text-vhs-muted",
      createCard:  "border-royalblue/30 border-dashed bg-vhs-card/50 hover:border-fear/50 hover:bg-vhs-card",
      deleteBtn:   "border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50",
      playBtn:     "border-fear/40 text-fear hover:bg-fear/10 hover:border-fear/60",
      skeleton:    "bg-royalblue/10",
    }
    : {
      card:        "border-[#a89888]/30 bg-white/80 hover:border-[#a89888]/60 hover:shadow-[0_8px_24px_rgba(168,152,136,0.2)]",
      text:        "text-[#2a2520]",
      muted:       "text-[#635b53]",
      badge:       "bg-[#f5f0e8] text-[#6b5f4e] border-[#d4c8b0]",
      activeBadge: "bg-[#c4234e] text-white border-[#c4234e]",
      input:       "bg-white border-[#a89888] text-[#2a2520] placeholder:text-[#635b53]",
      accent:      "text-[#c4234e]",
      iconBg:      "bg-gradient-to-br from-[#f5f0e8] to-[#ede7db]",
      modal:       "bg-white border-[#a89888]/40",
      modalInput:  "bg-[#f5f0e8] border-[#a89888]/60 text-[#2a2520] placeholder:text-[#635b53]",
      createCard:  "border-[#a89888]/40 border-dashed bg-[#f5f0e8]/50 hover:border-[#c4234e]/40 hover:bg-[#f5f0e8]",
      deleteBtn:   "border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50",
      playBtn:     "border-[#c4234e]/40 text-[#c4234e] hover:bg-[#c4234e]/10 hover:border-[#c4234e]/60",
      skeleton:    "bg-[#c5bfb3]/30",
    };

  return (
    <>
      <PageHeader title={t("myPlaylists")} count={total} />

      {/* Search */}
      <div className="mb-5 flex gap-2">
        <div className={`relative flex flex-1 items-center gap-2 rounded-sm border px-3 py-2.5 ${base.input}`}>
          <Search size={14} className={base.muted} />
          <input
            className="flex-1 bg-transparent text-xs tracking-wide outline-none"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`rounded-lg border p-4 ${isDark ? "border-royalblue/10" : "border-[#a89888]/20"}`}>
              <div className={`mb-3 h-28 w-full animate-pulse rounded-md ${base.skeleton}`} />
              <div className={`mb-2 h-4 w-3/4 animate-pulse rounded ${base.skeleton}`} />
              <div className={`h-3 w-1/3 animate-pulse rounded ${base.skeleton}`} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Create new playlist card — always first */}
          {userId && (
            <button
              onClick={openModal}
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 p-6 transition-all hover:-translate-y-1 ${base.createCard}`}
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-md ${base.iconBg}`}>
                <Plus size={32} className={base.accent} />
              </div>
              <span className={`text-xs font-bold uppercase tracking-[2px] ${base.accent}`}>
                {t("newPlaylistCard")}
              </span>
            </button>
          )}

          {/* Playlist cards */}
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className={`flex flex-col rounded-lg border transition-all hover:-translate-y-1 ${base.card}`}
            >
              <Link
                href={`/${locale}/home/playlists/${playlist.id}`}
                className={`flex h-28 w-full items-center justify-center rounded-t-lg ${base.iconBg}`}
              >
                {playlist.isSystem
                  ? <Heart size={40} className="text-fear opacity-80" fill="currentColor" />
                  : <ListMusic size={40} className={`${base.muted} opacity-60`} />
                }
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <Link
                  href={`/${locale}/home/playlists/${playlist.id}`}
                  className={`truncate text-sm font-bold tracking-wider ${base.text}`}
                >
                  {playlist.isSystem ? t("likedTracks") : playlist.title}
                </Link>
                <div className={`mt-1 text-xs tracking-wide ${base.muted}`}>
                  {playlist.trackCount} {t("tracksCount")}
                </div>

                {(playlist.isCollaborative || !playlist.isPublic) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {playlist.isCollaborative && (
                      <span className={`rounded-sm border px-2 py-0.5 text-xs tracking-wider ${base.badge}`}>
                        {t("collabBadge")}
                      </span>
                    )}
                    {!playlist.isPublic && (
                      <span className={`rounded-sm border px-2 py-0.5 text-xs tracking-wider ${base.badge}`}>
                        {t("privateBadge")}
                      </span>
                    )}
                  </div>
                )}

                <div className={`mt-auto flex gap-2 pt-3 ${(playlist.isCollaborative || !playlist.isPublic) ? "mt-3" : "mt-4"}`}>
                  <Link
                    href={`/${locale}/home/playlists/${playlist.id}`}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm border px-3 py-2 text-xs font-bold uppercase tracking-[2px] transition-colors ${base.playBtn}`}
                  >
                    <Play size={12} fill="currentColor" />
                    {t("playlistPlay")}
                  </Link>
                  {!playlist.isSystem && (
                    <button
                      onClick={(e) => void handleDelete(e, playlist)}
                      className={`flex items-center justify-center gap-1.5 rounded-sm border px-3 py-2 text-xs font-bold uppercase tracking-[2px] transition-colors ${base.deleteBtn}`}
                    >
                      <Trash2 size={12} />
                      {t("playlistDelete")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Empty hint when no playlists yet (besides create card) */}
          {playlists.length === 0 && (
            <div className={`col-span-full flex flex-col items-center justify-center py-10 ${base.muted}`}>
              <ListMusic size={32} className="mb-2 opacity-40" />
              <span className="text-xs uppercase tracking-[2px]">{t("noPlaylists")}</span>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-1">
          <button
            className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${base.badge}`}
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${n === page ? base.activeBadge : base.badge}`}
              onClick={() => handlePageChange(n)}
            >
              {n}
            </button>
          ))}
          <button
            className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${base.badge}`}
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
          >
            ›
          </button>
        </div>
      )}

      {/* Create Playlist Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("createPlaylist")}
        >
          <div
            className={`w-full max-w-sm rounded-lg border p-6 shadow-2xl ${base.modal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className={`text-sm font-bold uppercase tracking-[2px] ${base.text}`}>
                {t("createPlaylist")}
              </span>
              <button onClick={() => setModalOpen(false)} className={base.muted} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="mb-4">
              <label htmlFor="playlistTitle" className={`mb-1.5 block text-xs uppercase tracking-[2px] ${base.muted}`}>
                {t("playlistTitle")} *
              </label>
              <input
                id="playlistTitle"
                className={`w-full rounded-sm border px-3 py-2.5 text-xs tracking-wide outline-none transition-colors focus-visible:ring-2 focus-visible:ring-fear ${base.modalInput}`}
                placeholder={t("playlistTitle")}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
                autoFocus
              />
            </div>

            <div className="mb-5 flex flex-col gap-2.5">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer accent-current"
                  checked={form.isPublic}
                  onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                />
                <span className={`text-xs tracking-wider ${base.text}`}>{t("isPublic")}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer accent-current"
                  checked={form.isCollaborative}
                  onChange={(e) => setForm((f) => ({ ...f, isCollaborative: e.target.checked }))}
                />
                <span className={`text-xs tracking-wider ${base.text}`}>{t("isCollaborative")}</span>
              </label>
            </div>

            {createError && (
              <div className="mb-3 text-xs tracking-wide text-red-400">{createError}</div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className={`rounded-sm border px-4 py-2 text-xs font-bold uppercase tracking-[2px] transition-colors ${base.badge}`}
                disabled={creating}
              >
                {t("collapse")}
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={creating}
                className={`rounded-sm border px-4 py-2 text-xs font-bold uppercase tracking-[2px] transition-colors disabled:opacity-50 ${base.activeBadge}`}
              >
                {creating ? t("creating") : t("createPlaylist")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
