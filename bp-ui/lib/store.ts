import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./features/cart/cartSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

if(typeof window !== "undefined") {
  store.subscribe(() => {
    try {
      localStorage.setItem("cart_v1", JSON.stringify(store.getState().cart.items));
    } catch {}
  });
}

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
