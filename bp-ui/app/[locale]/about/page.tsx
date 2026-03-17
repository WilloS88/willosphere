"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Target, Eye, LayoutGrid } from "lucide-react";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { Footer } from "@/app/components/layout/Footer";
import { useStoreTheme } from "@/app/context/StoreThemeContext";

function AboutContent() {
  const t           = useTranslations("About");
  const { locale }  = useParams<{ locale: string }>();
  const { isDark }  = useStoreTheme();

  const cardCls = `p-5 rounded border transition-all hover:-translate-y-0.5 ${
    isDark
      ? "bg-vhs-card border-royalblue/20 hover:border-fear/30"
      : "bg-white/80 border-[#c4b8a8]/30 hover:border-[#c4234e]/20"
  }`;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        {/* Breadcrumbs */}
        <div
          className={`mb-6 flex gap-2 text-[10px] tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
        >
          <Link
            href={`/${locale}`}
            className={`no-underline ${isDark ? "text-fear hover:text-fearyellow" : "text-[#c4234e] hover:text-[#a01d40]"}`}
          >
            {t("home")}
          </Link>
          <span>/</span>
          <span>{t("title")}</span>
        </div>

        <div
          className={`mb-6 rounded border p-6 sm:p-8 ${isDark ? "bg-vhs-card/60 border-royalblue/20" : "border-[#c4b8a8]/30 bg-white/70"}`}
        >
          <h1
            className={`mb-4 text-2xl font-bold tracking-[3px] sm:text-3xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
          >
            {t("title")}
          </h1>
          <p
            className={`text-[12px] leading-relaxed tracking-wider ${isDark ? "text-vhs-light" : "text-[#6b6560]"}`}
          >
            {t("intro")}
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            { title: t("missionTitle"), text: t("missionText"), icon: <Target size={18} /> },
            { title: t("visionTitle"), text: t("visionText"), icon: <Eye size={18} /> },
            { title: t("valuesTitle"), text: t("valuesText"), icon: <LayoutGrid size={18} /> },
          ].map((c) => (
            <div key={c.title} className={cardCls}>
              <div className="mb-2 text-xl">{c.icon}</div>
              <h2
                className={`mb-2 text-sm font-bold tracking-[2px] ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
              >
                {c.title}
              </h2>
              <p
                className={`text-[11px] leading-relaxed tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
              >
                {c.text}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/${locale}/contact`}
            className={`rounded-sm px-6 py-2.5 text-center text-[11px] font-bold tracking-[2px] no-underline ${isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"}`}
          >
            {t("contact")}
          </Link>
          <Link
            href={`/${locale}`}
            className={`rounded-sm border px-6 py-2.5 text-center text-[11px] font-bold tracking-[2px] no-underline ${isDark ? "border-royalblue/40 text-vhs-light" : "border-[#c4b8a8] text-[#6b6560]"}`}
          >
            {t("backHome")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function AboutPage() {
  return (
    <PageShell>
      <AboutContent />
    </PageShell>
  );
}
