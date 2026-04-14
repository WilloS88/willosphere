"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/hooks";

type VHSSkeletonProps = {
  variant?: "text" | "title" | "image" | "card" | "avatar";
  width?: string;
  height?: string;
  rows?: number;
  className?: string;
};

const variantDefaults: Record<string, string> = {
  text: "h-3 w-full rounded",
  title: "h-4 w-48 rounded",
  image: "h-[200px] w-full rounded-lg",
  avatar: "h-[100px] w-[100px] rounded-full",
};

function ShimmerBlock({
  isDark,
  className,
}: {
  isDark: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block animate-vhs-shimmer bg-[length:200%_100%]",
        isDark
          ? "bg-gradient-to-r from-transparent via-royalblue/20 to-transparent"
          : "bg-gradient-to-r from-transparent via-[#c5bfb3]/30 to-transparent",
        isDark ? "bg-royalblue/15" : "bg-[#c5bfb3]/40",
        className,
      )}
    />
  );
}

export function VHSSkeleton({
  variant = "text",
  width,
  height,
  rows = 1,
  className,
}: VHSSkeletonProps) {
  const { isDark } = useTheme();

  if (variant === "card") {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-lg border p-3",
          isDark
            ? "border-royalblue/10 bg-vhs-card/40"
            : "border-[#a89888]/20 bg-[#d5cfc5]/30",
          className,
        )}
      >
        <ShimmerBlock isDark={isDark} className="h-[140px] w-full rounded-lg" />
        <ShimmerBlock isDark={isDark} className="h-3 w-full rounded" />
        <ShimmerBlock isDark={isDark} className="h-3 w-3/4 rounded" />
      </div>
    );
  }

  if (variant === "text" && rows > 1) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <ShimmerBlock
            key={i}
            isDark={isDark}
            className={cn(
              "h-3 rounded",
              i === rows - 1 ? "w-3/4" : "w-full",
              width,
              height,
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <ShimmerBlock
      isDark={isDark}
      className={cn(variantDefaults[variant], width, height, className)}
    />
  );
}
