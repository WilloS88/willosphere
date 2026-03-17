"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Shield,
  LogIn,
  LogOut,
  UserPlus,
  Headphones,
  Moon,
  Sun,
  Search,
} from "lucide-react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import LocaleSwitcher from "@/app/components/locale/LocaleSwitcher";
import { hasRole } from "@/lib/auth";
import { GlitchText } from "@/app/components/ui/elastic-slider/StoreUI";

export function Navbar() {
  const t                   = useTranslations("Navbar");
  const { locale }          = useParams<{ locale: string }>();
  const { session, logout } = useAuth();
  const { isDark, toggle }  = useStoreTheme();
  const isAdmin             = hasRole(session?.user, "admin");

  const linkClass = `text-[11px] tracking-wider px-3 py-1.5 rounded-sm transition-all no-underline border ${
    isDark
      ? "border-royalblue/30 text-vhs-light hover:text-fearyellow hover:border-fear/40 hover:bg-fear/10"
      : "border-[#c4b8a8]/40 text-[#6b6560] hover:text-[#c4234e] hover:border-[#c4234e]/30 hover:bg-[#c4234e]/5"
  }`;

  return (
    <header
      className={`relative z-50 flex items-center justify-between border-b px-4 py-3 sm:px-6 ${
        isDark
          ? "bg-darkblue border-royalblue/40"
          : "border-[#c4b8a8]/40 bg-[#ede7db]"
      }`}
    >
      {/* Logo */}
      <Link
        href={`/${locale}`}
        className="flex shrink-0 items-center gap-2 no-underline"
      >
        <div className="bg-fear vhs-logo-clip flex h-7 w-7 items-center justify-center text-base font-bold text-white">
          W
        </div>
        <GlitchText
          className={`hidden text-base font-bold tracking-[2px] sm:inline ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
        >
          {t("title").toUpperCase()}
        </GlitchText>
      </Link>

      {/* Center — search */}
      {session &&
        <div
          className={`mx-6 hidden h-[30px] max-w-[350px] flex-1 items-center rounded-sm border px-3 transition-all md:flex ${
            isDark
              ? "bg-royalblue/20 border-royalblue/40"
              : "border-[#c4b8a8] bg-[#ede7db]"
          }`}
        >
          <input
            type="text"
            placeholder={`${t("search")} . . .`}
            className={`font-vcr w-full border-none bg-transparent text-[11px] tracking-wider outline-none ${
              isDark
                ? "text-vhs-white placeholder:text-vhs-muted"
                : "text-[#2a2520] placeholder:text-[#8a8578]"
            }`}
          />
          <Search
            size={14}
            className={isDark ? "text-vhs-muted" : "text-[#8a8578]"}
          />
        </div>
      }

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Store link */}
        {session &&
          <Link href={`/${locale}/home`} className={linkClass}>
            <span className="flex items-center gap-1.5">
              <Headphones size={14} />
              <span className="hidden sm:inline">{t("application")}</span>
            </span>
          </Link>
        }

        {/* Admin link */}
        {isAdmin && (
          <Link href={`/${locale}/admin`} className={linkClass}>
            <span className="flex items-center gap-1.5">
              <Shield size={14} />
              <span className="hidden sm:inline">{t("adminDashboard")}</span>
            </span>
          </Link>
        )}

        {/* Auth actions */}
        {session ? (
          <button onClick={logout} className={`${linkClass} cursor-pointer`}>
            <span className="flex items-center gap-1.5">
              <LogOut size={14} />
              <span className="hidden sm:inline">{t("logout")}</span>
            </span>
          </button>
        ) : (
          <>
            <Link href={`/${locale}/login`} className={linkClass}>
              <span className="flex items-center gap-1.5">
                <LogIn size={14} />
                <span className="hidden sm:inline">{t("login")}</span>
              </span>
            </Link>
            <Link href={`/${locale}/signup`} className={linkClass}>
              <span className="flex items-center gap-1.5">
                <UserPlus size={14} />
                <span className="hidden sm:inline">{t("signup")}</span>
              </span>
            </Link>
          </>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm border text-sm transition-all hover:scale-105 ${
            isDark
              ? "border-royalblue/40 bg-royalblue/20 text-vhs-muted hover:text-fearyellow"
              : "border-[#c4b8a8] bg-white/60 text-[#8a8578] hover:text-[#c4234e]"
          }`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <LocaleSwitcher />
      </div>
    </header>
  );
}
