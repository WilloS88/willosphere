"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "use-intl";
import {
  Music,
  Music2,
  Compass,
  Heart,
  Play,
  ArrowBigDown,
  ArrowRight,
  Upload,
  TrendingUp,
  Users,
  Mic2,
} from "lucide-react";
import PageShell from "@/app/components/layout/PageShell";
import { Navbar } from "@/app/components/layout/Navbar";
import { Footer } from "@/app/components/layout/Footer";
import { useTheme } from "@/lib/hooks";
import {
  SectionLabel,
  Badge,
} from "@/app/components/ui/elastic-slider/StoreUI";
import Dither from "@/app/components/ui/react-bits/dither/Dither";
import TextType from "@/app/components/ui/react-bits/text-type/TextType";
import SplitText from "@/app/components/ui/react-bits/split-text/SplitText";
import TiltedCard from "@/app/components/ui/react-bits/TiltedCard";
import ElectricBorder from "@/app/components/ui/react-bits/electric-border/ElectricBorder";
import { ALBUMS, CATEGORIES } from "@/lib/store-data";
import api from "@/lib/axios";
import { formatCompact } from "@/lib/format-number";

/* ── Landing data types ── */
interface LandingStats {
  totalArtists:   number;
  totalTracks:    number;
  totalListeners: number;
  totalPlays:     number;
}

interface SpotlightArtist {
  userId:          number;
  displayName:     string;
  profileImageUrl: string | null;
  trackCount:      number;
}

interface TrackArtistInfo {
  artistId:        number;
  displayName:     string;
  profileImageUrl: string | null;
  role:            string;
}

interface TrackGenreInfo {
  id:   number;
  name: string;
}

interface LandingTrack {
  id:              number;
  title:           string;
  durationSeconds: number;
  audioUrl:        string;
  coverImageUrl:   string | null;
  artists:         TrackArtistInfo[];
  genres:          TrackGenreInfo[];
  createdAt:       string;
}

interface LandingGenre {
  id:         number;
  name:       string;
  trackCount: number;
}

interface LandingData {
  stats:            LandingStats;
  spotlightArtists: SpotlightArtist[];
  trendingTracks:   LandingTrack[];
  genres:           LandingGenre[];
}

/* ── Animated equalizer bars ── */
function Equalizer({ bars = 24, isDark }: { bars?: number; isDark: boolean }) {
  const [barHeights, setBarHeights] = useState<number[]>([]);
  const [isClient, setIsClient]     = useState(false);

  useEffect(() => {
    setIsClient(true);
    const heights = Array.from({ length: bars }).map(
      (_, i) => 20 + Math.sin(i * 0.6) * 50 + Math.cos(i * 0.3) * 30,
    );
    setBarHeights(heights);
  }, [bars]);

  if (!isClient) {
    return (
      <div className="flex h-12 items-end gap-[3px] sm:h-16">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className="w-[3px] rounded-t-full sm:w-1"
            style={{
              height: "50%",
              background: isDark
                ? `linear-gradient(to top, #ed2c5e, #f4e526)`
                : `linear-gradient(to top, #c4234e, #c4a800)`,
              opacity: 0.4 + (i % 3) * 0.2,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-12 items-end gap-[3px] sm:h-16">
      {barHeights.map((height, i) => (
        <div
          key={i}
          className="w-[3px] rounded-t-full sm:w-1"
          style={{
            height: `${height}%`,
            background: isDark
              ? `linear-gradient(to top, #ed2c5e, #f4e526)`
              : `linear-gradient(to top, #c4234e, #c4a800)`,
            opacity: 0.4 + (i % 3) * 0.2,
            animation: `equalize ${0.4 + (i % 5) * 0.15}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated counter ── */
function AnimCounter({
  target,
  suffix = "",
}: {
  target:   string;
  suffix?:  string;
}) {
  const [val, setVal] = useState("0");
  useEffect(() => {
    const num   = parseFloat(target.replace(/[^0-9.]/g, ""));
    const pre   = target.replace(/[0-9.,+]+/, "");
    const post  = target.match(/[+KM]$/)?.[0] || "";
    const steps = 30;
    let i       = 0;

    const iv = setInterval(() => {
      i++;
      const progress  = i / steps;
      const eased     = 1 - Math.pow(1 - progress, 3);
      const current   = (num * eased).toFixed(num % 1 === 0 ? 0 : 1);

      setVal(
        pre + current.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + post + suffix,
      );

      if(i >= steps)
        clearInterval(iv);

    }, 40);
    return () => clearInterval(iv);
  }, [target, suffix]);

  return <>{val}</>;
}

/* ── Genre card ── */
function GenreCard({
  genre,
  color,
  trackCount,
}: {
  genre:      string;
  color:      string;
  trackCount: number;
}) {
  const { locale } = useParams<{ locale: string }>();

  return (
    <Link
      href={`/${locale}/home`}
      className={`group relative overflow-hidden rounded-lg border p-4 no-underline transition-all hover:-translate-y-1 hover:shadow-lg sm:p-5`}
      style={{ borderColor: "transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color + "44")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
    >
      {/* VHS-style hover overlay */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(180deg, ${color}08 0%, ${color}18 100%)`,
        }}
      />

      <div className="relative z-10">
        <div
          className="mb-2 text-2xl opacity-60 sm:text-3xl"
          style={{ color: color }}
        >
          <Music2 size={32} strokeWidth={1.5} />
        </div>
        <div className={`text-xs font-bold tracking-[2px] sm:text-sm`}>
          {genre}
        </div>
        <div className={`mt-1 text-[11px] tracking-wider`}>
          {trackCount} TRACKS
        </div>
      </div>
    </Link>
  );
}

/* ── Landing page content ── */
/* ── Color palette for cards ── */
const CARD_COLORS = ["#00e5ff", "#9b59ff", "#ed2c5e", "#f4e526", "#00ff88", "#ed2c5e"];

/* ── Fallback static data ── */
const FALLBACK_ARTISTS = [
  { userId: 0, displayName: "AESTHETIC_VOX",   profileImageUrl: null, trackCount: 47 },
  { userId: 0, displayName: "SYNTH_WIZARD",    profileImageUrl: null, trackCount: 32 },
  { userId: 0, displayName: "GHOST_DATA",      profileImageUrl: null, trackCount: 41 },
  { userId: 0, displayName: "MACINTOSH_PLUS_X", profileImageUrl: null, trackCount: 15 },
];

function LandingContent() {
  const t           = useTranslations("Landing");
  const { locale }  = useParams<{ locale: string }>();
  const { isDark }  = useTheme();

  const [landing, setLanding] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/landing")
      .then((res) => setLanding(res.data))
      .catch(() => setLanding(null))
      .finally(() => setLoading(false));
  }, []);

  const trendingTracks   = landing?.trendingTracks   ?? [];
  const spotlightArtists = landing?.spotlightArtists ?? FALLBACK_ARTISTS;
  const featuredAlbums   = ALBUMS.slice(0, 6);

  return (
    <>
      <style>{`@keyframes equalize { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }`}</style>

      <Navbar />
      <section className="relative h-[94dvh] min-h-[600px] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Dither
            waveColor={isDark ? [1, 1, 0.7] : [0.85, 0.25, 0.35]}
            disableAnimation={false}
            enableMouseInteraction={true}
            mouseRadius={0.12}
            colorNum={4}
            waveAmplitude={0.5}
            waveFrequency={3}
            waveSpeed={0.015}
            pixelSize={2}
          />
        </div>

        <div
          className={`absolute inset-0 z-[1] ${isDark ? "from-darkblue/40 to-darkblue/90 bg-gradient-to-b via-transparent" : "bg-gradient-to-b from-white/30 via-transparent to-[#f0ebe3]/90"}`}
        />

        {/* Content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 sm:px-8">
          {/* Main title — SplitText animation */}
          <div
            className={`mb-4 rounded-lg px-4 py-3 sm:px-10 sm:py-6 text-center ${isDark ? "bg-black/85" : "bg-white/80 backdrop-blur-sm"}`}
          >
            <SplitText
              text={t("title")}
              className={`vhs-glitch-text text-[2.75rem] font-bold tracking-[5px] sm:text-7xl sm:tracking-[6px] lg:text-8xl ${isDark ? "text-fear" : "text-[#c4234e]"}`}
              delay={80}
              duration={0.8}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 60 }}
              to={{ opacity: 1, y: 0 }}
            />
          </div>

          {/* Typing welcome */}
          <div
            className={`mb-3 rounded px-5 py-2.5 text-sm font-bold tracking-[3px] sm:text-lg ${
              isDark
                ? "text-fearyellow bg-black/70"
                : "bg-white/80 text-[#c4a800]"
            }`}
          >
            <TextType
              text={t("welcome")}
              typingSpeed={50}
              loop={false}
              showCursor
              cursorCharacter="█"
              cursorBlinkDuration={0.5}
            />
          </div>

          {/* Equalizer */}
          <div className="mb-8 rounded bg-black p-4 opacity-70">
            <Equalizer bars={32} isDark={isDark} />
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:gap-3">
            <Link
              href={`/${locale}/home`}
              className={`rounded-sm px-6 py-3 sm:px-8 sm:py-3.5 text-sm font-bold tracking-[2px] no-underline transition-all hover:scale-105 active:scale-95 ${
                isDark
                  ? "bg-fear text-white shadow-[0_0_30px_rgba(237,44,94,0.5)]"
                  : "bg-[#c4234e] text-white shadow-[0_0_20px_rgba(196,35,78,0.35)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Play size={16} fill="currentColor" />
                {t("startListening")}
              </div>
            </Link>
            <Link
              href={`/${locale}/signup`}
              className={`rounded-sm border px-6 py-3 sm:px-8 sm:py-3.5 text-sm font-bold tracking-[2px] no-underline transition-all hover:scale-105 ${
                isDark
                  ? "border-fearyellow/50 text-fearyellow bg-black/30"
                  : "border-[#c4a800]/50 bg-black/60 text-[#c4a800]"
              }`}
            >
              {t("signUpFree")}
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
          <div
            className={`flex flex-col items-center gap-1 text-xs sm:text-base tracking-[3px] ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
          >
            {t("scrollDown")}
            <ArrowBigDown size={20} className="sm:!w-6 sm:!h-6" fill="currentColor" />
          </div>
        </div>
      </section>

      <section
        className={`overflow-hidden px-4 py-16 sm:px-6 sm:py-24 ${isDark ? "bg-vhs-surface/60" : "bg-[#ede7db]/60"}`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <SectionLabel className="mb-2 text-lg">
                {t("featuredLabel")}
              </SectionLabel>
              <h2
                className={`text-2xl font-bold tracking-[3px] sm:text-4xl ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
              >
                {t("nowTrending")}
              </h2>
              <p
                className={`mt-2 text-xs leading-relaxed tracking-wide ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
              >
                {t("featuredDesc")}
              </p>
            </div>
            <Link
              href={`/${locale}/home`}
              className={`hidden rounded-sm border px-4 py-2 text-xs font-bold tracking-[2px] no-underline transition-all sm:inline-block ${
                isDark
                  ? "border-fear/40 text-fear hover:bg-fear/10"
                  : "border-[#c4234e]/30 text-[#c4234e] hover:bg-[#c4234e]/5"
              }`}
            >
              <div className="flex items-center gap-2">
                {t("listenNow")}
                <ArrowRight size={16} />
              </div>
            </Link>
          </div>

          {/* Horizontal scrolling track/album cards */}
          <div className="scrollbar-hide vhs-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto py-4 sm:gap-6">
            {loading ? (
              /* Skeleton placeholders */
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[200px] shrink-0 snap-start sm:w-[240px]">
                  <div
                    className={`overflow-hidden rounded-lg border ${
                      isDark ? "bg-vhs-card/40 border-royalblue/10" : "border-[#a89888]/20 bg-[#d5cfc5]/30"
                    }`}
                  >
                    <div className={`h-[200px] animate-pulse ${isDark ? "bg-royalblue/10" : "bg-[#c5bfb3]/30"}`} />
                    <div className="mt-2 space-y-2 px-3 pb-3">
                      <div className={`h-3 w-3/4 animate-pulse rounded ${isDark ? "bg-royalblue/15" : "bg-[#c5bfb3]/40"}`} />
                      <div className={`h-2.5 w-1/2 animate-pulse rounded ${isDark ? "bg-royalblue/10" : "bg-[#c5bfb3]/30"}`} />
                    </div>
                  </div>
                </div>
              ))
            ) : trendingTracks.length > 0 ? (
              /* Real tracks from DB */
              trendingTracks.map((track, i) => {
                const color       = CARD_COLORS[i % CARD_COLORS.length];
                const artistName  = track.artists[0]?.displayName ?? "Unknown";
                const year        = new Date(track.createdAt).getFullYear();

                return (
                  <div
                    key={track.id}
                    className="w-[200px] shrink-0 snap-start sm:w-[240px]"
                  >
                    <div
                      className={`overflow-hidden rounded-lg border transition-all hover:-translate-y-1 ${
                        isDark
                          ? "bg-vhs-card border-royalblue/20 hover:border-fear/30"
                          : "border-[#a89888]/30 bg-white/80 hover:border-[#c4234e]/20"
                      }`}
                    >
                      <TiltedCard
                        containerHeight="200px"
                        containerWidth="100%"
                        imageHeight="180px"
                        imageWidth="180px"
                        rotateAmplitude={8}
                        scaleOnHover={1.04}
                        showMobileWarning={false}
                        showTooltip={true}
                        captionText={artistName}
                        imageSrc={
                          track.coverImageUrl
                            ? track.coverImageUrl
                            : `data:image/svg+xml,${encodeURIComponent(
                                `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
                                  <defs>
                                    <linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1">
                                      <stop offset="0%" stop-color="${color}" stop-opacity="0.7"/>
                                      <stop offset="60%" stop-color="#253078" stop-opacity="0.8"/>
                                      <stop offset="100%" stop-color="#0b0f2d"/>
                                    </linearGradient>
                                  </defs>
                                  <rect width="300" height="300" fill="url(#g${i})" rx="8"/>
                                  <circle cx="150" cy="120" r="45" fill="none" stroke="${color}" stroke-opacity="0.4" stroke-width="1"/>
                                  <circle cx="150" cy="120" r="25" fill="none" stroke="${color}" stroke-opacity="0.25" stroke-width="0.5"/>
                                  <circle cx="150" cy="120" r="8" fill="${color}" fill-opacity="0.3"/>
                                  <text x="150" y="200" text-anchor="middle" fill="white" font-size="12" font-family="monospace" opacity="0.9">
                                    ${track.title.slice(0, 18)}
                                  </text>
                                  <text x="150" y="220" text-anchor="middle" fill="${color}" font-size="9" font-family="monospace" opacity="0.6">
                                    ${artistName}
                                  </text>
                                  <text x="150" y="245" text-anchor="middle" fill="white" font-size="8" font-family="monospace" opacity="0.3">
                                    ${year}
                                  </text>
                                </svg>`,
                              )}`
                        }
                        altText={track.title}
                      />
                      <div className="mt-2 px-3 pb-3">
                        <div className="flex items-center justify-between">
                          <span
                            className={`truncate text-xs font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                          >
                            {track.title}
                          </span>
                          {i < 2 && (
                            <Badge
                              variant="fear"
                              className="ml-1 shrink-0 text-[10px]"
                            >
                              {t("newRelease")}
                            </Badge>
                          )}
                        </div>
                        <div
                          className={`text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
                        >
                          {artistName}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Fallback to static albums */
              featuredAlbums.map((album, i) => (
                <div
                  key={album.id}
                  className="w-[200px] shrink-0 snap-start sm:w-[240px]"
                >
                  <div
                    className={`overflow-hidden rounded-lg border transition-all hover:-translate-y-1 ${
                      isDark
                        ? "bg-vhs-card border-royalblue/20 hover:border-fear/30"
                        : "border-[#a89888]/30 bg-white/80 hover:border-[#c4234e]/20"
                    }`}
                  >
                    <TiltedCard
                      containerHeight="200px"
                      containerWidth="100%"
                      imageHeight="180px"
                      imageWidth="180px"
                      rotateAmplitude={8}
                      scaleOnHover={1.04}
                      showMobileWarning={false}
                      showTooltip={true}
                      captionText={album.artist}
                      imageSrc={`data:image/svg+xml,${encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
                          <defs>
                            <linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stop-color="${album.color}" stop-opacity="0.7"/>
                              <stop offset="60%" stop-color="#253078" stop-opacity="0.8"/>
                              <stop offset="100%" stop-color="#0b0f2d"/>
                            </linearGradient>
                          </defs>
                          <rect width="300" height="300" fill="url(#g${i})" rx="8"/>
                          <circle cx="150" cy="120" r="45" fill="none" stroke="${album.color}" stroke-opacity="0.4" stroke-width="1"/>
                          <circle cx="150" cy="120" r="25" fill="none" stroke="${album.color}" stroke-opacity="0.25" stroke-width="0.5"/>
                          <circle cx="150" cy="120" r="8" fill="${album.color}" fill-opacity="0.3"/>
                          <text x="150" y="200" text-anchor="middle" fill="white" font-size="12" font-family="monospace" opacity="0.9">
                            ${album.title.slice(0, 18)}
                          </text>
                          <text x="150" y="220" text-anchor="middle" fill="${album.color}" font-size="9" font-family="monospace" opacity="0.6">
                            ${album.artist}
                          </text>
                          <text x="150" y="245" text-anchor="middle" fill="white" font-size="8" font-family="monospace" opacity="0.3">
                            ${album.year}
                          </text>
                        </svg>`,
                      )}`}
                      altText={album.title}
                    />
                    <div className="mt-2 px-3 pb-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`truncate text-xs font-bold tracking-wider ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                        >
                          {album.title}
                        </span>
                        {i < 2 && (
                          <Badge
                            variant="fear"
                            className="ml-1 shrink-0 text-[10px]"
                          >
                            {t("newRelease")}
                          </Badge>
                        )}
                      </div>
                      <div
                        className={`text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
                      >
                        {album.artist}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — VALUE PROPS (with ElectricBorder)
      ═══════════════════════════════════════════ */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {[
              {
                icon: Music,
                title: t("streamTitle"),
                desc: t("streamDesc"),
                color: "#ed2c5e",
              },
              {
                icon: Compass,
                title: t("discoverTitle"),
                desc: t("discoverDesc"),
                color: "#00e5ff",
              },
              {
                icon: Heart,
                title: t("supportTitle"),
                desc: t("supportDesc"),
                color: "#f4e526",
              },
            ].map((card, i) => {
              const IconComponent = card.icon;
              return (
                <ElectricBorder
                  key={i}
                  color={card.color}
                  speed={0.8}
                  chaos={0.1}
                  borderRadius={12}
                >
                  <div
                    className={`h-full rounded-xl p-6 sm:p-8 ${isDark ? "bg-darkblue" : "bg-[#f0ebe3]"}`}
                  >
                    <div className="mb-4" style={{ color: card.color }}>
                      <IconComponent size={40} strokeWidth={1.5} />
                    </div>
                    <h3
                      className={`mb-3 text-base font-semibold tracking-[2px] sm:text-lg ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                    >
                      {card.title}
                    </h3>
                    <p
                      className={`text-xs leading-relaxed tracking-wide sm:text-sm ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
                    >
                      {card.desc}
                    </p>
                  </div>
                </ElectricBorder>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4 — GENRE EXPLORATION
      ═══════════════════════════════════════════ */}
      <section
        className={`px-4 py-16 sm:px-6 sm:py-24 ${isDark ? "bg-vhs-surface/40" : "bg-[#ede7db]/40"}`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <SectionLabel className="mb-2 text-lg">
              {t("genresLabel")}
            </SectionLabel>
            <h2
              className={`text-2xl font-bold tracking-[3px] sm:text-3xl ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
            >
              {t("genresLabel")}
            </h2>
            <p
              className={`mt-2 text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
            >
              {t("genresDesc")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-4 sm:p-5 ${
                    isDark ? "bg-vhs-card/40 border-royalblue/10" : "border-[#a89888]/20 bg-[#d5cfc5]/30"
                  }`}
                >
                  <div className={`mb-2 h-8 w-8 animate-pulse rounded ${isDark ? "bg-royalblue/10" : "bg-[#c5bfb3]/30"}`} />
                  <div className={`h-3 w-2/3 animate-pulse rounded ${isDark ? "bg-royalblue/15" : "bg-[#c5bfb3]/40"}`} />
                  <div className={`mt-1.5 h-2.5 w-1/3 animate-pulse rounded ${isDark ? "bg-royalblue/10" : "bg-[#c5bfb3]/30"}`} />
                </div>
              ))
            ) : (landing?.genres ?? []).length > 0 ? (
              landing!.genres.map((genre, i) => {
                const colors = ["#ed2c5e", "#00e5ff", "#9b59ff", "#f4e526", "#00ff88", "#ed2c5e", "#9b59ff", "#00e5ff"];
                const c = colors[i % colors.length];
                return (
                  <GenreCard key={genre.id} genre={genre.name} color={c} trackCount={genre.trackCount} />
                );
              })
            ) : (
              CATEGORIES.map((genre, i) => {
                const colors = ["#ed2c5e", "#00e5ff", "#9b59ff", "#f4e526", "#00ff88", "#ed2c5e", "#9b59ff", "#00e5ff"];
                const c = colors[i % colors.length];
                return (
                  <GenreCard key={genre} genre={genre} color={c} trackCount={0} />
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5 — PLATFORM STATS
      ═══════════════════════════════════════════ */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <SectionLabel className="mb-2 text-lg">
              {t("statsLabel")}
            </SectionLabel>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              {
                label: t("statsArtists"),
                value: landing ? formatCompact(landing.stats.totalArtists) : t("statsArtistsValue"),
                desc: t("statsArtistsDesc"),
                color: "text-fear",
              },
              {
                label: t("statsTracks"),
                value: landing ? formatCompact(landing.stats.totalTracks) : t("statsTracksValue"),
                desc: t("statsTracksDesc"),
                color: "text-vhs-cyan",
              },
              {
                label: t("statsListeners"),
                value: landing ? formatCompact(landing.stats.totalListeners) : t("statsListenersValue"),
                desc: t("statsListenersDesc"),
                color: "text-vhs-purple",
              },
              {
                label: t("statsPlays"),
                value: landing ? formatCompact(landing.stats.totalPlays) : t("statsPlaysValue"),
                desc: t("statsPlaysDesc"),
                color: "text-vhs-green",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-lg border p-5 text-center transition-all hover:scale-[1.02] sm:p-6 ${
                  isDark
                    ? "bg-vhs-card/60 border-royalblue/20"
                    : "border-[#a89888]/20 bg-white/60"
                }`}
              >
                <div
                  className={`mb-2 text-xs tracking-[3px] ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
                >
                  {stat.label}
                </div>
                <div className={`text-2xl font-extrabold sm:text-3xl ${stat.color}`}>
                  {loading ? (
                    <div className={`mx-auto h-8 w-16 animate-pulse rounded ${isDark ? "bg-royalblue/15" : "bg-[#c5bfb3]/40"}`} />
                  ) : (
                    <AnimCounter target={stat.value} />
                  )}
                </div>
                <div
                  className={`mt-2 text-xs leading-relaxed tracking-wide ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
                >
                  {stat.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6 — BECOME AN ARTIST
      ═══════════════════════════════════════════ */}
      <section
        className={`px-4 py-16 sm:px-6 sm:py-24 ${isDark ? "bg-vhs-surface/60" : "bg-[#ede7db]/60"}`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <SectionLabel className="mb-2 text-lg">
              {t("becomeArtistLabel")}
            </SectionLabel>
            <h2
              className={`text-2xl font-bold tracking-[3px] sm:text-4xl ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
            >
              {t("becomeArtistTitle")}
            </h2>
            <p
              className={`mx-auto mt-2 mb-5 max-w-xl text-base leading-relaxed tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
            >
              {t("becomeArtistDesc")}
            </p>
          </div>

          {/* Benefits grid */}
          <div className="mb-10 grid gap-5 sm:grid-cols-3 sm:gap-6">
            {[
              {
                icon: Upload,
                title: t("becomeArtistBenefit1Title"),
                desc: t("becomeArtistBenefit1Desc"),
                color: "#ed2c5e",
              },
              {
                icon: TrendingUp,
                title: t("becomeArtistBenefit2Title"),
                desc: t("becomeArtistBenefit2Desc"),
                color: "#f4e526",
              },
              {
                icon: Users,
                title: t("becomeArtistBenefit3Title"),
                desc: t("becomeArtistBenefit3Desc"),
                color: "#00e5ff",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={`rounded-lg border p-6 transition-all hover:-translate-y-0.5 ${
                    isDark
                      ? "bg-vhs-card border-royalblue/20 hover:border-royalblue/40"
                      : "border-[#a89888]/30 bg-white/80 hover:border-[#a89888]/60"
                  }`}
                >
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg"
                    style={{
                      background: `${item.color}18`,
                      color: item.color,
                    }}
                  >
                    <Icon size={22} strokeWidth={1.75} />
                  </div>
                  <h3
                    className={`mb-2 text-sm font-bold tracking-[2px] sm:text-xs ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed tracking-wide ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
                  >
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div
            className={`flex w-full flex-col items-center gap-6 self-stretch rounded-xl border p-8 text-center justify-between sm:flex-row sm:text-left ${
              isDark
                ? "bg-darkblue/80 border-fear/20"
                : "border-[#c4234e]/15 bg-white/90"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded p-4 ${
                  isDark
                    ? "bg-fear/15 text-fear"
                    : "bg-[#c4234e]/10 text-[#c4234e]"
                }`}
              >
                <Mic2 size={26} strokeWidth={1.5} />
              </div>
              <div>
                <div
                  className={`text-sm font-bold tracking-[2px] ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                >
                  {t("becomeArtistNote")}
                </div>
                <div
                  className={`mt-0.5 text-[11px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
                >
                  {t("becomeArtistAlreadyArtist")}{" "}
                  <Link
                    href={`/${locale}/login`}
                    className={`underline ${isDark ? "text-vhs-cyan hover:text-fearyellow" : "text-[#c4234e]"}`}
                  >
                    {t("becomeArtistLogin")}
                  </Link>
                </div>
              </div>
            </div>

            <Link
              href={`/${locale}/signup-artist`}
              className={`shrink-0 rounded-sm px-8 py-3.5 text-sm font-bold tracking-[2px] no-underline transition-all hover:scale-105 active:scale-95 sm:ml-auto ${
                isDark
                  ? "bg-fear text-white shadow-[0_0_30px_rgba(237,44,94,0.4)]"
                  : "bg-[#c4234e] text-white shadow-[0_0_20px_rgba(196,35,78,0.3)]"
              }`}
            >
              {t("becomeArtistCta")}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7 — ARTIST SPOTLIGHT (TiltedCards)
      ═══════════════════════════════════════════ */}
      <section
        className={`px-4 py-16 sm:px-6 sm:py-24 ${isDark ? "bg-vhs-surface/40" : "bg-[#ede7db]/40"}`}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <SectionLabel className="mb-2 text-lg">
              {t("artistsLabel")}
            </SectionLabel>
            <h2
              className={`text-2xl font-bold tracking-[3px] sm:text-3xl ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
            >
              {t("artistsLabel")}
            </h2>
            <p
              className={`mt-2 text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
            >
              {t("artistsDesc")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {loading ? (
              /* Skeleton placeholders */
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-4 text-center ${
                    isDark ? "bg-vhs-card/40 border-royalblue/10" : "border-[#a89888]/20 bg-[#d5cfc5]/30"
                  }`}
                >
                  <div className={`mx-auto h-[100px] w-[100px] animate-pulse rounded-full ${isDark ? "bg-royalblue/10" : "bg-[#c5bfb3]/30"}`} />
                  <div className={`mx-auto mt-2 h-3 w-2/3 animate-pulse rounded ${isDark ? "bg-royalblue/15" : "bg-[#c5bfb3]/40"}`} />
                  <div className={`mx-auto mt-1.5 h-2.5 w-1/3 animate-pulse rounded ${isDark ? "bg-royalblue/10" : "bg-[#c5bfb3]/30"}`} />
                </div>
              ))
            ) : (
              spotlightArtists.map((artist, i) => {
                const color = CARD_COLORS[i % CARD_COLORS.length];
                return (
                  <div
                    key={artist.userId || artist.displayName}
                    className={`rounded-lg border p-4 text-center transition-all hover:-translate-y-1 ${
                      isDark
                        ? "bg-vhs-card border-royalblue/20 hover:border-royalblue/40"
                        : "border-[#a89888]/30 bg-white/80 hover:border-[#a89888]/50"
                    }`}
                  >
                    <TiltedCard
                      containerHeight="120px"
                      containerWidth="100%"
                      imageHeight="100px"
                      imageWidth="100px"
                      rotateAmplitude={14}
                      scaleOnHover={1.08}
                      showMobileWarning={false}
                      showTooltip={false}
                      imageSrc={
                        artist.profileImageUrl
                          ? artist.profileImageUrl
                          : `data:image/svg+xml,${encodeURIComponent(
                              `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
                                <defs><radialGradient id="a${i}"><stop offset="0%" stop-color="${color}" stop-opacity="0.5"/><stop offset="100%" stop-color="#0b0f2d"/></radialGradient></defs>
                                <rect width="200" height="200" fill="url(#a${i})" rx="100"/>
                              </svg>`,
                            )}`
                      }
                      altText={artist.displayName}
                    />
                    <div
                      className={`mt-1 text-xs font-bold tracking-[2px] sm:text-sm ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                    >
                      {artist.displayName}
                    </div>
                    <div
                      className={`text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
                    >
                      {artist.trackCount} TRACKS
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 8 — FINAL CTA
      ═══════════════════════════════════════════ */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <ElectricBorder
            color={isDark ? "#ed2c5e" : "#c4234e"}
            speed={0.6}
            chaos={0.08}
            borderRadius={16}
          >
            <div
              className={`rounded-2xl p-8 sm:p-14 ${isDark ? "bg-darkblue" : "bg-[#f0ebe3]"}`}
            >
              <div className="mb-4 flex justify-center text-4xl sm:text-5xl">
                <Play fill="#ffffff" />
              </div>
              <h2
                className={`mb-4 text-2xl font-extrabold tracking-[3px] sm:text-3xl ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
              >
                {t("ctaTitle")}
              </h2>
              <p
                className={`mx-auto mb-8 max-w-md text-xs leading-relaxed tracking-wide sm:text-sm ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
              >
                {t("ctaDesc")}
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href={`/${locale}/signup`}
                  className={`rounded-sm px-8 py-3.5 text-sm font-bold tracking-[2px] no-underline transition-all hover:scale-105 ${
                    isDark
                      ? "bg-fear text-white shadow-[0_0_25px_rgba(237,44,94,0.4)]"
                      : "bg-[#c4234e] text-white shadow-[0_0_20px_rgba(196,35,78,0.3)]"
                  }`}
                >
                  {t("ctaButton")}
                </Link>
                <Link
                  href={`/${locale}/home`}
                  className={`rounded-sm border px-8 py-3.5 text-sm font-bold tracking-[2px] no-underline transition-all hover:scale-105 ${
                    isDark
                      ? "border-royalblue/40 text-vhs-light hover:border-fear/40"
                      : "border-[#a89888] text-[#524a44] hover:border-[#c4234e]/30"
                  }`}
                >
                  {t("ctaSecondary")}
                </Link>
              </div>
            </div>
          </ElectricBorder>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default function RootPage() {
  return (
    <PageShell>
      <LandingContent />
    </PageShell>
  );
}
