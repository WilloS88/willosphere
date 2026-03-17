"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/app/i18n/navigation";
import { useStoreTheme } from "@/app/context/StoreThemeContext";

export function Footer() {
  const t           = useTranslations("Footer");
  const { isDark }  = useStoreTheme();

  return (
    <footer className={`flex flex-col sm:flex-row justify-between items-center px-5 py-4 border-t font-vcr text-[11px] tracking-wider ${
      isDark
        ? "bg-gradient-to-r from-darkblue to-vhs-surface border-royalblue/30"
        : "bg-gradient-to-r from-[#ede7db] to-[#e5dfd3] border-[#c4b8a8]/30"
    }`}>
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-fear flex items-center justify-center text-white text-xs font-bold vhs-logo-clip">W</div>
        <span className={isDark ? "text-vhs-muted" : "text-[#8a8578]"}>
          © {new Date().getFullYear()} WILLOSPHERE. {t("rights")}.
        </span>
      </div>

      <nav className="flex items-center gap-4 mt-2 sm:mt-0">
        <span className={`font-bold ${isDark ? "text-fear" : "text-[#c4234e]"}`}>{t("company")}</span>
        <Link href="/about" className={`no-underline transition-colors ${isDark ? "text-vhs-light hover:text-fearyellow" : "text-[#6b6560] hover:text-[#c4234e]"}`}>
          {t("aboutUs")}
        </Link>
        <Link href="/contact" className={`no-underline transition-colors ${isDark ? "text-vhs-light hover:text-fearyellow" : "text-[#6b6560] hover:text-[#c4234e]"}`}>
          {t("contact")}
        </Link>
      </nav>
    </footer>
  );
}
