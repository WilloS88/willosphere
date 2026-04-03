"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/lib/hooks";
import Noise from "@/app/components/ui/react-bits/noise/Noise";
import { VHSOverlay } from "@/app/components/effects/VHSOverlay";

export default function PageShell({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();

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
