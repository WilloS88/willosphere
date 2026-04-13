"use client";

import Link from "next/link";
import ElectricBorder from "@/app/components/ui/react-bits/electric-border/ElectricBorder";
import Noise from "@/app/components/ui/react-bits/noise/Noise";
import { useTheme } from "@/lib/hooks";

export default function NotFound() {
  const { isDark } = useTheme();

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden font-vcr px-4 ${
        isDark ? "bg-darkblue" : "bg-light-bg"
      }`}
    >
      {/* Noise overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Noise
          patternSize={50}
          patternScaleX={5}
          patternScaleY={5}
          patternRefreshInterval={2}
          patternAlpha={25}
        />
      </div>

      {/* Scanlines */}
      <div className="absolute inset-0 z-0 pointer-events-none vhs-scanlines" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">

        {/* Electric badge */}
        <div className="mb-6">
          <ElectricBorder
            color="#ed2c5e"
            speed={1}
            chaos={0.07}
            thickness={2}
            style={{ borderRadius: 2 }}
          >
            <div className={`px-5 py-2 text-xs tracking-[3px] ${isDark ? "text-vhs-muted" : "text-light-muted"}`}>
              Error 404
            </div>
          </ElectricBorder>
        </div>

        {/* Big number */}
        <h1 className="text-7xl md:text-9xl font-black tracking-tight text-fear">
          404
        </h1>

        {/* Subtitle */}
        <h2 className={`mt-4 text-2xl md:text-4xl font-bold tracking-[2px] ${isDark ? "text-vhs-white" : "text-light-text"}`}>
          Page not found
        </h2>

        {/* Body copy */}
        <p className={`mt-4 text-sm tracking-wider leading-relaxed ${isDark ? "text-vhs-muted" : "text-light-muted"}`}>
          The page you&#39;re looking for doesn&#39;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <Link
            href="/"
            className="w-full sm:w-auto rounded-sm bg-fear px-8 py-3 text-xs font-bold tracking-[3px] text-white hover:brightness-110 transition-all"
          >
            Back to homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className={`w-full sm:w-auto rounded-sm border px-8 py-3 text-xs font-bold tracking-[3px] transition-all ${
              isDark
                ? "border-royalblue/40 text-vhs-muted hover:text-vhs-white hover:border-royalblue"
                : "border-light-border text-light-muted hover:text-light-text hover:border-light-subtle"
            }`}
          >
            Go back
          </button>
        </div>

        {/* Tips card */}
        <div
          className={`mt-10 w-full rounded-sm border p-5 text-left ${
            isDark
              ? "bg-vhs-card border-royalblue/30"
              : "bg-light-card border-light-border/40"
          }`}
        >
          <h3 className={`mb-3 text-xs font-bold tracking-[2px] ${isDark ? "text-vhs-white" : "text-light-text"}`}>
            What can you try?
          </h3>
          <ul className={`space-y-2 text-xs tracking-wider ${isDark ? "text-vhs-muted" : "text-light-muted"}`}>
            <li>• Check the URL address</li>
            <li>• Go back to the previous page</li>
            <li>• Open the homepage</li>
          </ul>
        </div>

        {/* Error code footer */}
        <p className={`mt-6 text-caption ${isDark ? "text-vhs-muted/50" : "text-light-muted/50"}`}>
          Error code: <span className="font-mono">NOT_FOUND</span>
        </p>
      </div>
    </div>
  );
}
