"use client";

import { useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { useAppSelector } from "@/lib/hooks";
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

function ThemeSyncer() {
  const mode = useAppSelector((s) => s.theme.mode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    document.documentElement.setAttribute("data-store-theme", mode);
  }, [mode]);

  return null;
}

export function ReduxProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <CartHydrator />
      <ThemeSyncer />
      {children}
    </Provider>
  );
}
