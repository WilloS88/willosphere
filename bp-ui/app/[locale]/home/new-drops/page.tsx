"use client";

import { useTranslations } from "next-intl";
import { ALBUMS } from "@/lib/store-data";
import { PageHeader, CardGrid, Badge } from "@/app/components/ui/elastic-slider/StoreUI";
import { AlbumCard } from "@/app/components/cards/Cards";
import { useStoreTheme } from "@/app/context/StoreThemeContext";

export default function NewDropsPage() {
  const t           = useTranslations("Store");
  const { isDark }  = useStoreTheme();
  const newest      = [...ALBUMS].reverse();

  return (
    <>
      <PageHeader title={t("newDrops")} count={newest.length} />
      <div
        className={`mb-5 flex items-center gap-3 rounded border p-3 ${
          isDark
            ? "border-fearyellow/20 bg-fearyellow/5"
            : "border-[#c4a800]/20 bg-[#c4a800]/5"
        }`}
      >
        <span className="animate-pulse-vhs text-lg">◉</span>
        <div>
          <div
            className={`text-[11px] font-bold tracking-wider ${isDark ? "text-fearyellow" : "text-[#c4a800]"}`}
          >
            {t("freshUploads")}
          </div>
          <div
            className={`mt-0.5 text-[9px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
          >
            {t("newRecordsAdded", { count: newest.length })}
          </div>
        </div>
        <Badge variant="yellow" className="ml-auto">
          {t("new")}
        </Badge>
      </div>
      <CardGrid>
        {newest.map((album, i) => (
          <AlbumCard key={album.id} album={album} index={i} />
        ))}
      </CardGrid>
    </>
  );
}
