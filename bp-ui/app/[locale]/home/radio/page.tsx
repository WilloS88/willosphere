"use client";

import { useTranslations } from "next-intl";
import { PageHeader, SectionLabel } from "@/app/components/ui/elastic-slider/StoreUI";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { cn } from "@/lib/utils";

const STATIONS = [
  {
    name: "SYNTHWAVE_FM",
    genre: "SYNTHWAVE",
    listeners: 2847,
    color: "#00e5ff",
    active: true,
  },
  {
    name: "VAPOR_LOUNGE",
    genre: "VAPORWAVE",
    listeners: 1532,
    color: "#9b59ff",
    active: false,
  },
  {
    name: "CYBER_BEATS",
    genre: "CYBERPUNK",
    listeners: 3210,
    color: "#ed2c5e",
    active: false,
  },
  {
    name: "CHILL_ZONE_24/7",
    genre: "LO-FI_BEATS",
    listeners: 5891,
    color: "#00ff88",
    active: false,
  },
  {
    name: "DARK_FREQUENCIES",
    genre: "DARK_AMBIENT",
    listeners: 892,
    color: "#f4e526",
    active: false,
  },
  {
    name: "RETRO_PULSE",
    genre: "RETROWAVE",
    listeners: 1750,
    color: "#00e5ff",
    active: false,
  },
];

export default function RadioPage() {
  const t           = useTranslations("Store");
  const { isDark }  = useStoreTheme();

  return (
    <>
      <PageHeader title={t("radioMix")} count={STATIONS.length} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {STATIONS.map((station, i) => (
          <div
            key={station.name}
            className={cn(
              "animate-slide-up cursor-pointer rounded border p-4 transition-all hover:-translate-y-0.5 sm:p-5",
              isDark ? "bg-vhs-card" : "bg-white/80",
              station.active
                ? "border-fear/40 shadow-[0_0_20px_rgba(237,44,94,0.15)]"
                : isDark
                  ? "border-royalblue/20 hover:border-royalblue/40"
                  : "border-[#c4b8a8]/30 hover:border-[#c4b8a8]/50",
            )}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>{station.genre}</SectionLabel>
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    station.active ? "bg-fear animate-blink" : "bg-vhs-green",
                  )}
                />
                <span
                  className={`text-[9px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
                >
                  {station.active ? t("onAir") : t("live")}
                </span>
              </div>
            </div>
            <h3
              className={`mb-2 text-sm font-bold tracking-[2px] sm:text-base ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
            >
              {station.name}
            </h3>
            <div className="mb-3 flex h-6 items-end gap-[2px]">
              {Array.from({ length: 20 }).map((_, j) => (
                <div
                  key={j}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${(20 + Math.sin(j * 0.8 + i) * 60).toFixed(2)}%`,
                    background: station.color,
                    opacity: +((0.3 + ((j * 7 + i * 3) % 10) * 0.04).toFixed(2)),
                  }}
                />
              ))}
            </div>
            <div
              className={`text-[9px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
            >
              ◈ {station.listeners.toLocaleString()} {t("listeners")}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
