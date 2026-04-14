import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  navCollapsed: boolean;
}

const initialState: UiState = { navCollapsed: false };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setNavCollapsed(state, action: PayloadAction<boolean>) {
      state.navCollapsed = action.payload;
    },
    toggleNav(state) {
      state.navCollapsed = !state.navCollapsed;
    },
    hydrateUi(state, action: PayloadAction<Partial<UiState>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { setNavCollapsed, toggleNav, hydrateUi } = uiSlice.actions;
export default uiSlice.reducer;
