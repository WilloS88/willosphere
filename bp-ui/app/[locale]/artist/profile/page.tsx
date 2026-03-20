"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { SectionLabel, Badge } from "@/app/components/ui/elastic-slider/StoreUI";

function ProfileContent() {
  const { locale }   = useParams<{ locale: string }>();
  const { isDark }   = useStoreTheme();
  const { session }  = useAuth();
  const t            = useTranslations("Artist");
  const user         = session?.user;

  const inputCls = `w-full rounded-sm px-3 py-2.5 border outline-none text-[11px] tracking-wider font-vcr transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#c4b8a8]/40 text-[#2a2520] placeholder:text-[#8a8578] focus:border-[#c4234e]"
  }`;
  const labelCls = `block text-[9px] tracking-[2px] mb-1.5 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href={`/${locale}/artist`}
          className={`mb-6 inline-flex items-center gap-1.5 text-[10px] tracking-[2px] no-underline ${isDark ? "text-vhs-muted hover:text-fear" : "text-[#8a8578] hover:text-[#c4234e]"}`}
        >
          <ArrowLeft size={12} /> {t("backToDashboard")}
        </Link>

        <div
          className={`rounded border p-6 sm:p-8 ${isDark ? "bg-vhs-card/80 border-royalblue/20" : "border-[#c4b8a8]/30 bg-white/80"}`}
        >
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <div className="from-fear to-vhs-purple border-fear/40 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-gradient-to-br text-2xl font-bold text-white">
              {user?.displayName?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h1
                className={`text-xl font-bold tracking-[3px] ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
              >
                {user?.displayName ?? "ARTIST"}
              </h1>
              <div className="mt-1 flex gap-1.5">
                {user?.roles?.map((r, i) => (
                  <Badge key={i} variant="cyan" className="text-[8px]">
                    {typeof r === "string"
                      ? r.toUpperCase()
                      : r.role.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`border-t pt-5 ${isDark ? "border-royalblue/20" : "border-[#c4b8a8]/20"}`}
          >
            <SectionLabel className="mb-4">{t("editProfile")}</SectionLabel>

            <form className="space-y-4">
              <div>
                <label className={labelCls}>{t("displayName")}</label>
                <input
                  type="text"
                  className={inputCls}
                  defaultValue={user?.displayName ?? ""}
                />
              </div>
              <div>
                <label className={labelCls}>{t("email")}</label>
                <input
                  type="email"
                  className={inputCls}
                  defaultValue={user?.email ?? ""}
                  disabled
                />
              </div>
              <div>
                <label className={labelCls}>{t("bio")}</label>
                <textarea
                  className={`${inputCls} min-h-[80px] resize-y`}
                  placeholder={t("bioPlaceholder")}
                />
              </div>
              <div>
                <label className={labelCls}>{t("profileImageUrl")}</label>
                <input
                  type="url"
                  className={inputCls}
                  placeholder={t("imageUrlPlaceholder")}
                />
              </div>

              <button
                type="button"
                className={`w-full cursor-pointer rounded-sm py-2.5 text-[11px] font-bold tracking-[2px] transition-all hover:brightness-110 ${isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"}`}
              >
                {t("saveChanges")}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

export default function ArtistProfilePage() {
  return (
    <PageShell>
      <ProfileContent />
    </PageShell>
  );
}
