"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/hooks";

type VHSSpinnerProps = {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  xs: "h-3 w-3 border",
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-6 w-6 border-2",
} as const;

export function VHSSpinner({ size = "md", className }: VHSSpinnerProps) {
  const { isDark } = useTheme();

  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        sizeMap[size],
        isDark ? "text-vhs-cyan" : "text-[#c4234e]",
        className,
      )}
    />
  );
}
