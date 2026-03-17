"use client";

import { useLocale, useTranslations } from "next-intl";
import Flag from "react-flagkit";
import { routing } from "@/app/i18n/routing";
import LocaleSwitcherSelect from "@/app/components/locale/LocaleSwitcherSelect";

const flagCode: Record<string, string> = { cs: "CZ", en: "GB" };

export default function LocaleSwitcher() {
  const t       = useTranslations("LocaleSwitcher");
  const locale  = useLocale();

  const items = routing.locales.map((cur) => ({
    value: cur as any,
    label: t(`locales.${cur}`),
    icon: <Flag country={flagCode[cur] ?? "UN"} size={18} />,
  }));

  return (
    <LocaleSwitcherSelect
      items={items}
      defaultValue={locale as any}
      label={t("label")}
    />
  );
}
