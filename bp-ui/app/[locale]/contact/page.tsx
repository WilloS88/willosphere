"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { Footer } from "@/app/components/layout/Footer";
import { useStoreTheme } from "@/app/context/StoreThemeContext";

function ContactContent() {
  const t           = useTranslations("Contact");
  const { locale }  = useParams<{ locale: string }>();
  const { isDark }  = useStoreTheme();

  const inputCls = `w-full rounded-sm px-3 py-2 border outline-none text-[11px] tracking-wider font-vcr transition-all ${
    isDark
      ? "bg-darkblue/60 border-royalblue/30 text-vhs-white placeholder:text-vhs-muted focus:border-fear"
      : "bg-[#ede7db]/80 border-[#c4b8a8]/40 text-[#2a2520] placeholder:text-[#8a8578] focus:border-[#c4234e]"
  }`;

  const infoCls = `flex items-center justify-between px-4 py-3 rounded text-[11px] tracking-wider ${
    isDark ? "bg-royalblue/10" : "bg-[#ede7db]/60"
  }`;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div
          className={`mb-6 flex gap-2 text-xs tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
        >
          <Link
            href={`/${locale}`}
            className={`no-underline ${isDark ? "text-fear" : "text-[#c4234e]"}`}
          >
            {t("home")}
          </Link>
          <span>/</span>
          <span>{t("title")}</span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Info card */}
          <div
            className={`rounded border p-5 sm:p-6 ${isDark ? "bg-vhs-card/60 border-royalblue/20" : "border-[#c4b8a8]/30 bg-white/70"}`}
          >
            <h1
              className={`mb-3 text-2xl font-bold tracking-[3px] ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
            >
              {t("title")}
            </h1>
            <p
              className={`mb-4 text-[11px] tracking-wider ${isDark ? "text-vhs-light" : "text-[#6b6560]"}`}
            >
              {t("intro")}
            </p>

            <div
              className={`space-y-2 border-t pt-4 ${isDark ? "border-royalblue/20" : "border-[#c4b8a8]/20"}`}
            >
              <div className={infoCls}>
                <span className={isDark ? "text-vhs-muted" : "text-[#8a8578]"}>
                  {t("emailLabel")}
                </span>
                <a
                  href="mailto:support@willosphere.com"
                  className={`no-underline ${isDark ? "text-vhs-cyan" : "text-[#0094a8]"}`}
                >
                  support@willosphere.com
                </a>
              </div>
              <div className={infoCls}>
                <span className={isDark ? "text-vhs-muted" : "text-[#8a8578]"}>
                  {t("phoneLabel")}
                </span>
                <a
                  href="tel:+420777000000"
                  className={`no-underline ${isDark ? "text-vhs-cyan" : "text-[#0094a8]"}`}
                >
                  +420 777 000 000
                </a>
              </div>
              <div className={infoCls}>
                <span className={isDark ? "text-vhs-muted" : "text-[#8a8578]"}>
                  {t("addressLabel")}
                </span>
                <span
                  className={`text-right ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                >
                  {t("address")}
                </span>
              </div>
            </div>

            <Link
              href={`/${locale}/about`}
              className={`mt-4 inline-block rounded-sm border px-4 py-2 text-xs font-bold tracking-[2px] no-underline ${isDark ? "border-royalblue/40 text-vhs-light" : "border-[#c4b8a8] text-[#6b6560]"}`}
            >
              {t("about")}
            </Link>
          </div>

          {/* Form card */}
          <div
            className={`rounded border p-5 sm:p-6 ${isDark ? "bg-vhs-card/60 border-royalblue/20" : "border-[#c4b8a8]/30 bg-white/70"}`}
          >
            <h2
              className={`mb-4 text-lg font-bold tracking-[2px] ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
            >
              {t("title")}
            </h2>
            <form className="space-y-3">
              <div>
                <label
                  className={`mb-1 block text-[11px] tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
                >
                  {t("name")}
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder={t("namePlaceholder")}
                />
              </div>
              <div>
                <label
                  className={`mb-1 block text-[11px] tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
                >
                  {t("email")}
                </label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder={t("emailPlaceholder")}
                />
              </div>
              <div>
                <label
                  className={`mb-1 block text-[11px] tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
                >
                  {t("message")}
                </label>
                <textarea
                  className={`${inputCls} min-h-[120px] resize-y`}
                  placeholder={t("messagePlaceholder")}
                />
              </div>
              <button
                type="button"
                className={`w-full cursor-pointer rounded-sm py-2.5 text-[11px] font-bold tracking-[2px] transition-all hover:brightness-110 ${isDark ? "bg-fear text-white" : "bg-[#c4234e] text-white"}`}
              >
                {t("send")}
              </button>
              <p
                className={`text-[11px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
              >
                {t("note")}
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ContactPage() {
  return (
    <PageShell>
      <ContactContent />
    </PageShell>
  );
}
