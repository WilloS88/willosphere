"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type StoreTheme = "dark" | "light";

interface StoreThemeContextValue {
  theme:  StoreTheme;
  toggle: () => void;
  isDark: boolean;
}

const StoreThemeContext = createContext<StoreThemeContextValue | null>(null);

export function StoreThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<StoreTheme>("dark");

  useEffect(() => {
    const saved = typeof window !== "undefined"
      ? window.localStorage.getItem("vhs-store-theme") as StoreTheme | null
      : null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("vhs-store-theme", theme);
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <StoreThemeContext.Provider value={{ theme, toggle, isDark: theme === "dark" }}>
      {children}
    </StoreThemeContext.Provider>
  );
}

export function useStoreTheme() {
  const ctx = useContext(StoreThemeContext);

  if(!ctx)
    throw new Error("useStoreTheme must be inside StoreThemeProvider");

  return ctx;
}
