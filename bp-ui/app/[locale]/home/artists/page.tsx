"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Music } from "lucide-react";
import { PageHeader } from "@/app/components/ui/elastic-slider/StoreUI";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { ArtistDto } from "@/app/types/user";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

const AVATAR_COLORS = ["#00e5ff", "#9b59ff", "#ed2c5e", "#f4e526", "#00ff88"];

export default function ArtistsPage() {
  const t                           = useTranslations("Store");
  const { isDark }                  = useStoreTheme();
  const { locale }                  = useParams<{ locale: string }>();
  const [artists, setArtists]       = useState<ArtistDto[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get<PaginatedResponse<ArtistDto>>(API_ENDPOINTS.artists.list)
      .then(({ data }) => setArtists(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title={t("artists")} count={artists.length} />

      {loading ? (
        <div className="flex justify-center py-16">
          <span
            className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`}
          />
        </div>
      ) : artists.length === 0 ? (
        <div
          className={`py-16 text-center text-[11px] tracking-widest ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
        >
          {t("noArtists")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {artists.map((artist, i) => {
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <Link
                key={artist.userId}
                href={`/${locale}/home/artists/${artist.userId}`}
                className={`animate-slide-up cursor-pointer rounded border p-4 text-center transition-all hover:-translate-y-0.5 block ${
                  isDark
                    ? "border-royalblue/20 bg-vhs-card hover:border-royalblue/40"
                    : "border-[#c4b8a8]/30 bg-white/80 hover:border-[#c4b8a8]/50"
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 sm:h-20 sm:w-20 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${color}33, transparent)`,
                    borderColor: `${color}44`,
                    color,
                  }}
                >
                  {artist.profileImageUrl ? (
                    <img
                      src={artist.profileImageUrl}
                      alt={artist.displayName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <Music size={28} />
                  )}
                </div>

                <div
                  className={`mb-1 truncate text-[10px] font-bold tracking-wider sm:text-[11px] ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                >
                  {artist.displayName.toUpperCase()}
                </div>

                {artist.bio && (
                  <div
                    className={`mb-2 line-clamp-2 text-[9px] tracking-wide ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
                  >
                    {artist.bio}
                  </div>
                )}

                {artist.artistSince && (
                  <div
                    className={`mt-1 text-[9px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
                  >
                    {t("since")} {new Date(artist.artistSince).getFullYear()}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
