"use client";

import { useState, useRef, useEffect } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useTheme } from "@/lib/hooks";
import LocaleSwitcher from "@/app/components/locale/LocaleSwitcher";
import { hasRole } from "@/lib/auth";
import { GlitchText } from "@/app/components/ui/elastic-slider/StoreUI";
import { useAppSelector } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export function Navbar() {
  const t                   = useTranslations("Navbar");
  const { locale }          = useParams<{ locale: string }>();
  const { session, logout } = useAuth();
  const { isDark, toggle }  = useTheme();
  const isAdmin             = hasRole(session?.user, "admin");
  const isArtist            = hasRole(session?.user, "artist");
  const cartCount           = useAppSelector((s) => s.cart.items.reduce((n, i) => n + i.quantity, 0));

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const linkClass = `text-xs tracking-wider px-3 py-1.5 rounded-sm transition-all no-underline border ${
    isDark
      ? "border-royalblue/30 text-vhs-light hover:text-fearyellow hover:border-fear/40 hover:bg-fear/10"
      : "border-[#a89888]/40 text-[#524a44] hover:text-[#c4234e] hover:border-[#c4234e]/30 hover:bg-[#c4234e]/5"
  }`;

  const mobileItemClass = cn(
    "flex w-full items-center gap-2.5 px-4 py-2.5 text-xs tracking-wider transition-colors no-underline font-vcr",
    isDark
      ? "text-vhs-light hover:bg-royalblue/15 hover:text-vhs-white"
      : "text-[#524a44] hover:bg-[#c4234e]/5 hover:text-[#2a2520]",
  );

  return (
    <header
      className={`relative z-50 flex items-center justify-between border-b px-3 sm:px-6 py-2.5 sm:py-3 ${
        isDark
          ? "bg-darkblue border-royalblue/40"
          : "border-[#a89888]/40 bg-[#ede7db]"
      }`}
    >
      {/* Logo */}
      <Link href={`/${locale}`} className="w-8 h-8 sm:w-11 sm:h-8 bg-fear flex items-center justify-center font-bold text-sm sm:text-base text-white vhs-logo-clip">
        <img src="/favicon.ico" alt="WilloSphere" className="w-8 h-8 sm:w-10 sm:h-8 object-contain" />
      </Link>

      {/* Desktop nav links */}
      <div className="hidden sm:flex items-center gap-2 sm:gap-3">
        {session && (
          <Link href={`/${locale}/home`} className={linkClass}>
            <span className="flex items-center gap-1.5">
              <Headphones size={14} />
              <span className="hidden sm:inline">{t("application")}</span>
            </span>
          </Link>
        )}

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

        {isArtist && (
          <Link href={`/${locale}/home/artist`} className={linkClass}>
            <span className="flex items-center gap-1.5">
              <Mic2 size={14} />
              <span className="hidden sm:inline">{t("artistDashboard")}</span>
            </span>
          </Link>
        )}

        {isAdmin && (
          <Link href={`/${locale}/admin`} className={linkClass}>
            <span className="flex items-center gap-1.5">
              <Shield size={14} />
              <span className="hidden sm:inline">{t("adminDashboard")}</span>
            </span>
          </Link>
        )}

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

        <button
          onClick={toggle}
          className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border text-sm transition-all hover:scale-105 ${
            isDark
              ? "border-royalblue/40 bg-royalblue/20 text-vhs-muted hover:text-fearyellow"
              : "border-[#a89888] bg-white/60 text-[#635b53] hover:text-[#c4234e]"
          }`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <LocaleSwitcher />
      </div>

      {/* Mobile: theme + locale + hamburger */}
      <div ref={menuRef} className="flex sm:hidden items-center gap-1.5">
        <button
          onClick={toggle}
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border text-sm transition-all ${
            isDark
              ? "border-royalblue/40 bg-royalblue/20 text-vhs-muted hover:text-fearyellow"
              : "border-[#a89888] bg-white/60 text-[#635b53] hover:text-[#c4234e]"
          }`}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <LocaleSwitcher />

        <button
          aria-label="Menu"
          onClick={() => setMenuOpen((p) => !p)}
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border text-sm transition-all ${
            isDark
              ? "border-royalblue/40 bg-royalblue/20 text-vhs-muted hover:text-vhs-white"
              : "border-[#a89888] bg-white/60 text-[#635b53] hover:text-[#2a2520]"
          }`}
        >
          {menuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className={cn(
            "absolute right-3 top-full mt-1 min-w-[180px] rounded-sm border overflow-hidden animate-slide-up z-[300]",
            isDark
              ? "bg-vhs-surface border-royalblue/30 shadow-[0_4px_20px_rgba(11,15,45,0.8)]"
              : "border-[#a89888]/40 bg-[#f5f0e8] shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
          )}>
            {session && (
              <Link href={`/${locale}/home`} className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                <Headphones size={14} /> {t("application")}
              </Link>
            )}

            {session && (
              <Link href={`/${locale}/home/cart`} className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                <ShoppingCart size={14} /> {t("cart")}
                {cartCount > 0 && (
                  <span className="ml-auto bg-fear text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {isArtist && (
              <Link href={`/${locale}/home/artist`} className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                <Mic2 size={14} /> {t("artistDashboard")}
              </Link>
            )}

            {isAdmin && (
              <Link href={`/${locale}/admin`} className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                <Shield size={14} /> {t("adminDashboard")}
              </Link>
            )}

            <div className={`border-t ${isDark ? "border-royalblue/20" : "border-[#a89888]/20"}`} />

            {session ? (
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className={cn(mobileItemClass, "w-full border-none cursor-pointer", isDark ? "text-fear/80 hover:text-fear" : "text-[#c4234e]/70 hover:text-[#c4234e]")}
              >
                <LogOut size={14} /> {t("logout")}
              </button>
            ) : (
              <>
                <Link href={`/${locale}/login`} className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                  <LogIn size={14} /> {t("login")}
                </Link>
                <Link href={`/${locale}/signup`} className={mobileItemClass} onClick={() => setMenuOpen(false)}>
                  <UserPlus size={14} /> {t("signup")}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
