"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader, Lock, Search, X } from "lucide-react";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { ArtistDto } from "@/app/types/user";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

export type ArtistInput = {
  artistId:    number;
  displayName: string;
  role:        "primary" | "feat" | "collaborator";
};

interface Props {
  value:    ArtistInput[];
  onChange: (v: ArtistInput[]) => void;
  featRole: "feat" | "collaborator";
  isDark:   boolean;
}

export function ArtistPicker({ value, onChange, featRole, isDark }: Props) {
  const t = useTranslations("Artist");

  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<ArtistDto[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]           = useState(false);
  const debounce                  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef              = useRef<HTMLDivElement>(null);

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

  const handleSearch = (q: string) => {
    setQuery(q);
    clearTimeout(debounce.current);

    if(!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get<PaginatedResponse<ArtistDto>>(
          `${API_ENDPOINTS.artists.list}?displayName=${encodeURIComponent(q)}&limit=10`,
        );
        const addedIds = new Set(value.map((a) => a.artistId));
        setResults(data.data.filter((a) => !addedIds.has(a.userId)));
        setOpen(true);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const add = (artist: ArtistDto) => {
    onChange([...value, { artistId: artist.userId, displayName: artist.displayName, role: featRole }]);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const remove = (artistId: number) => {
    onChange(value.filter((a) => !(a.artistId === artistId && a.role !== "primary")));
  };

  const featLabel = featRole === "feat" ? t("featArtist") : t("collaboratorArtist");

  const rowCls = `flex items-center justify-between gap-2 rounded border px-3 py-2 text-[11px] ${
    isDark ? "border-royalblue/20 bg-royalblue/10" 
            : "border-[#c4b8a8]/30 bg-[#ede7db]/40"
  }`;

  return (
    <div className="space-y-2">
      {/* Artist list */}
      <div className="space-y-1">
        {value.map((a) => (
          <div key={`${a.artistId}-${a.role}`} className={rowCls}>
            <span className={isDark ? "text-vhs-white" : "text-[#2a2520]"}>{a.displayName}</span>
            <div className="flex items-center gap-2">
              <span
                className={`rounded border px-1.5 py-0.5 text-[9px] tracking-widest ${
                  a.role === "primary"
                    ? isDark ? "border-fear/30 text-fear" : "border-[#c4234e]/30 text-[#c4234e]"
                    : isDark ? "border-royalblue/30 text-vhs-muted" : "border-[#c4b8a8] text-[#8a8578]"
                }`}
              >
                {a.role === "primary" ? t("primaryArtist") : featLabel}
              </span>
              {a.role === "primary"
                ? (
                <Lock size={11} className={isDark ? "text-vhs-muted" : "text-[#8a8578]"} />
              ) : (
                <button
                  type="button"
                  onClick={() => remove(a.artistId)}
                  className={isDark ? "text-vhs-muted hover:text-red-400" : "text-[#8a8578] hover:text-red-500"}
                >
                  <X size={13} />
                </button>
                )
              }
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div ref={containerRef} className="relative">
        <div
          className={`flex items-center gap-2 rounded border px-3 py-2 ${
            isDark ? "bg-darkblue/60 border-royalblue/30" : "bg-[#ede7db]/80 border-[#c4b8a8]/40"
          }`}
        >
          {searching
            ? <Loader size={13} className={`animate-spin shrink-0 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`} />
            : <Search size={13} className={isDark ? "text-vhs-muted" : "text-[#8a8578]"} />
          }
          <input
            type="text"
            className="flex-1 bg-transparent text-[11px] tracking-wider outline-none"
            placeholder={t("searchArtists")}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {open && results.length > 0 && (
          <ul
            className={`absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded border shadow-lg ${
              isDark ? "bg-vhs-surface border-royalblue/30" : "bg-white border-[#c4b8a8]/40"
            }`}
          >
            {results.map((artist) => (
              <li key={artist.userId}>
                <button
                  type="button"
                  onClick={() => add(artist)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] transition-colors ${
                    isDark ? "text-vhs-light hover:bg-royalblue/20" : "text-[#4a4540] hover:bg-[#f5f0e8]"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                      isDark ? "bg-royalblue/30 text-vhs-cyan" : "bg-[#f5f0e8] text-[#c4234e]"
                    }`}
                  >
                    {artist.displayName[0]?.toUpperCase()}
                  </div>
                  <span className="tracking-wide">{artist.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {open && !searching && query.trim() && results.length === 0 && (
          <div
            className={`absolute left-0 right-0 top-full z-50 mt-1 rounded border px-3 py-2.5 text-[10px] shadow-lg ${
              isDark ? "bg-vhs-surface border-royalblue/30 text-vhs-muted" : "bg-white border-[#c4b8a8]/40 text-[#8a8578]"
            }`}
          >
            {t("noArtistsFound")}
          </div>
        )}
      </div>
    </div>
  );
}
