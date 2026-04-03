"use client";

import { useTranslations } from "next-intl";
import { ALBUMS } from "@/lib/store-data";
import { PageHeader, CardGrid } from "@/app/components/ui/elastic-slider/StoreUI";
import { AlbumCard } from "@/app/components/cards/Cards";
import TextType from "@/app/components/ui/react-bits/text-type/TextType";
import { useTheme } from "@/lib/hooks";

export default function HomePage() {
  const t           = useTranslations("Store");
  const { isDark }  = useTheme();

  return (
    <>
      <div
        className={`font-vcr mb-2 text-[11px] ${isDark ? "text-vhs-cyan" : "text-[#0094a8]"}`}
      >
<TextType
          text={`// ${t("showingRecords", { count: 428 })}`}
          typingSpeed={30}
          loop={false}
          showCursor
          cursorCharacter="█"
          cursorBlinkDuration={0.5}
        />
      </div>
      <PageHeader title={t("browseMusic")} count={428} />
      <CardGrid>
        {ALBUMS.map((a, i) => (
          <AlbumCard key={a.id} album={a} index={i} />
        ))}
      </CardGrid>
    </>
  );
}
