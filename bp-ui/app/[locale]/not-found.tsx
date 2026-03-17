"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import ElectricBorder from "@/app/components/ui/react-bits/electric-border/ElectricBorder";
import Noise from "@/app/components/ui/react-bits/noise/Noise";

export default function NotFound() {
  const t              = useTranslations("NotFound");
  const { locale }     = useParams<{ locale: string }>();

  return (
    <div className="hero min-h-screen bg-base-200 relative overflow-hidden font-fear">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Noise
          patternSize={50}
          patternScaleX={5}
          patternScaleY={5}
          patternRefreshInterval={2}
          patternAlpha={25}
        />
      </div>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl" />
      </div>

      <div className="hero-content text-center relative z-10 px-4">
        <div className="max-w-2xl">
          <div className="mb-6 flex justify-center">
            <ElectricBorder
              color="#ed2c5e"
              speed={1}
              chaos={0.07}
              thickness={2}
              style={{ borderRadius: 16 }}
            >
              <div className="p-5 text-xl">
                {t("code")}
              </div>
            </ElectricBorder>
          </div>

          <h1 className="text-7xl md:text-9xl font-black tracking-tight text-[#ed2c5e]">
            404
          </h1>

          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-base-content">
            {t("title")}
          </h2>

          <p className="mt-5 text-base md:text-lg text-base-content/70 leading-relaxed max-w-xl mx-auto">
            {t("description")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={`/${locale}`} className="btn bg-[#ed2c5e] btn-wide">
              {t("backHome")}
            </Link>

            <button
              onClick={() => window.history.back()}
              className="btn btn-outline btn-wide"
            >
              {t("goBack")}
            </button>
          </div>

          <div className="mt-10">
            <div className="card bg-base-100/70 backdrop-blur shadow-2xl border border-base-300 max-w-lg mx-auto">
              <div className="card-body">
                <h3 className="card-title justify-center text-lg">
                  {t("tipsTitle")}
                </h3>

                <ul className="text-left space-y-2 text-base-content/75">
                  <li>• {t("tip1")}</li>
                  <li>• {t("tip2")}</li>
                  <li>• {t("tip3")}</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm text-base-content/50">
            Error code: <span className="font-mono">{t("errorCode")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
