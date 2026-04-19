"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import ElectricBorder from "@/app/components/ui/react-bits/electric-border/ElectricBorder";
import Noise from "@/app/components/ui/react-bits/noise/Noise";
import { useTheme } from "@/lib/hooks";

export default function NotFound() {
  const t = useTranslations("NotFound");
  const { locale } = useParams<{ locale: string }>();
  const { isDark } = useTheme();

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden font-vcr px-4 ${
        isDark ? "bg-darkblue" : "bg-light-bg"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <Noise
          patternSize={50}
          patternScaleX={5}
          patternScaleY={5}
          patternRefreshInterval={2}
          patternAlpha={25}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 vhs-scanlines" />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <div className="mb-6">
          <ElectricBorder
            color="#ed2c5e"
            speed={1}
            chaos={0.07}
            thickness={2}
            style={{ borderRadius: 2 }}
          >
            <div className={`px-5 py-2 text-xs tracking-[3px] uppercase ${isDark ? "text-vhs-muted" : "text-light-muted"}`}>
              {t("code")}
            </div>
          </ElectricBorder>
        </div>

        <h1 className="text-7xl font-black tracking-tight text-fear md:text-9xl">
          404
        </h1>

        <h2 className={`mt-4 text-2xl font-bold tracking-[2px] uppercase md:text-4xl ${isDark ? "text-vhs-white" : "text-light-text"}`}>
          {t("title")}
        </h2>

        <p className={`mt-4 text-sm leading-relaxed tracking-wider ${isDark ? "text-vhs-muted" : "text-light-muted"}`}>
          {t("description")}
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/${locale}`}
            className="w-full rounded-sm bg-fear px-8 py-3 text-xs font-bold tracking-[3px] uppercase text-white transition-all hover:brightness-110 sm:w-auto"
          >
            {t("backHome")}
          </Link>
          <button
            onClick={() => window.history.back()}
            className={`w-full rounded-sm border px-8 py-3 text-xs font-bold tracking-[3px] uppercase transition-all sm:w-auto ${
              isDark
                ? "border-royalblue/40 text-vhs-muted hover:border-royalblue hover:text-vhs-white"
                : "border-light-border text-light-muted hover:border-light-subtle hover:text-light-text"
            }`}
          >
            {t("goBack")}
          </button>
        </div>

        <div
          className={`mt-10 w-full rounded-sm border p-5 text-left ${
            isDark
              ? "bg-vhs-card border-royalblue/30"
              : "bg-light-card border-light-border/40"
          }`}
        >
          <h3 className={`mb-3 text-xs font-bold tracking-[2px] uppercase ${isDark ? "text-vhs-white" : "text-light-text"}`}>
            {t("tipsTitle")}
          </h3>
          <ul className={`space-y-2 text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-light-muted"}`}>
            <li>• {t("tip1")}</li>
            <li>• {t("tip2")}</li>
            <li>• {t("tip3")}</li>
          </ul>
        </div>

        <p className={`mt-6 text-xs ${isDark ? "text-vhs-muted/50" : "text-light-muted/50"}`}>
          Error code: <span className="font-mono">{t("errorCode")}</span>
        </p>
      </div>
    </div>
  );
}
