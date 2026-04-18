"use client";

import { useState, useRef, useEffect } from "react";
import { Music, Shuffle, SkipBack, SkipForward, Play, Pause, Repeat, AlignJustify, Volume2, VolumeX } from "lucide-react";
import { usePlayer } from "@/app/context/PlayerContext";
import { useTheme } from "@/lib/hooks";
import { SectionLabel, ProgressSlider } from "@/app/components/ui/elastic-slider/StoreUI";
import StoreElasticSlider from "@/app/components/ui/elastic-slider/StoreElasticSlider";
import { formatTime } from "@/lib/store-data";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { TrackDto } from "@/app/types/track";
import { ShareButton } from "@/app/components/home/ShareButton";

/* ── Track info (left) ── */
function TrackInfo() {
  const { track }  = usePlayer();
  const { isDark } = useTheme();

  const title  = track?.title ?? "—";
  const artist = track?.artists.map((a) => a.displayName).join(", ") ?? "";

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-[45%] sm:w-auto overflow-hidden">
      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-sm flex items-center justify-center border shrink-0 overflow-hidden ${
        isDark ? "bg-gradient-to-br from-royalblue to-fear/25 border-royalblue" : "bg-gradient-to-br from-[#c4234e]/20 to-[#c4a800]/10 border-[#a89888]"
      }`}>
        {track?.coverImageUrl
          ? <img src={track.coverImageUrl} alt={title} className="h-full w-full object-cover" />
          : <Music size={18} />}
      </div>
      <div className="min-w-0">
        <div className={`text-xs sm:text-sm font-bold tracking-wider truncate ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}>
          <span className={isDark ? "text-fearyellow" : "text-[#c4234e]"}>{title}</span>
        </div>
        <div className={`text-[11px] sm:text-xs tracking-wider truncate ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>{artist}</div>
      </div>
    </div>
  );
}

/* ── Mobile progress bar (thin, full-width) ── */
function MobileProgressBar() {
  const { progress, duration, seekTo } = usePlayer();
  const { isDark } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const newVal = Math.max(0, Math.min(duration, Math.floor(((e.clientX - rect.left) / rect.width) * duration)));
    seekTo(newVal);
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={cn("w-full h-1 cursor-pointer shrink-0", isDark ? "bg-royalblue/40" : "bg-[#a89888]/30")}
    >
      <div
        className="h-full bg-gradient-to-r from-fear to-fearyellow transition-[width] duration-200"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── Playback controls (center) ── */
function PlaybackControls() {
  const { isPlaying, setIsPlaying, shuffle, setShuffle, repeat, setRepeat, progress, duration, seekTo, nextTrack, prevTrack } = usePlayer();
  const { isDark } = useTheme();

  const TimeLeft = () => (
    <span className={`text-xs tracking-wider min-w-[28px] text-right tabular-nums ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
      {formatTime(progress)}
    </span>
  );
  const TimeRight = () => (
    <span className={`text-xs tracking-wider min-w-[28px] tabular-nums ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
      {formatTime(duration)}
    </span>
  );

  const btnClass = (active?: boolean) => cn(
    "bg-transparent border-none cursor-pointer transition-colors text-sm flex items-center justify-center",
    // Desktop: large touch targets. Mobile: compact
    "p-1 sm:p-2 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px]",
    active
      ? (isDark ? "text-fearyellow" : "text-[#c4234e]")
      : (isDark ? "text-vhs-muted hover:text-vhs-light" : "text-[#635b53] hover:text-[#3a3430]")
  );

  return (
    <div className="shrink-0 sm:shrink flex flex-col items-center gap-0.5 min-w-0">
      {/* Transport buttons */}
      <div className="flex items-center gap-1 sm:gap-3">
        <button aria-label="Shuffle" className={cn(btnClass(shuffle), "hidden sm:flex")} onClick={() => setShuffle(!shuffle)}><Shuffle size={16} /></button>
        <button aria-label="Previous track" className={cn(btnClass())} onClick={prevTrack}><SkipBack size={16} /></button>
        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-9 h-9 sm:w-9 sm:h-9 rounded-full border-2 cursor-pointer flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 ${
            isDark
              ? "bg-gradient-to-br from-fear to-fear/80 border-white/20 shadow-[0_0_15px_rgba(237,44,94,0.25)]"
              : "bg-gradient-to-br from-[#c4234e] to-[#a01d40] border-[#c4234e]/30 shadow-[0_0_12px_rgba(196,35,78,0.2)]"
          }`}
        >{isPlaying ? <Pause size={16} /> : <Play size={16} />}</button>
        <button aria-label="Next track" className={cn(btnClass())} onClick={nextTrack}><SkipForward size={16} /></button>
        <button aria-label="Repeat" className={cn(btnClass(repeat), "hidden sm:flex")} onClick={() => setRepeat(!repeat)}><Repeat size={16} /></button>
      </div>

      {/* Desktop progress slider */}
      <div className="hidden sm:block w-full max-w-[460px]" aria-label="Track progress" role="group">
        <StoreElasticSlider
          defaultValue={progress}
          startingValue={0}
          maxValue={duration || 1}
          onChange={(v: number) => seekTo(v)}
          leftIcon={<TimeLeft />}
          rightIcon={<TimeRight />}
          showValue={false}
          trackColor={isDark ? "var(--color-fear)" : "#c4234e"}
          trackBg={isDark ? "rgba(37,48,120,0.5)" : "rgba(180,170,155,0.4)"}
        />
      </div>
    </div>
  );
}

/* ── Volume popup (mobile) ── */
function MobileVolumeButton() {
  const { volume, setVolume } = usePlayer();
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const VolumeIcon = volume === 0 ? VolumeX : Volume2;

  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        aria-label="Volume"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "bg-transparent border-none cursor-pointer p-1 min-h-[36px] min-w-[36px] text-sm transition-colors flex items-center justify-center",
          isDark ? "text-vhs-muted" : "text-[#635b53]",
        )}
      >
        <VolumeIcon size={16} />
      </button>

      {/* Volume popup */}
      {open && (
        <div className={cn(
          "absolute bottom-full right-0 mb-2 p-3 rounded-sm border z-[300] w-[140px]",
          isDark
            ? "bg-vhs-surface border-royalblue/30 shadow-[0_-4px_16px_rgba(11,15,45,0.8)]"
            : "bg-[#f5f0e8] border-[#a89888]/40 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]",
        )}>
          <ProgressSlider
            value={volume}
            max={100}
            onChange={(v) => setVolume(v)}
            showThumb
            height="md"
            colorClass={isDark ? "bg-vhs-light" : "bg-[#635b53]"}
          />
        </div>
      )}
    </div>
  );
}

/* ── Volume (right) ── */
function VolumeControl() {
  const { volume, setVolume, showQueue, setShowQueue, track } = usePlayer();
  const { isDark } = useTheme();

  return (
    <div className="flex items-center gap-1 sm:gap-4 min-w-0 shrink-0 ml-auto sm:ml-0 sm:justify-self-end">
      {/* Desktop volume slider */}
      <div className="hidden sm:block w-[140px]">
        <StoreElasticSlider
          defaultValue={volume}
          startingValue={0}
          maxValue={100}
          onChange={(v: number) => setVolume(v)}
          showValue={false}
          trackColor={isDark ? "var(--color-vhs-light)" : "#635b53"}
          trackBg={isDark ? "rgba(37,48,120,0.5)" : "rgba(180,170,155,0.4)"}
        />
      </div>

      {/* Mobile volume button with popup */}
      <MobileVolumeButton />

      {track && (
        <span className="hidden sm:flex">
          <ShareButton track={track} size={16} />
        </span>
      )}

      <button
        aria-label="Queue"
        onClick={() => setShowQueue(!showQueue)}
        className={cn(
          "bg-transparent border-none cursor-pointer p-1 sm:p-2 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] text-sm transition-colors flex items-center justify-center",
          showQueue
            ? (isDark ? "text-fearyellow" : "text-[#c4234e]")
            : (isDark ? "text-vhs-muted" : "text-[#635b53]")
        )}
      >
        <AlignJustify size={18} />
      </button>
    </div>
  );
}

/* ── Queue track ── */
function QueueTrack({ track, index }: { track: TrackDto; index: number }) {
  const { track: currentTrack, isPlaying, playTrack, queue } = usePlayer();
  const { isDark }                                           = useTheme();
  const active = currentTrack?.id === track.id;

  return (
    <button
      onClick={() => playTrack(track, queue)}
      className={cn(
        "w-full flex items-center gap-2.5 px-2.5 py-2 mb-0.5 rounded-sm cursor-pointer text-left font-vcr border",
        active
          ? (isDark ? "bg-fear/15 border-fear/20" : "bg-[#c4234e]/10 border-[#c4234e]/20")
          : "bg-transparent border-transparent hover:bg-royalblue/10"
      )}
    >
      <span className={cn("text-xs min-w-[16px]", active ? "text-fear" : (isDark ? "text-vhs-muted" : "text-[#635b53]"), active && isPlaying && "animate-pulse-vhs")}>
        {active && isPlaying ? <Play size={10} /> : `${index + 1}.`}
      </span>
      <div className="flex-1 min-w-0">
        <div className={cn("text-xs tracking-wider truncate", active ? (isDark ? "text-fearyellow" : "text-[#c4234e]") : (isDark ? "text-vhs-white" : "text-[#2a2520]"))}>
          {track.title}
        </div>
        <div className={`text-[11px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
          {track.artists.map((a) => a.displayName).join(", ")}
        </div>
      </div>
      <span className={`text-[10px] ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
        {formatTime(track.durationSeconds)}
      </span>
    </button>
  );
}

/* ── Queue panel ── */
export function QueuePanel() {
  const t             = useTranslations("Store");
  const { showQueue, queue } = usePlayer();
  const { isDark }    = useTheme();

  if (!showQueue) return null;

  return (
    <div className={`absolute bottom-[72px] sm:bottom-[130px] right-0 w-[300px] max-sm:w-full border border-b-0 rounded-t p-4 z-[200] ${
      isDark ? "bg-vhs-surface border-royalblue/25 shadow-[0_-4px_20px_rgba(11,15,45,0.8)]" : "bg-[#f0ebe3] border-[#a89888]/40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
    }`}>
      <SectionLabel className="mb-3">{t("queue")} // {queue.length} {t("tracks")}</SectionLabel>
      {queue.length === 0
        ? <div className={`py-4 text-center text-xs tracking-widest ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>—</div>
        : queue.map((tr, i) => <QueueTrack key={`${tr.id}-${i}`} track={tr} index={i} />)
      }
    </div>
  );
}

/* ── Player bar ── */
export function PlayerBar() {
  const { isDark } = useTheme();

  return (
    <div
      className={cn(
        "flex flex-col z-50 border-t",
        isDark
          ? "from-vhs-surface to-darkblue border-royalblue/40 bg-gradient-to-b"
          : "border-[#a89888]/40 bg-gradient-to-b from-[#ede7db] to-[#e5dfd3]",
      )}
    >
      {/* Mobile: thin progress bar on top */}
      <div className="sm:hidden">
        <MobileProgressBar />
      </div>

      {/* Main controls row */}
      <div className={cn(
        "px-3 sm:px-8",
        "h-[68px] sm:h-[130px]",
        // Mobile: flex with fixed proportions
        "flex items-center gap-2",
        // Desktop: 3-column grid so sections never shift
        "sm:grid sm:grid-cols-[1fr_2fr_1fr] sm:gap-4",
      )}>
        <TrackInfo />
        <PlaybackControls />
        <VolumeControl />
      </div>
    </div>
  );
}
