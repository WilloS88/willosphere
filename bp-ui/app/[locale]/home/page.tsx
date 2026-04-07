"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader, CardGrid } from "@/app/components/ui/elastic-slider/StoreUI";
import { AlbumCard } from "@/app/components/cards/Cards";
import { ALBUMS } from "@/lib/store-data";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import type { PaginatedResponse } from "@/app/types/pagination";
import type { TrackDto } from "@/app/types/track";
import api from "@/lib/axios";

export default function HomePage() {
  const t           = useTranslations("Store");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get<PaginatedResponse<TrackDto>>(`${API_ENDPOINTS.tracks.list}?limit=1`)
      .then(({ data }) => setTotal(data.total))
      .catch(() => setTotal(ALBUMS.length));
  }, []);

  return (
    <>
      <PageHeader title={t("browseMusic")} count={total} />
      <CardGrid>
        {ALBUMS.map((a, i) => (
          <AlbumCard key={a.id} album={a} index={i} />
        ))}
      </CardGrid>
    </>
  );
}
