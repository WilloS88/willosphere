"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sun, Moon, ChevronDown, User, Shield, LogOut, Mic2, Search } from "lucide-react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import LocaleSwitcher from "@/app/components/locale/LocaleSwitcher";
import { GlitchText } from "@/app/components/ui/elastic-slider/StoreUI";
import { hasRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

function SearchBar() {
  const t                       = useTranslations("Store");
  const [focused, setFocused]   = useState(false);
  const [text, setText]         = useState("");
  const { isDark }              = useStoreTheme();

  return (
    <div className={`flex-1 max-w-[400px] h-[30px] flex items-center rounded-sm px-2.5 ml-2 sm:ml-5 transition-all border ${
      focused
        ? (isDark ? "bg-royalblue/50 border-vhs-cyan" : "bg-white border-[#c4234e]/40")
        : (isDark ? "bg-royalblue/25 border-royalblue" : "bg-[#ede7db] border-[#c4b8a8]")
    }`}>
      <input value={text} onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={`${t("searchPlaceholder")} . . .`}
        className={`bg-transparent border-none outline-none text-[11px] font-vcr w-full tracking-wider ${
          isDark ? "text-vhs-white placeholder:text-vhs-muted" : "text-[#2a2520] placeholder:text-[#8a8578]"
        }`}
      />
      <Search size={13} className={isDark ? "text-vhs-muted" : "text-[#8a8578]"} />
    </div>
  );
}

function LiveIndicator() {
  const t = useTranslations("Store");
  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-fear animate-blink" />
      <span className="text-fear text-xs tracking-wider">{t("live")}</span>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const { isDark } = useStoreTheme();

  return <span className={`hidden lg:inline text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>{time}</span>;
}

function ThemeToggle() {
  const t                         = useTranslations("Store");
  const { theme, toggle, isDark } = useStoreTheme();

  return (
    <button
      onClick={toggle}
      title={isDark ? t("lightMode") : t("darkMode")}
      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center text-sm border cursor-pointer transition-all hover:scale-105 ${
        isDark
          ? "border-royalblue/40 bg-royalblue/20 text-vhs-muted hover:border-fearyellow hover:text-fearyellow"
          : "border-[#c4b8a8] bg-white/60 text-[#8a8578] hover:border-[#c4234e] hover:text-[#c4234e]"
      }`}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}

function ProfileDropdown() {
  const t                   = useTranslations("Navbar");
  const tStore              = useTranslations("Store");
  const { locale }          = useParams<{ locale: string }>();
  const { session, logout } = useAuth();
  const { isDark }          = useStoreTheme();
  const [open, setOpen]     = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);
  const name                = session?.user.displayName ?? "GUEST";
  const isAdmin             = hasRole(session?.user, "admin");
  const isArtist            = hasRole(session?.user, "artist");

  useEffect(() => {
    if (!open)
      return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if(!open)
      return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const itemCls = cn(
    "font-vcr flex w-full items-center gap-2.5 px-3 h-8 text-left text-xs tracking-wider transition-colors no-underline",
    isDark ? "text-vhs-light hover:bg-royalblue/15 hover:text-vhs-white" : "text-[#6b6560] hover:bg-[#c4234e]/5 hover:text-[#2a2520]",
  );

  return (
    <div ref={ref} className="relative inline-block">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-sm border px-2 h-8 transition-all",
          isDark
            ? "border-royalblue/40 bg-royalblue/20 hover:border-fear/40 hover:bg-fear/10"
            : "border-[#c4b8a8] bg-white/60 hover:border-[#c4234e]/40",
        )}
      >
        <div className="from-fear to-vhs-purple flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white">
          {name[0]?.toUpperCase() ?? "U"}
        </div>
        <ChevronDown
          size={12}
          className={cn(
            "transition-transform duration-200",
            open && "rotate-180",
            isDark ? "text-vhs-muted" : "text-[#8a8578]",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={cn(
          "absolute right-0 top-full z-[300] mt-1.5 min-w-[170px] overflow-hidden rounded-sm border animate-slide-up",
          isDark
            ? "bg-vhs-surface border-royalblue/30 shadow-[0_4px_20px_rgba(11,15,45,0.8)]"
            : "border-[#c4b8a8]/40 bg-[#f5f0e8] shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
        )}>
          {/* User info */}
          <div className={`border-b px-3 py-2.5 ${isDark ? "border-royalblue/20" : "border-[#c4b8a8]/20"}`}>
            <div className={`text-[11px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}>{tStore("user")}</div>
            <div className={`truncate text-[11px] font-bold tracking-wider ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}>{name}</div>
          </div>

          {/* Profile */}
          <Link href={`/${locale}/home/profile`} onClick={() => setOpen(false)} className={itemCls}>
            <User size={13} />
            {tStore("nav_profile")}
          </Link>

          {/* Artist */}
          {isArtist && (
            <Link href={`/${locale}/artist`} onClick={() => setOpen(false)} className={itemCls}>
              <Mic2 size={13} />
              {t("artistDashboard")}
            </Link>
          )}

          {/* Admin */}
          {isAdmin && (
            <Link href={`/${locale}/admin`} onClick={() => setOpen(false)} className={itemCls}>
              <Shield size={13} />
              {t("adminDashboard")}
            </Link>
          )}

          <div className={`border-t ${isDark ? "border-royalblue/20" : "border-[#c4b8a8]/20"}`} />

          {/* Logout */}
          <button
            type="button"
            onClick={() => { logout(); setOpen(false); }}
            className={cn(
              "font-vcr flex w-full cursor-pointer items-center gap-2.5 border-none px-3 py-2.5 text-left text-xs tracking-wider transition-colors",
              isDark ? "text-fear/80 hover:bg-fear/10 hover:text-fear" : "text-[#c4234e]/70 hover:bg-[#c4234e]/5 hover:text-[#c4234e]",
            )}
          >
            <LogOut size={13} />
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}

export function HomeTopBar() {
  const t           = useTranslations("Store");
  const { locale }  = useParams<{ locale: string }>();
  const { isDark }  = useStoreTheme();

  return (
    <header className={`h-11 min-h-[44px] flex items-center px-2 sm:px-4 gap-1.5 sm:gap-3 z-50 border-b ${
      isDark
        ? "bg-gradient-to-r from-darkblue via-royalblue/50 to-darkblue border-royalblue/50"
        : "bg-gradient-to-r from-[#ede7db] via-[#e5dfd3] to-[#ede7db] border-[#c4b8a8]/50"
    }`}>
      {/* Logo */}
      <Link href={`/${locale}`} className="flex items-center gap-1.5 sm:gap-2 shrink-0 no-underline">
        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-fear flex items-center justify-center font-bold text-sm sm:text-base text-white vhs-logo-clip">W</div>
        <GlitchText className={`font-bold text-sm sm:text-base tracking-[2px] hidden xs:inline ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}>
          {t("waveStore")}
        </GlitchText>
      </Link>

      <SearchBar />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">
        <LiveIndicator />
        <Clock />
        <ThemeToggle />
        <LocaleSwitcher />
        <ProfileDropdown />
      </div>
    </header>
  );
}
