import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ThemeMode = "dark" | "light";

interface ThemeState {
  mode: ThemeMode;
}

function loadTheme(): ThemeMode {
  if(typeof window !== "undefined") {
    const saved = localStorage.getItem("vhs-store-theme");
    if(saved === "dark" || saved === "light")
      return saved;
  }
  return "dark";
}

const initialState: ThemeState = { mode: loadTheme() };

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
    toggleTheme(state) {
      state.mode = state.mode === "dark" ? "light" : "dark";
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
