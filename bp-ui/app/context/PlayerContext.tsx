"use client";

import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
  type ReactNode, type Dispatch, type SetStateAction,
} from "react";
import type { TrackDto } from "@/app/types/track";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/app/api/enpoints";
import { store } from "@/lib/store";
import {
  setVolume as setReduxVolume,
  setCurrentTrack,
  setQueue as setReduxQueue,
  setQueueIdx,
  setPlayerShuffle,
  setPlayerRepeat,
  setProgress as setReduxProgress,
} from "@/lib/features/player/playerSlice";

export type PlaybackSource =
  | "search"
  | "artist_page"
  | "direct_link"
  | "user_playlist"
  | "browse"
  | "editorial"
  | "algorithm"
  | "radio";

interface PlayerContextValue {
  activeCategory:    string | null;
  setActiveCategory: Dispatch<SetStateAction<string | null>>;
  likedItems:        Set<number>;
  toggleLike:        (id: number, track?: TrackDto) => void;
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
  playTrack:         (track: TrackDto, queue?: TrackDto[], source?: PlaybackSource) => void;
  addToQueue:        (track: TrackDto) => void;
  nextTrack:         () => void;
  prevTrack:         () => void;
  seekTo:            (seconds: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

function getPersistedPlayer() {
  const s = store.getState().player;
  return s;
}

/** Extract primary artist ID from a TrackDto */
function getPrimaryArtistId(track: TrackDto): number | null {
  const primary = track.artists?.find((a) => a.role === "primary");
  return primary?.artistId ?? track.artists?.[0]?.artistId ?? null;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const persisted = getPersistedPlayer();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [likedItems, setLikedItems]         = useState<Set<number>>(new Set());

  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack]         = useState<TrackDto | null>(persisted.currentTrack);
  const [progress, setProgress]   = useState(persisted.progress);
  const [duration, setDuration]   = useState(0);
  const [volume, setVolume]       = useState(persisted.volume);
  const [shuffle, setShuffle]     = useState(persisted.shuffle);
  const [repeat, setRepeat]       = useState(persisted.repeat);
  const [showQueue, setShowQueue] = useState(false);
  const [queue, setQueue]         = useState<TrackDto[]>(persisted.queue);

  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const queueRef     = useRef<TrackDto[]>(persisted.queue);
  const queueIdxRef  = useRef<number>(persisted.queueIdx);
  const repeatRef    = useRef(repeat);
  const shuffleRef   = useRef(shuffle);

  // Listen history tracking: stores track ID that was already logged in current playback session
  const loggedTrackRef = useRef<number | null>(null);

  // Playback source tracking for EWUC algorithm
  const sourceRef = useRef<PlaybackSource>("browse");

  // Keep refs in sync
  useEffect(() => {
    queueRef.current = queue;
    repeatRef.current = repeat;
    shuffleRef.current = shuffle;
  }, [queue, repeat, shuffle]);

  // Sync local state → Redux
  useEffect(() => { store.dispatch(setReduxVolume(volume)); }, [volume]);
  useEffect(() => {
    store.dispatch(setCurrentTrack(track));
    store.dispatch(setReduxQueue(queue));
    store.dispatch(setPlayerShuffle(shuffle));
    store.dispatch(setPlayerRepeat(repeat));
  }, [track, queue, shuffle, repeat]);

  // Persist progress on pause or unmount
  useEffect(() => {
    if(!isPlaying) {
      store.dispatch(setReduxProgress(progress));
    }
  }, [isPlaying, progress]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        store.dispatch(setReduxProgress(Math.floor(audio.currentTime)));
      }
    };
  }, []);

  // Re-fetch persisted track/queue on mount to get fresh signed URLs
  useEffect(() => {
    const refreshTrack = async (t: TrackDto): Promise<TrackDto | null> => {
      try {
        const res = await api.get<TrackDto>(API_ENDPOINTS.tracks.detail(t.id));
        return res.data;
      } catch {
        return null;
      }
    };

    if (track?.id) {
      refreshTrack(track).then((fresh) => {
        if (fresh) setTrack(fresh);
      });
    }

    if (queue.length > 0) {
      Promise.all(queue.map((t) => refreshTrack(t))).then((results) => {
        const refreshed = results.map((r, i) => r ?? queue[i]);
        setQueue(refreshed);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate liked items from backend on mount
  useEffect(() => {
    api.get<{ trackIds: number[] }>(API_ENDPOINTS.engagementActions.likes)
      .then((res) => setLikedItems(new Set(res.data.trackIds)))
      .catch(() => {}); // ignore if not logged in
  }, []);

  // Record listen history + stream event when threshold is reached
  const recordListen = useCallback((trackId: number, secondsPlayed: number, trackDurationSec: number) => {
    api.post(API_ENDPOINTS.listenHistory.record, {
      trackId,
      secondsPlayed,
      source: sourceRef.current,
      trackDurationSec: trackDurationSec > 0 ? Math.floor(trackDurationSec) : undefined,
    }).catch(() => {
      // Silently ignore — listen history is non-critical
    });
  }, []);

  // Init audio element (client-only)
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // If we have a persisted track, set it up (paused) so user can resume
    if (persisted.currentTrack) {
      audio.src = persisted.currentTrack.audioUrl;
      audio.currentTime = persisted.progress;
      audio.volume = persisted.volume / 100;
    }

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
            recordListen(trackObj.id, currentTime, dur);
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

      if(q.length === 0) {
        setIsPlaying(false);
        return;
      }

      let nextIdx: number;
      if(shuffleRef.current && q.length > 1) {
        do { nextIdx = Math.floor(Math.random() * q.length); } while (nextIdx === idx);
      } else if(idx < q.length - 1) {
        nextIdx = idx + 1;
      } else {
        setIsPlaying(false);
        setProgress(0);
        return;
      }

      const nextItem = q[nextIdx];
      loggedTrackRef.current = null;
      queueIdxRef.current = nextIdx;
      store.dispatch(setQueueIdx(nextIdx));
      setTrack(nextItem);
      setProgress(0);
      audio.src = nextItem.audioUrl;
      void audio.play();
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

  const playTrack = useCallback((newTrack: TrackDto, newQueue?: TrackDto[], source?: PlaybackSource) => {
    const q           = newQueue ?? [newTrack];
    const idx         = q.findIndex((t) => t.id === newTrack.id);
    const resolvedIdx = idx >= 0 ? idx : 0;

    loggedTrackRef.current  = null;
    sourceRef.current       = source ?? "browse";
    queueRef.current        = q;
    queueIdxRef.current     = resolvedIdx;
    store.dispatch(setQueueIdx(resolvedIdx));
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

  const addToQueue = useCallback((newTrack: TrackDto) => {
    const q = [...queueRef.current, newTrack];
    queueRef.current = q;
    setQueue(q);
  }, []);

  const nextTrack = useCallback(() => {
    const q   = queueRef.current;
    const idx = queueIdxRef.current;

    if(q.length === 0)
      return;

    let next: number;
    if(shuffleRef.current && q.length > 1) {
      do { next = Math.floor(Math.random() * q.length); } while (next === idx);
    } else {
      next = (idx + 1) % q.length;
    }

    const nextTrackItem = q[next];

    if(!nextTrackItem)
      return;

    loggedTrackRef.current = null;
    queueIdxRef.current = next;
    store.dispatch(setQueueIdx(next));
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
    store.dispatch(setQueueIdx(prev));
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

  const pendingLikes = useRef(new Set<number>());

  const toggleLike = useCallback((id: number, trackDto?: TrackDto) => {
    if (pendingLikes.current.has(id)) return;
    pendingLikes.current.add(id);

    setLikedItems((prev) => {
      const next = new Set(prev);
      const isCurrentlyLiked = next.has(id);

      if (isCurrentlyLiked) {
        next.delete(id);
        api.delete(API_ENDPOINTS.engagementActions.unlike(id))
          .catch(() => {})
          .finally(() => pendingLikes.current.delete(id));
      } else {
        next.add(id);
        const t = trackDto ?? queueRef.current.find((tr) => tr.id === id);
        if (t) {
          const artistId = getPrimaryArtistId(t);
          if (artistId) {
            api.post(API_ENDPOINTS.engagementActions.record, {
              actionType: "like_track",
              artistId,
              trackId: id,
            })
              .catch(() => {})
              .finally(() => pendingLikes.current.delete(id));
          } else {
            pendingLikes.current.delete(id);
          }
        } else {
          pendingLikes.current.delete(id);
        }
      }

      return next;
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        activeCategory, setActiveCategory,
        likedItems, toggleLike,
        isPlaying, setIsPlaying,
        track, progress, duration, volume, setVolume,
        shuffle, setShuffle, repeat, setRepeat,
        showQueue, setShowQueue,
        queue, playTrack, addToQueue, nextTrack, prevTrack, seekTo,
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

export function useOptionalPlayer() {
  return useContext(PlayerContext);
}
