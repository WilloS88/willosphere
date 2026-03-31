"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ListMusic, Music, Plus, Search, Trash2, X } from "lucide-react";
import { PageHeader } from "@/app/components/ui/elastic-slider/StoreUI";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { PlaylistDto } from "@/app/types/playlist";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

const PAGE_SIZE = 20;

type Tab = "public" | "mine";

export default function PlaylistsPage() {
  const t              = useTranslations("Store");
  const { isDark }     = useStoreTheme();
  const { locale }     = useParams<{ locale: string }>();
  const { session }    = useAuth();
  const userId         = session?.user?.id ?? null;

  const [activeTab, setActiveTab] = useState<Tab>("public");
  const [playlists, setPlaylists] = useState<PlaylistDto[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  // Create modal
  const [modalOpen, setModalOpen]       = useState(false);
  const [form, setForm]                 = useState({ title: "", isPublic: true, isCollaborative: false });
  const [creating, setCreating]         = useState(false);
  const [createError, setCreateError]   = useState<string | null>(null);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback(async (p: number, title: string, tab: Tab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (title) params.set("title", title);
      if (tab === "public") {
        params.set("isPublic", "true");
      } else if (userId) {
        params.set("userId", String(userId));
      }
      const { data } = await api.get<PaginatedResponse<PlaylistDto>>(`${API_ENDPOINTS.playlists.list}?${params}`);
      setPlaylists(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(1, "", activeTab); }, [load, activeTab]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
    void load(1, "", tab);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => void load(1, value, activeTab), 400);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    void load(p, search, activeTab);
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
      if (activeTab === "mine") {
        void load(1, search, "mine");
      } else {
        setActiveTab("mine");
        setPage(1);
        setSearch("");
        void load(1, "", "mine");
      }
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
      void load(page, search, activeTab);
    } catch { /* ignore */ }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const base = isDark
    ? {
      card:        "border-royalblue/20 bg-vhs-card hover:border-royalblue/40",
      text:        "text-vhs-white",
      muted:       "text-vhs-muted",
      badge:       "bg-royalblue/20 text-vhs-cyan border-royalblue/30",
      activeBadge: "bg-royalblue text-white border-royalblue",
      input:       "bg-vhs-card border-royalblue/30 text-vhs-white placeholder:text-vhs-muted",
      accent:      "text-vhs-cyan",
      modal:       "bg-vhs-surface border-royalblue/30",
      modalInput:  "bg-vhs-card border-royalblue/30 text-vhs-white placeholder:text-vhs-muted",
    }
    : {
      card:        "border-[#c4b8a8]/30 bg-white/80 hover:border-[#c4b8a8]/60",
      text:        "text-[#2a2520]",
      muted:       "text-[#8a8578]",
      badge:       "bg-[#f5f0e8] text-[#6b5f4e] border-[#d4c8b0]",
      activeBadge: "bg-[#c4234e] text-white border-[#c4234e]",
      input:       "bg-white border-[#c4b8a8] text-[#2a2520] placeholder:text-[#8a8578]",
      accent:      "text-[#c4234e]",
      modal:       "bg-white border-[#c4b8a8]/40",
      modalInput:  "bg-[#f5f0e8] border-[#c4b8a8]/60 text-[#2a2520] placeholder:text-[#8a8578]",
    };

  return (
    <>
      <PageHeader title={t("playlists")} count={total} />

      {/* Tabs */}
      {userId && (
        <div className="mb-4 flex gap-2">
          {(["public", "mine"] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`rounded border px-3 py-1 text-xs tracking-widest transition-colors ${activeTab === tab ? base.activeBadge : base.badge}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab === "public" ? t("allPublic") : t("myPlaylists")}
            </button>
          ))}
        </div>
      )}

      {/* Search + create row */}
      <div className="mb-4 flex gap-2">
        <div className={`relative flex flex-1 items-center gap-2 rounded border px-3 py-2 ${base.input}`}>
          <Search size={14} className={base.muted} />
          <input
            className="flex-1 bg-transparent text-[11px] tracking-wide outline-none"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        {userId && activeTab === "mine" && (
          <button
            onClick={openModal}
            className={`flex items-center gap-1.5 rounded border px-3 py-2 text-xs tracking-widest transition-colors whitespace-nowrap ${base.activeBadge}`}
          >
            <Plus size={13} /> {t("createPlaylist")}
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`} />
        </div>
      ) : playlists.length === 0 ? (
        <div className={`py-16 text-center text-[11px] tracking-widest ${base.muted}`}>
          {t("noPlaylists")}
          {userId && activeTab === "mine" && (
            <div className="mt-3">
              <button
                onClick={openModal}
                className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs tracking-widest transition-colors ${base.activeBadge}`}
              >
                <Plus size={12} /> {t("createPlaylist")}
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-1">
            {playlists.map((playlist) => {
              const isOwn = userId === playlist.userId;
              return (
                <Link
                  key={playlist.id}
                  href={`/${locale}/home/playlists/${playlist.id}`}
                  className={`flex items-center gap-3 rounded border px-3 py-2.5 transition-all hover:-translate-y-px cursor-pointer ${base.card}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border ${isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#c4b8a8]/40 bg-[#f5f0e8]"}`}>
                    <ListMusic size={16} className={base.muted} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`truncate text-[11px] font-bold tracking-wider ${base.text}`}>
                      {playlist.title}
                    </div>
                    <div className={`text-[11px] tracking-wide ${base.muted}`}>
                      {playlist.trackCount} {t("tracksCount")}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {playlist.isCollaborative && (
                      <span className={`rounded border px-1.5 py-0.5 text-[11px] tracking-wider ${base.badge}`}>
                        COLLAB
                      </span>
                    )}
                    {!playlist.isPublic && isOwn && (
                      <span className={`rounded border px-1.5 py-0.5 text-[11px] tracking-wider ${base.badge}`}>
                        PRIVATE
                      </span>
                    )}
                  </div>

                  <Music size={11} className={base.muted} />

                  {isOwn && (
                    <button
                      onClick={(e) => void handleDelete(e, playlist)}
                      className={`shrink-0 transition-colors ${isDark ? "text-vhs-muted hover:text-red-400" : "text-[#8a8578] hover:text-red-500"}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-1">
              <button
                className={`rounded border px-2 py-1 text-xs transition-colors ${base.badge}`}
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`rounded border px-2 py-1 text-xs transition-colors ${n === page ? base.activeBadge : base.badge}`}
                  onClick={() => handlePageChange(n)}
                >{n}</button>
              ))}
              <button
                className={`rounded border px-2 py-1 text-xs transition-colors ${base.badge}`}
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >›</button>
            </div>
          )}
        </>
      )}

      {/* Create Playlist Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className={`w-full max-w-sm rounded-lg border p-6 shadow-2xl ${base.modal}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <span className={`text-[11px] font-bold tracking-widest ${base.text}`}>
                {t("createPlaylist")}
              </span>
              <button onClick={() => setModalOpen(false)} className={base.muted}>
                <X size={16} />
              </button>
            </div>

            {/* Title input */}
            <div className="mb-4">
              <label className={`block text-[11px] tracking-[2px] mb-1.5 ${base.muted}`}>
                {t("playlistTitle")} *
              </label>
              <input
                className={`w-full rounded border px-3 py-2 text-[11px] tracking-wide outline-none transition-colors ${base.modalInput} focus:border-current`}
                placeholder={t("playlistTitle")}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
                autoFocus
              />
            </div>

            {/* Checkboxes */}
            <div className="mb-5 flex flex-col gap-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 cursor-pointer accent-current"
                  checked={form.isPublic}
                  onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                />
                <span className={`text-xs tracking-wider ${base.text}`}>{t("isPublic")}</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 cursor-pointer accent-current"
                  checked={form.isCollaborative}
                  onChange={(e) => setForm((f) => ({ ...f, isCollaborative: e.target.checked }))}
                />
                <span className={`text-xs tracking-wider ${base.text}`}>{t("isCollaborative")}</span>
              </label>
            </div>

            {createError && (
              <div className="mb-3 text-xs tracking-wide text-red-400">{createError}</div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className={`rounded border px-4 py-1.5 text-xs tracking-widest transition-colors ${base.badge}`}
                disabled={creating}
              >
                {t("collapse")}
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={creating}
                className={`rounded border px-4 py-1.5 text-xs tracking-widest transition-colors ${base.activeBadge} disabled:opacity-50`}
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
