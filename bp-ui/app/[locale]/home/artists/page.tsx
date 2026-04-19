"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Music } from "lucide-react";
import { PageHeader } from "@/app/components/ui/elastic-slider/StoreUI";
import { useTheme } from "@/lib/hooks";
import { VHSSpinner } from "@/app/components/ui/VHSSpinner";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { ArtistDto } from "@/app/types/user";
import type { PaginatedResponse } from "@/app/types/pagination";
import api from "@/lib/axios";

const AVATAR_COLORS = ["#00e5ff", "#9b59ff", "#ed2c5e", "#f4e526", "#00ff88"];

export default function ArtistsPage() {
  const t                           = useTranslations("Store");
  const { isDark }                  = useTheme();
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
          <VHSSpinner size="lg" />
        </div>
      ) : artists.length === 0 ? (
        <div
          className={`py-16 text-center text-xs tracking-widest uppercase ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
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
                    : "border-[#a89888]/30 bg-white/80 hover:border-[#a89888]/50"
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
                  className={`mb-1 truncate text-xs font-bold tracking-wider sm:text-xs ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                >
                  {artist.displayName.toUpperCase()}
                </div>

                {artist.bio && (
                  <div
                    className={`mb-2 line-clamp-2 text-xs tracking-wide ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
                  >
                    {artist.bio}
                  </div>
                )}

                {artist.artistSince && (
                  <div
                    className={`mt-1 text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
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
