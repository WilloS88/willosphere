"use client";

import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
  type ReactNode, type Dispatch, type SetStateAction,
} from "react";
import type { TrackDto } from "@/app/types/track";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/app/api/enpoints";

interface PlayerContextValue {
  navCollapsed:      boolean;
  setNavCollapsed:   Dispatch<SetStateAction<boolean>>;
  activeCategory:    string | null;
  setActiveCategory: Dispatch<SetStateAction<string | null>>;
  likedItems:        Set<number>;
  toggleLike:        (id: number) => void;
  isPlaying:         boolean;
  setIsPlaying:      Dispatch<SetStateAction<boolean>>;
  track:             TrackDto | null;
  progress:          number;
  duration:          number;
  volume:            number;
  setVolume:         Dispatch<SetStateAction<number>>;
  shuffle:           boolean;
  setShuffle:        Dispatch<SetStateAction<boolean>>;
  repeat:            boolean;
  setRepeat:         Dispatch<SetStateAction<boolean>>;
  showQueue:         boolean;
  setShowQueue:      Dispatch<SetStateAction<boolean>>;
  queue:             TrackDto[];
  playTrack:         (track: TrackDto, queue?: TrackDto[]) => void;
  nextTrack:         () => void;
  prevTrack:         () => void;
  seekTo:            (seconds: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [navCollapsed, setNavCollapsed]     = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [likedItems, setLikedItems]         = useState<Set<number>>(new Set());

  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack]         = useState<TrackDto | null>(null);
  const [progress, setProgress]   = useState(0);
  const [duration, setDuration]   = useState(0);
  const [volume, setVolume]       = useState(75);
  const [shuffle, setShuffle]     = useState(false);
  const [repeat, setRepeat]       = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [queue, setQueue]         = useState<TrackDto[]>([]);

  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const queueRef     = useRef<TrackDto[]>([]);
  const queueIdxRef  = useRef<number>(-1);
  const repeatRef    = useRef(repeat);

  // Listen history tracking: stores track ID that was already logged in current playback session
  const loggedTrackRef = useRef<number | null>(null);

  // Keep refs in sync
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);

  // Record listen history when threshold is reached
  const recordListen = useCallback((trackId: number, secondsPlayed: number) => {
    api.post(API_ENDPOINTS.listenHistory.record, { trackId, secondsPlayed }).catch(() => {
      // Silently ignore — listen history is non-critical
    });
  }, []);

  // Init audio element (client-only)
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      const currentTime = Math.floor(audio.currentTime);
      setProgress(currentTime);

      // Listen history threshold check
      const dur = audio.duration;
      if (dur > 0 && loggedTrackRef.current === null) {
        const trackObj = queueRef.current[queueIdxRef.current];
        if (trackObj) {
          // Threshold: 75% of track, but at least 30s and cap at 240s for long tracks
          const threshold = Math.min(dur * 0.75, 240);
          if (currentTime >= threshold && currentTime >= 30) {
            loggedTrackRef.current = trackObj.id;
            recordListen(trackObj.id, currentTime);
          }
        }
      }
    };
    audio.ondurationchange = () => setDuration(Math.floor(audio.duration) || 0);
    audio.onended          = () => {
      if(repeatRef.current) {
        loggedTrackRef.current = null;
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      const q   = queueRef.current;
      const idx = queueIdxRef.current;

      if(q.length > 0 && idx < q.length - 1) {
        loggedTrackRef.current = null;
        const next = q[idx + 1];
        queueIdxRef.current = idx + 1;
        setTrack(next);
        setProgress(0);
        audio.src = next.audioUrl;
        void audio.play();
      } else {
        setIsPlaying(false);
        setProgress(0);
      }
    };

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Sync isPlaying → audio
  useEffect(() => {
    const audio = audioRef.current;
    if(!audio || !audio.src)
      return;

    if(isPlaying) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Sync volume → audio
  useEffect(() => {
    if(audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const playTrack = useCallback((newTrack: TrackDto, newQueue?: TrackDto[]) => {
    const q   = newQueue ?? [newTrack];
    const idx = q.findIndex((t) => t.id === newTrack.id);



    loggedTrackRef.current = null;
    queueRef.current    = q;
    queueIdxRef.current = idx >= 0 ? idx : 0;
    setQueue(q);
    setTrack(newTrack);
    setProgress(0);
    setIsPlaying(true);

    const audio = audioRef.current;
    if(audio) {
      audio.src = newTrack.audioUrl;
      void audio.play();
    }
  }, []);

  const nextTrack = useCallback(() => {
    const q   = queueRef.current;
    const idx = queueIdxRef.current;

    if(q.length === 0)
      return;

    const next          = (idx + 1) % q.length;
    const nextTrackItem = q[next];

    if(!nextTrackItem)
      return;

    loggedTrackRef.current = null;
    queueIdxRef.current = next;
    setTrack(nextTrackItem);
    setProgress(0);
    const audio = audioRef.current;

    if(audio) {
      audio.src = nextTrackItem.audioUrl;
      void audio.play();
    }
  }, []);

  const prevTrack = useCallback(() => {
    const audio = audioRef.current;
    // If more than 3s played, restart current track
    if(audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setProgress(0);
      return;
    }
    const q   = queueRef.current;
    const idx = queueIdxRef.current;

    if(q.length === 0)
      return;

    const prev          = (idx - 1 + q.length) % q.length;
    const prevTrackItem = q[prev];

    if (!prevTrackItem)
      return;

    loggedTrackRef.current = null;
    queueIdxRef.current = prev;
    setTrack(prevTrackItem);
    setProgress(0);

    if(audio) {
      audio.src = prevTrackItem.audioUrl;
      void audio.play();
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if(audio) {
      audio.currentTime = seconds;
    }
    setProgress(seconds);
  }, []);

  const toggleLike = useCallback((id: number) => {
    setLikedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
        isPlaying, setIsPlaying,
        track, progress, duration, volume, setVolume,
        shuffle, setShuffle, repeat, setRepeat,
        showQueue, setShowQueue,
        queue, playTrack, nextTrack, prevTrack, seekTo,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if(!ctx)
    throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
}
