"use client";

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode, type Dispatch, type SetStateAction,
} from "react";
import { PLAYLIST, type Track } from "@/lib/store-data";

interface PlayerContextValue {
  navCollapsed:      boolean;
  setNavCollapsed:   Dispatch<SetStateAction<boolean>>;
  activeCategory:    string | null;
  setActiveCategory: Dispatch<SetStateAction<string | null>>;
  likedItems:        Set<number>;
  toggleLike:        (id: number) => void;
  isPlaying:         boolean;
  setIsPlaying:      Dispatch<SetStateAction<boolean>>;
  currentTrack:      number;
  setCurrentTrack:   Dispatch<SetStateAction<number>>;
  progress:          number;
  setProgress:       Dispatch<SetStateAction<number>>;
  volume:            number;
  setVolume:         Dispatch<SetStateAction<number>>;
  shuffle:           boolean;
  setShuffle:        Dispatch<SetStateAction<boolean>>;
  repeat:            boolean;
  setRepeat:         Dispatch<SetStateAction<boolean>>;
  showQueue:         boolean;
  setShowQueue:      Dispatch<SetStateAction<boolean>>;
  track:             Track;
  playTrack:         (idx: number) => void;
  nextTrack:         () => void;
  prevTrack:         () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [navCollapsed, setNavCollapsed]     = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [likedItems, setLikedItems]         = useState<Set<number>>(new Set());

  const [isPlaying, setIsPlaying]       = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [progress, setProgress]         = useState(0);
  const [volume, setVolume]             = useState(75);
  const [shuffle, setShuffle]           = useState(false);
  const [repeat, setRepeat]             = useState(false);
  const [showQueue, setShowQueue]       = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= PLAYLIST[currentTrack].duration) {
          setCurrentTrack((c) => (c + 1) % PLAYLIST.length);
          return 0;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isPlaying, currentTrack]);

  const toggleLike = useCallback((id: number) => {
    setLikedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const playTrack = useCallback((idx: number) => {
    setCurrentTrack(idx % PLAYLIST.length);
    setProgress(0);
    setIsPlaying(true);
  }, []);

  const nextTrack = useCallback(() => {
    setCurrentTrack((c) => (c + 1) % PLAYLIST.length);
    setProgress(0);
  }, []);

  const prevTrack = useCallback(() => {
    setCurrentTrack((c) => (c - 1 + PLAYLIST.length) % PLAYLIST.length);
    setProgress(0);
  }, []);

  // Auto-collapse on mobile
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    if (mq.matches) setNavCollapsed(true);
    const handler = (e: MediaQueryListEvent) => setNavCollapsed(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        navCollapsed, setNavCollapsed, activeCategory, setActiveCategory,
        likedItems, toggleLike,
        isPlaying, setIsPlaying, currentTrack, setCurrentTrack,
        progress, setProgress, volume, setVolume,
        shuffle, setShuffle, repeat, setRepeat, showQueue, setShowQueue,
        track: PLAYLIST[currentTrack], playTrack, nextTrack, prevTrack,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
}
