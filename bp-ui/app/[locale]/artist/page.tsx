"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Settings, Music, Disc2, Star } from "lucide-react";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { Footer } from "@/app/components/layout/Footer";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { SectionLabel, Badge } from "@/app/components/ui/elastic-slider/StoreUI";

function ArtistContent() {
  const { locale }   = useParams<{ locale: string }>();
  const { isDark }   = useStoreTheme();
  const { session }  = useAuth();
  const t            = useTranslations("Artist");
  const name         = session?.user.displayName ?? "ARTIST";

  const statCls = `text-center p-4 rounded border ${isDark ? "bg-darkblue/60 border-royalblue/20" : "bg-[#ede7db]/60 border-[#c4b8a8]/20"}`;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <SectionLabel className="mb-1">{t("dashboard")}</SectionLabel>
            <h1
              className={`text-2xl font-bold tracking-[3px] sm:text-3xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
            >
              {name}
            </h1>
          </div>
          <Link
            href={`/${locale}/artist/profile`}
            className={`rounded-sm border px-4 py-2 text-[10px] font-bold tracking-[2px] no-underline transition-all ${
              isDark
                ? "border-royalblue/40 text-vhs-light hover:border-fear"
                : "border-[#c4b8a8] text-[#6b6560] hover:border-[#c4234e]"
            }`}
          >
            <Settings size={12} /> {t("editProfile")}
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("tracks"), value: "—", color: "text-fear" },
            { label: t("albums"), value: "—", color: "text-vhs-purple" },
            { label: t("followers"), value: "—", color: "text-vhs-cyan" },
            { label: t("plays"), value: "—", color: "text-vhs-green" },
          ].map((s) => (
            <div key={s.label} className={statCls}>
              <div
                className={`mb-1 text-[9px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
              >
                {s.label}
              </div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div
          className={`mb-6 rounded border p-5 sm:p-6 ${isDark ? "bg-vhs-card/60 border-royalblue/20" : "border-[#c4b8a8]/30 bg-white/70"}`}
        >
          <SectionLabel className="mb-4">{t("quickActions")}</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: t("uploadTrack"), icon: <Music size={20} />, href: "#" },
              { label: t("createAlbum"), icon: <Disc2 size={20} />, href: "#" },
              { label: t("addMerch"), icon: <Star size={20} />, href: "#" },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className={`flex items-center gap-3 rounded border p-3 no-underline transition-all hover:-translate-y-0.5 ${
                  isDark
                    ? "border-royalblue/20 bg-royalblue/10 text-vhs-light hover:border-fear/30"
                    : "border-[#c4b8a8]/30 bg-[#ede7db]/40 text-[#6b6560] hover:border-[#c4234e]/20"
                }`}
              >
                <span className="text-xl">{a.icon}</span>
                <span className="text-[11px] font-bold tracking-[2px]">
                  {a.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity placeholder */}
        <div
          className={`rounded border p-5 sm:p-6 ${isDark ? "bg-vhs-card/60 border-royalblue/20" : "border-[#c4b8a8]/30 bg-white/70"}`}
        >
          <SectionLabel className="mb-4">{t("recentActivity")}</SectionLabel>
          <div
            className={`py-8 text-center text-[11px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
          >
            {t("noActivity")}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ArtistPage() {
  return (
    <PageShell>
      <ArtistContent />
    </PageShell>
  );
}
