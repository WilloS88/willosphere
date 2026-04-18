import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TrackDto } from "@/app/types/track";

interface PlayerState {
  volume:       number;
  currentTrack: TrackDto | null;
  queue:        TrackDto[];
  queueIdx:     number;
  shuffle:      boolean;
  repeat:       boolean;
  progress:     number;
}

const STORAGE_KEY = "player_v1";

const MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

function loadPlayer(): PlayerState {
  const defaults: PlayerState = {
    volume:       75,
    currentTrack: null,
    queue:        [],
    queueIdx:     -1,
    shuffle:      false,
    repeat:       false,
    progress:     0,
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) {
        const parsed = JSON.parse(raw);
        const savedAt = parsed.savedAt ?? 0;
        if (Date.now() - savedAt > MAX_AGE_MS) {
          return { ...defaults, volume: parsed.volume ?? 75 };
        }
        return { ...defaults, ...parsed };
      }
    } catch {}
  }
  return defaults;
}

const initialState: PlayerState = loadPlayer();

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setVolume(state, action: PayloadAction<number>) {
      state.volume = action.payload;
    },
    setCurrentTrack(state, action: PayloadAction<TrackDto | null>) {
      state.currentTrack = action.payload;
    },
    setQueue(state, action: PayloadAction<TrackDto[]>) {
      state.queue = action.payload;
    },
    setQueueIdx(state, action: PayloadAction<number>) {
      state.queueIdx = action.payload;
    },
    setPlayerShuffle(state, action: PayloadAction<boolean>) {
      state.shuffle = action.payload;
    },
    setPlayerRepeat(state, action: PayloadAction<boolean>) {
      state.repeat = action.payload;
    },
    setProgress(state, action: PayloadAction<number>) {
      state.progress = action.payload;
    },
    clearPlayer(state) {
      state.currentTrack = null;
      state.queue = [];
      state.queueIdx = -1;
      state.progress = 0;
    },
  },
});

export const {
  setVolume,
  setCurrentTrack,
  setQueue,
  setQueueIdx,
  setPlayerShuffle,
  setPlayerRepeat,
  setProgress,
  clearPlayer,
} = playerSlice.actions;

export default playerSlice.reducer;
