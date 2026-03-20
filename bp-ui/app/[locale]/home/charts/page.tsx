"use client";

import { useTranslations } from "next-intl";
import { Play, Heart, Music, Flame } from "lucide-react";
import { ALBUMS } from "@/lib/store-data";
import { PageHeader, Badge } from "@/app/components/ui/elastic-slider/StoreUI";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import TiltedCard from "@/app/components/ui/react-bits/TiltedCard";
import { cn } from "@/lib/utils";

export default function ChartsPage() {
  const t           = useTranslations("Store");
  const { isDark }  = useStoreTheme();
  const sorted      = [...ALBUMS].sort((a, b) => b.price - a.price);

  return (
    <>
      <PageHeader title={t("topCharts")} count={sorted.length} />

      {/* Featured #1 — with TiltedCard */}
      <div
        className={`mb-6 flex flex-col items-center gap-4 rounded border p-4 sm:flex-row sm:gap-6 sm:p-6 ${
          isDark
            ? "from-royalblue/20 border-fear/20 bg-gradient-to-r to-transparent"
            : "border-[#c4234e]/15 bg-gradient-to-r from-[#c4234e]/5 to-transparent"
        }`}
      >
        <div className="h-36 w-36 shrink-0 sm:h-44 sm:w-44">
          <TiltedCard
            containerHeight="100%"
            containerWidth="100%"
            imageHeight="140px"
            imageWidth="140px"
            rotateAmplitude={12}
            scaleOnHover={1.08}
            showMobileWarning={false}
            showTooltip={false}
            captionText=""
            imageSrc={`data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${sorted[0].color}" stop-opacity="0.7"/><stop offset="100%" stop-color="#0b0f2d"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)" rx="12"/><text x="150" y="150" text-anchor="middle" fill="white" font-size="16" font-family="monospace">#1</text></svg>`,
            )}`}
            altText={sorted[0].title}
          />
        </div>
        <div>
          <Badge variant="fear" className="mb-2">
            #{1} {t("thisWeek")}
          </Badge>
          <h2
            className={`mt-2 text-lg font-bold tracking-[3px] sm:text-xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
          >
            {sorted[0].title}
          </h2>
          <p
            className={`mt-1 text-[11px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
          >
            {sorted[0].artist} // {sorted[0].year}
          </p>
          <div
            className={`mt-3 flex gap-2 text-[9px] tracking-wider ${isDark ? "text-vhs-light" : "text-[#6b6560]"}`}
          >
            <span className="flex items-center gap-1"><Play size={9} />12,847 {t("plays")}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Heart size={9} />3,291 {t("likes")}</span>
          </div>
        </div>
      </div>

      {/* Ranked list */}
      <div className="space-y-2">
        {sorted.map((album, i) => (
          <div
            key={album.id}
            className={cn(
              "animate-slide-up flex items-center gap-3 rounded border border-transparent p-2.5 transition-all sm:gap-4 sm:p-3",
              isDark
                ? "hover:bg-royalblue/10 hover:border-royalblue/20"
                : "hover:border-[#c4b8a8]/30 hover:bg-[#c4234e]/5",
            )}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <span className="text-fear min-w-[28px] text-center text-base font-bold sm:text-lg">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded sm:h-12 sm:w-12 ${isDark ? "bg-royalblue/30" : "bg-[#c4b8a8]/20"}`}
              style={{ color: album.color }}
            >
              <Music size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`truncate text-[11px] font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
              >
                {album.title}
              </div>
              <div
                className={`text-[9px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
              >
                {album.artist} // {album.year}
              </div>
            </div>
            <div
              className={`hidden text-[10px] tracking-wider sm:block ${isDark ? "text-vhs-light" : "text-[#6b6560]"}`}
            >
              {Math.floor(1000 + i * 1200)} {t("plays")}
            </div>
            <span className="text-[10px] text-orange-400">{i < 3 ? <Flame size={12} /> : null}</span>
          </div>
        ))}
      </div>
    </>
  );
}
