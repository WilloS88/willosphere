"use client";

import { useTranslations } from "next-intl";
import { MERCH_ITEMS } from "@/lib/store-data";
import { PageHeader, CardGrid } from "@/app/components/ui/elastic-slider/StoreUI";
import { MerchCard } from "@/app/components/cards/Cards";

export default function MerchPage() {
  const t = useTranslations("Store");

  return (
    <>
      <PageHeader title={t("merchShop")} count={156} />
      <CardGrid minWidth={200}>
        {MERCH_ITEMS.map((item, i) => (
          <MerchCard key={item.id} item={item} index={i} />
        ))}
      </CardGrid>
    </>
  );
}
