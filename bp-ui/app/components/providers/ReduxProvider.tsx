"use client";

import { useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { useAppSelector } from "@/lib/hooks";
import { hydrateCart } from "@/lib/features/cart/cartSlice";
import type { CartItem } from "@/lib/features/cart/cartSlice";
import { hydrateTheme } from "@/lib/features/theme/themeSlice";
import { hydrateUi } from "@/lib/features/ui/uiSlice";

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
    const saved = localStorage.getItem("vhs-store-theme");
    if (saved === "dark" || saved === "light") {
      store.dispatch(hydrateTheme(saved));
    }
    const savedNav = localStorage.getItem("nav-collapsed");
    if (savedNav === "true") {
      store.dispatch(hydrateUi({ navCollapsed: true }));
    }
  }, []);

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
