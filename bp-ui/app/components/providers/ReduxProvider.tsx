"use client";

import { useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { hydrateCart } from "@/lib/features/cart/cartSlice";
import type { CartItem } from "@/lib/features/cart/cartSlice";

function CartHydrator() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart_v1");
      if(raw) {
        const items = JSON.parse(raw) as CartItem[];
        store.dispatch(hydrateCart(items));
      }
    } catch {}
  }, []);

  return null;
}

export function ReduxProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <CartHydrator />
      {children}
    </Provider>
  );
}
