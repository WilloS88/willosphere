"use client";

import type { ReactNode } from "react";
import { StoreThemeProvider, useStoreTheme } from "@/app/context/StoreThemeContext";
import Noise from "@/app/components/ui/react-bits/noise/Noise";
import { VHSOverlay } from "@/app/components/effects/VHSOverlay";

function Shell({ children }: { children: ReactNode }) {
  const { isDark } = useStoreTheme();

  return (
    <div
      data-store-theme={isDark ? "dark" : "light"}
      className={`min-h-screen font-vcr relative transition-colors duration-300 ${
        isDark ? "bg-darkblue text-vhs-white" : "bg-[#f0ebe3] text-[#2a2520]"
      }`}
    >
      <div className="fixed inset-0 z-[9997] pointer-events-none opacity-40">
        <Noise patternSize={250} patternAlpha={isDark ? 10 : 5} patternRefreshInterval={4} patternScaleX={1} patternScaleY={1} />
      </div>
      <VHSOverlay />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <StoreThemeProvider>
      <Shell>{children}</Shell>
    </StoreThemeProvider>
  );
}
