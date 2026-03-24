"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Disc3, Search } from "lucide-react";
import { PageHeader } from "@/app/components/ui/elastic-slider/StoreUI";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { AlbumDto } from "@/app/types/album";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

const PAGE_SIZE = 20;

export default function AlbumsPage() {
  const t              = useTranslations("Store");
  const { isDark }     = useStoreTheme();
  const { locale }     = useParams<{ locale: string }>();

  const [albums, setAlbums]   = useState<AlbumDto[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = useCallback(async (p: number, title: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
      if (title) params.set("title", title);
      const { data } = await api.get<PaginatedResponse<AlbumDto>>(`${API_ENDPOINTS.albums.list}?${params}`);
      setAlbums(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

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
    }
    : {
      card:        "border-[#c4b8a8]/30 bg-white/80 hover:border-[#c4b8a8]/60",
      text:        "text-[#2a2520]",
      muted:       "text-[#8a8578]",
      badge:       "bg-[#f5f0e8] text-[#6b5f4e] border-[#d4c8b0]",
      activeBadge: "bg-[#c4234e] text-white border-[#c4234e]",
      input:       "bg-white border-[#c4b8a8] text-[#2a2520] placeholder:text-[#8a8578]",
      accent:      "text-[#c4234e]",
    };

  return (
    <>
      <PageHeader title={t("albums")} count={total} />

      <div className={`relative mb-4 flex items-center gap-2 rounded border px-3 py-2 ${base.input}`}>
        <Search size={14} className={base.muted} />
        <input
          className="flex-1 bg-transparent text-[11px] tracking-wide outline-none"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`} />
        </div>
      ) : albums.length === 0 ? (
        <div className={`py-16 text-center text-[11px] tracking-widest ${base.muted}`}>
          {t("noAlbums")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/${locale}/home/albums/${album.id}`}
                className={`rounded border p-3 transition-all hover:-translate-y-px cursor-pointer ${base.card}`}
              >
                <div className={`relative mb-3 aspect-square w-full overflow-hidden rounded border ${isDark ? "border-royalblue/20 bg-royalblue/10" : "border-[#c4b8a8]/40 bg-[#f5f0e8]"}`}>
                  {album.coverImageUrl ? (
                    <img src={album.coverImageUrl} alt={album.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Disc3 size={32} className={base.muted} />
                    </div>
                  )}
                </div>
                <div className={`truncate text-[11px] font-bold tracking-wider ${base.text}`}>
                  {album.title}
                </div>
                <div className={`truncate text-[9px] tracking-wide mt-0.5 ${base.muted}`}>
                  {album.artists.map((a) => a.displayName).join(", ")}
                </div>
                <div className={`flex items-center justify-between mt-1.5`}>
                  <span className={`text-[9px] tracking-wide ${base.muted}`}>
                    {new Date(album.releaseDate).getFullYear()}
                  </span>
                  <span className={`text-[10px] font-semibold tracking-wider ${base.accent}`}>
                    {album.price} CZK
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-1">
              <button
                className={`rounded border px-2 py-1 text-[10px] transition-colors ${base.badge}`}
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`rounded border px-2 py-1 text-[10px] transition-colors ${n === page ? base.activeBadge : base.badge}`}
                  onClick={() => handlePageChange(n)}
                >{n}</button>
              ))}
              <button
                className={`rounded border px-2 py-1 text-[10px] transition-colors ${base.badge}`}
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >›</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
