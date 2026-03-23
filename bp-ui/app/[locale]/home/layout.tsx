"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlayerProvider } from "@/app/context/PlayerContext";
import {
  StoreThemeProvider,
  useStoreTheme,
} from "@/app/context/StoreThemeContext";
import { VHSOverlay } from "@/app/components/effects/VHSOverlay";
import { HomeTopBar } from "@/app/components/layout/HomeTopBar";
import { Sidebar } from "@/app/components/layout/Sidebar";
import {
  PlayerBar,
  QueuePanel,
} from "@/app/components/layout/PlayerBar";
import { HOME_NAV_ITEMS } from "@/lib/home-data";
import Noise from "@/app/components/ui/react-bits/noise/Noise";
import { useAuth } from "@/app/components/auth/AuthProvider";

function HomeShell({ children }: { children: React.ReactNode }) {
  const { theme, isDark } = useStoreTheme();

  return (
    <div
      data-store-theme={theme}
      className={`font-vcr relative flex h-screen w-full flex-col overflow-hidden text-xs transition-colors duration-300 ${
        isDark ? "bg-darkblue text-vhs-white" : "bg-[#f0ebe3] text-[#2a2520]"
      }`}
    >
      <div className="pointer-events-none fixed inset-0 z-[9997] opacity-60">
        <Noise
          patternSize={250}
          patternAlpha={isDark ? 12 : 6}
          patternRefreshInterval={3}
          patternScaleX={1}
          patternScaleY={1}
        />
      </div>
      <VHSOverlay />
      <HomeTopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={HOME_NAV_ITEMS} />
        <main
          className={`vhs-scrollbar flex-1 overflow-y-auto p-3 sm:p-5 ${
            isDark
              ? "bg-[radial-gradient(ellipse_at_30%_20%,rgba(37,48,120,0.06)_0%,transparent_60%)]"
              : "bg-[radial-gradient(ellipse_at_30%_20%,rgba(196,35,78,0.03)_0%,transparent_60%)]"
          }`}
        >
          {children}
        </main>
      </div>
      <PlayerBar />
      <QueuePanel />
    </div>
  );
}

function HomeGuard({ children }: { children: React.ReactNode }) {
  const { session, isHydrated } = useAuth();
  const router                  = useRouter();
  const { locale }              = useParams<{ locale: string }>();

  useEffect(() => {
    if(isHydrated && !session) {
      router.replace(`/${locale}/login`);
    }
  }, [session, isHydrated, router, locale]);

  if(!isHydrated || !session)
    return null;

  return <>{children}</>;
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreThemeProvider>
      <PlayerProvider>
        <HomeGuard>
          <HomeShell>{children}</HomeShell>
        </HomeGuard>
      </PlayerProvider>
    </StoreThemeProvider>
  );
}
