"use client";

import { useTranslations } from "next-intl";
import { Music } from "lucide-react";
import { PageHeader, Badge } from "@/app/components/ui/elastic-slider/StoreUI";
import { useStoreTheme } from "@/app/context/StoreThemeContext";

const ARTISTS = [
  {
    name: "AESTHETIC_VOX",
    tracks: 47,
    followers: "12.4K",
    color: "#00e5ff",
    verified: true,
  },
  {
    name: "SYNTH_WIZARD",
    tracks: 32,
    followers: "8.7K",
    color: "#9b59ff",
    verified: true,
  },
  {
    name: "TAPE_WARP",
    tracks: 28,
    followers: "6.2K",
    color: "#ed2c5e",
    verified: false,
  },
  {
    name: "MACINTOSH_PLUS_X",
    tracks: 15,
    followers: "23.1K",
    color: "#f4e526",
    verified: true,
  },
  {
    name: "ZERO_ONE",
    tracks: 54,
    followers: "4.8K",
    color: "#00ff88",
    verified: false,
  },
  {
    name: "GHOST_DATA",
    tracks: 41,
    followers: "9.3K",
    color: "#ed2c5e",
    verified: true,
  },
  {
    name: "CITY_SLEEPER",
    tracks: 19,
    followers: "3.1K",
    color: "#00e5ff",
    verified: false,
  },
  {
    name: "DIGITAL_NOIR",
    tracks: 23,
    followers: "5.6K",
    color: "#9b59ff",
    verified: false,
  },
];

export default function ArtistsPage() {
  const t           = useTranslations("Store");
  const { isDark }  = useStoreTheme();

  return (
    <>
      <PageHeader title={t("artists")} count={ARTISTS.length} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {ARTISTS.map((artist, i) => (
          <div
            key={artist.name}
            className={`animate-slide-up cursor-pointer rounded border p-4 text-center transition-all hover:-translate-y-0.5 ${
              isDark
                ? "border-royalblue/20 bg-vhs-card hover:border-royalblue/40"
                : "border-[#c4b8a8]/30 bg-white/80 hover:border-[#c4b8a8]/50"
            }`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 sm:h-20 sm:w-20"
              style={{
                background: `linear-gradient(135deg, ${artist.color}33, transparent)`,
                borderColor: `${artist.color}44`,
                color: artist.color,
              }}
            >
              <Music size={28} />
            </div>
            <div
              className={`mb-1 truncate text-[10px] font-bold tracking-wider sm:text-[11px] ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
            >
              {artist.name}
            </div>
            {artist.verified && (
              <Badge variant="cyan" className="mb-2 text-[8px]">
                {t("verified")}
              </Badge>
            )}
            <div
              className={`mt-2 space-y-0.5 text-[9px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
            >
              <div>
                {artist.tracks} {t("tracks")}
              </div>
              <div>
                {artist.followers} {t("followers")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
