import { cn } from "@/lib/utils";

type AdminSkeletonProps = {
  variant?:   "text" | "title" | "avatar" | "thumbnail" | "card" | "table-row";
  width?:     string;
  height?:    string;
  rows?:      number;
  cols?:      number;
  className?: string;
};

const variantDefaults: Record<string, string> = {
  text:       "h-4 w-full rounded",
  title:      "h-6 w-48 rounded",
  avatar:     "h-10 w-10 rounded-full",
  thumbnail:  "h-32 w-32 rounded",
  card:       "h-48 w-full rounded-lg",
};

export function AdminSkeleton({
  variant = "text",
  width,
  height,
  rows = 1,
  cols = 4,
  className,
}: AdminSkeletonProps) {
  if (variant === "table-row") {
    return (
      <tr>
        {Array.from({ length: cols }).map((_, i) => (
          <td key={i} className="py-2 px-3">
            <span className={cn("skeleton h-4 w-full rounded", className)} />
          </td>
        ))}
      </tr>
    );
  }

  if (variant === "text" && rows > 1) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "skeleton h-4 rounded",
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
    <span
      className={cn("skeleton", variantDefaults[variant], width, height, className)}
    />
  );
}
