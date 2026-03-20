"use client";

import { useTranslations } from "next-intl";
import { ALBUMS } from "@/lib/store-data";
import { PageHeader, Badge } from "@/app/components/ui/elastic-slider/StoreUI";
import { useStoreTheme } from "@/app/context/StoreThemeContext";

const VINYL_ITEMS = ALBUMS.slice(0, 6).map((a, i) => ({
  ...a,
  vinylColor: [
    "BLACK",
    "RED_SPLATTER",
    "CLEAR_BLUE",
    "GOLD_180G",
    "PICTURE_DISC",
    "MARBLED_PURPLE",
  ][i],
  edition: [
    "STANDARD",
    "LIMITED_500",
    "DELUXE",
    "COLLECTOR",
    "FIRST_PRESS",
    "REMASTER",
  ][i],
  weight: ["140G", "180G", "180G", "200G", "180G", "180G"][i],
}));

export default function VinylPage() {
  const t           = useTranslations("Store");
  const { isDark }  = useStoreTheme();

  return (
    <>
      <PageHeader title={t("vinylStore")} count={VINYL_ITEMS.length} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VINYL_ITEMS.map((vinyl, i) => (
          <div
            key={vinyl.id}
            className={`animate-slide-up overflow-hidden rounded border transition-all hover:-translate-y-0.5 ${
              isDark
                ? "border-royalblue/20 bg-vhs-card hover:border-royalblue/40"
                : "border-[#c4b8a8]/30 bg-white/80 hover:border-[#c4b8a8]/50"
            }`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="flex gap-3 p-3">
              <div
                className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded text-3xl sm:h-28 sm:w-28"
                style={{
                  background: `linear-gradient(135deg, ${vinyl.color}33, ${isDark ? "#0b0f2d" : "#ede7db"})`,
                  color: vinyl.color,
                }}
              >
                ◎
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate text-[11px] font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                >
                  {vinyl.title}
                </div>
                <div
                  className={`mb-2 text-[9px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
                >
                  {vinyl.artist} // {vinyl.year}
                </div>
                <div className="space-y-1">
                  <Badge variant="purple" className="text-[8px]">
                    {vinyl.vinylColor}
                  </Badge>
                  <div
                    className={`text-[9px] tracking-wider ${isDark ? "text-vhs-light" : "text-[#6b6560]"}`}
                  >
                    {vinyl.edition} • {vinyl.weight}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`text-[12px] font-bold ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
                  >
                    ${(vinyl.price * 2.5).toFixed(2)}
                  </span>
                  <button className="bg-fear cursor-pointer rounded-sm px-2.5 py-1 text-[9px] font-bold tracking-wider text-white transition-all hover:brightness-110">
                    {t("addToCart")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
