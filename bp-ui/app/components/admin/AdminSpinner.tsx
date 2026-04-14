import { cn } from "@/lib/utils";

type AdminSpinnerProps = {
  size?:      "xs" | "sm" | "md" | "lg";
  variant?:   "spinner" | "dots" | "ring";
  className?: string;
};

export function AdminSpinner({
  size    = "md",
  variant = "spinner",
  className,
}: AdminSpinnerProps) {
  return (
    <span
      className={cn(
        "loading",
        `loading-${variant}`,
        size !== "md" && `loading-${size}`,
        className,
      )}
    />
  );
}
