import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./features/cart/cartSlice";
import themeReducer from "./features/theme/themeSlice";
import playerReducer from "./features/player/playerSlice";
import uiReducer from "./features/ui/uiSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    theme: themeReducer,
    player: playerReducer,
    ui: uiReducer,
  },
});

if(typeof window !== "undefined") {
  store.subscribe(() => {
    try {
      const state = store.getState();
      localStorage.setItem("cart_v1", JSON.stringify(state.cart.items));
      localStorage.setItem("vhs-store-theme", state.theme.mode);
      localStorage.setItem("nav-collapsed", String(state.ui.navCollapsed));

      const { volume, currentTrack, queue, queueIdx, shuffle, repeat, progress } = state.player;
      localStorage.setItem("player_v1", JSON.stringify({ volume, currentTrack, queue, queueIdx, shuffle, repeat, progress }));
    } catch {}
  });
}

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

