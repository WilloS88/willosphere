"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sun, Moon, ChevronDown, User, Shield, LogOut, Mic2, Search, HandCoins, Music, Disc3, Users } from "lucide-react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useTheme, useDebounce } from "@/lib/hooks";
import LocaleSwitcher from "@/app/components/locale/LocaleSwitcher";
import { GlitchText } from "@/app/components/ui/elastic-slider/StoreUI";
import { hasRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useOptionalPlayer } from "@/app/context/PlayerContext";
import api from "@/lib/axios";
import type { SearchResultDto } from "@/app/types/search";

export function SearchBar() {
  const t                         = useTranslations("Store");
  const { isDark }                = useTheme();
  const { locale }                = useParams<{ locale: string }>();
  const router                    = useRouter();
  const player                    = useOptionalPlayer();
  const [text, setText]           = useState("");
  const [open, setOpen]           = useState(false);
  const [results, setResults]     = useState<SearchResultDto | null>(null);
  const [loading, setLoading]     = useState(false);
  const debouncedText             = useDebounce(text, 300);
  const wrapperRef                = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open)
      return;

    const controller = new AbortController();
    setLoading(true);

    const params = debouncedText.trim() ? `?q=${encodeURIComponent(debouncedText.trim())}` : "";
    api.get<SearchResultDto>(`/search${params}`, { signal: controller.signal })
      .then(({ data }) => setResults(data))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedText, open]);


  useEffect(() => {
    if(!open)
      return;

    const handler = (e: MouseEvent) => {
      if(wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Escape
  useEffect(() => {
    if(!open)
      return;

    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); } };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const close = () => { setOpen(false); setText(""); };

  const hasResults = results && (results.tracks.length > 0 || results.artists.length > 0 || results.albums.length > 0);

  const sectionHeadingCls = cn(
    "px-3 py-2 text-xs font-bold tracking-[2px]",
    isDark ? "text-vhs-cyan/70" : "text-[#c4234e]/70",
  );

  const itemCls = cn(
    "flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors",
    isDark ? "hover:bg-royalblue/20" : "hover:bg-[#c4234e]/5",
  );

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-[400px] mx-auto">
      {/* Input */}
      <div className={`h-[30px] flex items-center rounded-sm px-2.5 transition-all border ${
        open
          ? (isDark ? "bg-royalblue/50 border-vhs-cyan" : "bg-white border-[#c4234e]/40")
          : (isDark ? "bg-royalblue/25 border-royalblue" : "bg-[#ede7db] border-[#a89888]")
      }`}>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={`${t("searchPlaceholder")} . . .`}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="search-results-dropdown"
          className={`bg-transparent border-none outline-none text-xs font-vcr w-full tracking-wider ${
            isDark ? "text-vhs-white placeholder:text-vhs-muted" : "text-[#2a2520] placeholder:text-[#635b53]"
          }`}
        />
        {loading ? (
          <span className={`inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent ${isDark ? "text-vhs-cyan" : "text-[#c4234e]"}`} />
        ) : (
          <Search size={13} className={isDark ? "text-vhs-muted" : "text-[#635b53]"} />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div id="search-results-dropdown" className={cn(
          "absolute left-1/2 -translate-x-1/2 top-full z-[300] mt-1 w-[550px] max-sm:w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto rounded-sm border animate-slide-up",
          isDark
            ? "bg-vhs-surface border-royalblue/30 shadow-[0_4px_20px_rgba(11,15,45,0.8)]"
            : "border-[#a89888]/40 bg-[#f5f0e8] shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
        )}>
          {!hasResults && !loading && (
            <div className={`px-3 py-4 text-center text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
              {debouncedText.trim() ? t("searchNoResults") : t("searchSuggestions")}
            </div>
          )}

          {results && results.artists.length > 0 && (
            <div>
              <div className={sectionHeadingCls}>
                <Users size={10} className="inline mr-1.5 -mt-0.5" />
                {t("searchArtists")}
              </div>
              {results.artists.map((artist) => (
                <button
                  key={artist.userId}
                  type="button"
                  className={`${itemCls} w-full text-left`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { router.push(`/${locale}/home/artists/${artist.userId}`); close(); }}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden shrink-0",
                    isDark ? "bg-royalblue/30 text-vhs-cyan" : "bg-[#c4234e]/10 text-[#c4234e]",
                  )}>
                    {artist.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={artist.profileImageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      artist.displayName[0]?.toUpperCase()
                    )}
                  </div>
                  <span className={`text-xs tracking-wider truncate ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
                    {artist.displayName}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results && results.tracks.length > 0 && (
            <div>
              <div className={sectionHeadingCls}>
                <Music size={10} className="inline mr-1.5 -mt-0.5" />
                {t("searchTracks")}
              </div>
              {results.tracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  className={`${itemCls} w-full text-left`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={async () => {
                    close();
                    try {
                      const { data: full } = await api.get<import("@/app/types/track").TrackDto>(`/tracks/${track.id}`);
                      player?.playTrack(full, [full], "search");
                    } catch {}
                  }}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-sm flex items-center justify-center overflow-hidden shrink-0",
                    isDark ? "bg-royalblue/30" : "bg-[#c4234e]/10",
                  )}>
                    {track.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={track.coverImageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Music size={12} className={isDark ? "text-vhs-muted" : "text-[#635b53]"} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs tracking-wider truncate ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
                      {track.title}
                    </div>
                    <div className={`text-xs tracking-wider truncate ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
                      {track.artists.map((a) => a.displayName).join(", ")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results && results.albums.length > 0 && (
            <div>
              <div className={sectionHeadingCls}>
                <Disc3 size={10} className="inline mr-1.5 -mt-0.5" />
                {t("searchAlbums")}
              </div>
              {results.albums.map((album) => (
                <button
                  key={album.id}
                  type="button"
                  className={`${itemCls} w-full text-left`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { router.push(`/${locale}/home/albums/${album.id}`); close(); }}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-sm flex items-center justify-center overflow-hidden shrink-0",
                    isDark ? "bg-royalblue/30" : "bg-[#c4234e]/10",
                  )}>
                    {album.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={album.coverImageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Disc3 size={12} className={isDark ? "text-vhs-muted" : "text-[#635b53]"} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs tracking-wider truncate ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
                      {album.title}
                    </div>
                    <div className={`text-xs tracking-wider truncate ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
                      {album.artists.map((a) => a.displayName).join(", ")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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

  const { isDark } = useTheme();

  return <span className={`hidden lg:inline text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>{time}</span>;
}

function ThemeToggle() {
  const t                         = useTranslations("Store");
  const { theme, toggle, isDark } = useTheme();

  return (
    <button
      onClick={toggle}
      title={isDark ? t("lightMode") : t("darkMode")}
      className={`w-8 h-8 rounded-sm flex items-center justify-center text-sm border cursor-pointer transition-all hover:scale-105 ${
        isDark
          ? "border-royalblue/40 bg-royalblue/20 text-vhs-muted hover:border-fearyellow hover:text-fearyellow"
          : "border-[#a89888] bg-white/60 text-[#635b53] hover:border-[#c4234e] hover:text-[#c4234e]"
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
  const { isDark }          = useTheme();
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
    isDark ? "text-vhs-light hover:bg-royalblue/15 hover:text-vhs-white" : "text-[#524a44] hover:bg-[#c4234e]/5 hover:text-[#2a2520]",
  );

  return (
    <div ref={ref} className="relative inline-block">
      {/* Trigger */}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-sm border px-2 h-8 transition-all",
          isDark
            ? "border-royalblue/40 bg-royalblue/20 hover:border-fear/40 hover:bg-fear/10"
            : "border-[#a89888] bg-white/60 hover:border-[#c4234e]/40",
        )}
      >
        <div className="from-fear to-vhs-purple flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white">
          {name[0]?.toUpperCase() ?? "U"}
        </div>
        <ChevronDown
          size={12}
          className={cn(
            "transition-transform duration-200",
            open && "rotate-180",
            isDark ? "text-vhs-muted" : "text-[#635b53]",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div role="menu" className={cn(
          "absolute right-0 top-full z-[300] mt-1.5 min-w-[170px] overflow-hidden rounded-sm border animate-slide-up",
          isDark
            ? "bg-vhs-surface border-royalblue/30 shadow-[0_4px_20px_rgba(11,15,45,0.8)]"
            : "border-[#a89888]/40 bg-[#f5f0e8] shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
        )}>
          {/* User info */}
          <div className={`border-b px-3 py-2.5 ${isDark ? "border-royalblue/20" : "border-[#a89888]/20"}`}>
            <div className={`text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>{tStore("user")}</div>
            <div className={`truncate text-xs font-bold tracking-wider ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}>{name}</div>
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

          <div className={`border-t ${isDark ? "border-royalblue/20" : "border-[#a89888]/20"}`} />

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
  const { isDark }  = useTheme();

  return (
    <header className={`h-11 min-h-[44px] flex items-center px-2 sm:px-4 gap-1.5 sm:gap-3 z-50 border-b ${
      isDark
        ? "bg-gradient-to-r from-darkblue via-royalblue/50 to-darkblue border-royalblue/50"
        : "bg-gradient-to-r from-[#ede7db] via-[#e5dfd3] to-[#ede7db] border-[#a89888]/50"
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
        <Link
          href={`/${locale}/home/donate`}
          title={t("nav_donate")}
          className={`w-8 h-8 rounded-sm flex items-center justify-center text-sm border transition-all hover:scale-105 no-underline ${
            isDark
              ? "border-royalblue/40 bg-royalblue/20 text-fear hover:border-fear hover:text-fearyellow"
              : "border-[#a89888] bg-white/60 text-[#c4234e] hover:border-[#c4234e] hover:text-[#c4234e]"
          }`}
        >
          <HandCoins size={14} />
        </Link>
        <ThemeToggle />
        <LocaleSwitcher />
        <ProfileDropdown />
      </div>
    </header>
  );
}
