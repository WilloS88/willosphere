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
  ShoppingCart,
  Mic2,
} from "lucide-react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useTheme } from "@/lib/hooks";
import LocaleSwitcher from "@/app/components/locale/LocaleSwitcher";
import { hasRole } from "@/lib/auth";
import { GlitchText } from "@/app/components/ui/elastic-slider/StoreUI";
import { useAppSelector } from "@/lib/hooks";
import { SearchBar } from "@/app/components/layout/HomeTopBar";

export function Navbar() {
  const t                   = useTranslations("Navbar");
  const { locale }          = useParams<{ locale: string }>();
  const { session, logout } = useAuth();
  const { isDark, toggle }  = useTheme();
  const isAdmin             = hasRole(session?.user, "admin");
  const isArtist            = hasRole(session?.user, "artist");
  const cartCount           = useAppSelector((s) => s.cart.items.reduce((n, i) => n + i.quantity, 0));

  const linkClass = `text-xs tracking-wider px-3 py-1.5 rounded-sm transition-all no-underline border ${
    isDark
      ? "border-royalblue/30 text-vhs-light hover:text-fearyellow hover:border-fear/40 hover:bg-fear/10"
      : "border-[#a89888]/40 text-[#524a44] hover:text-[#c4234e] hover:border-[#c4234e]/30 hover:bg-[#c4234e]/5"
  }`;

  return (
    <header
      className={`relative z-50 flex items-center justify-between border-b px-4 py-3 sm:px-6 ${
        isDark
          ? "bg-darkblue border-royalblue/40"
          : "border-[#a89888]/40 bg-[#ede7db]"
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
      {session && <SearchBar />}

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

        {/* Cart link */}
        {session && (
          <Link href={`/${locale}/home/cart`} className={`${linkClass} relative`}>
            <span className="flex items-center gap-1.5">
              <ShoppingCart size={14} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-fear text-[11px] font-bold text-white leading-none">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </span>
          </Link>
        )}

        {/* Artist link */}
        {isArtist && (
          <Link href={`/${locale}/artist`} className={linkClass}>
            <span className="flex items-center gap-1.5">
              <Mic2 size={14} />
              <span className="hidden sm:inline">{t("artistDashboard")}</span>
            </span>
          </Link>
        )}

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
              : "border-[#a89888] bg-white/60 text-[#635b53] hover:text-[#c4234e]"
          }`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <LocaleSwitcher />
      </div>
    </header>
  );
}
