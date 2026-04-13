"use client";

import { useRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/hooks";
import TextType from "@/app/components/ui/react-bits/text-type/TextType";

/* ── GlitchText ── */
export function GlitchText({ children, className, as: Tag = "span" }: {
  children: ReactNode; className?: string; as?: keyof HTMLElementTagNameMap;
}) {
  return <Tag className={cn("relative inline-block vhs-glitch-text", className)}>{children}</Tag>;
}

/* ── Badge ── */
type BadgeVariant = "fear" | "green" | "yellow" | "purple" | "cyan";
const badgeColors: Record<BadgeVariant, string> = {
  fear:   "bg-fear text-white",
  green:  "bg-vhs-green text-darkblue",
  yellow: "bg-fearyellow text-darkblue",
  purple: "bg-vhs-purple text-white",
  cyan:   "bg-vhs-cyan text-darkblue",
};

export function Badge({ children, variant = "fear", className }: {
  children: ReactNode; variant?: BadgeVariant; className?: string;
}) {
  return (
    <span className={cn("px-2.5 py-0.5 rounded-sm text-xs font-bold tracking-wider leading-none", badgeColors[variant], className)}>
      {children}
    </span>
  );
}

export function PriceBadge({ price }: { price: number }) {
  if (price === 0) return <Badge variant="green">FREE</Badge>;
  return <Badge variant="fear">${price.toFixed(2)}</Badge>;
}

/* ── VHSButton ── */
type BtnVariant = "primary" | "success" | "yellow" | "ghost";

export function VHSButton({ variant = "primary", children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const { isDark } = useTheme();

  const btnVariants: Record<BtnVariant, string> = {
    primary: "flex-1 py-[7px] bg-gradient-to-r from-fear to-fear/80 text-white border-none",
    success: "flex-1 py-[7px] bg-gradient-to-r from-vhs-green/60 to-vhs-green/40 text-darkblue border-none",
    yellow:  "flex-1 py-[7px] bg-gradient-to-r from-fearyellow to-fearyellow/80 text-darkblue border-none",
    ghost:   cn("w-[30px] h-[30px] flex-none border",
      isDark ? "bg-royalblue/25 border-royalblue/40 text-vhs-muted" : "bg-[#a89888]/20 border-[#a89888]/40 text-[#635b53]"
    ),
  };

  return (
    <button
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-sm cursor-pointer text-xs font-bold tracking-wider font-vcr transition-all hover:brightness-110 active:scale-[0.97]",
        btnVariants[variant], className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── LikeButton ── */
export function LikeButton({ itemId, liked, onToggle }: { itemId: number; liked: boolean; onToggle: (id: number) => void }) {
  return (
    <VHSButton variant="ghost" onClick={() => onToggle(itemId)} className={cn(liked ? "!text-fear" : "")}>
      <Heart size={13} fill={liked ? "currentColor" : "none"} />
    </VHSButton>
  );
}

/* ── ProgressSlider (fallback, non-elastic) ── */
export function ProgressSlider({ value, max, onChange, showThumb = true, height = "md", colorClass = "bg-gradient-to-r from-fear to-fearyellow", className }: {
  value: number; max: number; onChange?: (v: number) => void;
  showThumb?: boolean; height?: "sm" | "md"; colorClass?: string; className?: string;
}) {
  const ref         = useRef<HTMLDivElement>(null);
  const { isDark }  = useTheme();
  const pct         = max > 0 ? (value / max) * 100 : 0;

  const handleClick = (e: React.MouseEvent) => {
    if(!ref.current || !onChange)
      return;

    const rect = ref.current.getBoundingClientRect();

    onChange(Math.max(0, Math.min(max, Math.floor(((e.clientX - rect.left) / rect.width) * max))));
  };
  const h = height === "sm" ? "h-[3px]" : "h-1";

  return (
    <div ref={ref} onClick={handleClick} className={cn("flex-1 rounded-full cursor-pointer relative", isDark ? "bg-royalblue/40" : "bg-[#a89888]/30", h, className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-300 linear shadow-[0_0_8px_rgba(237,44,94,0.25)]", colorClass)} style={{ width: `${pct}%` }} />
      {showThumb && (
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-vhs-white border-2 border-fear shadow-[0_0_6px_var(--color-fear)] transition-[left] duration-300" style={{ left: `${pct}%` }} />
      )}
    </div>
  );
}

/* ── SectionLabel ── */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-xs tracking-[2px] font-bold italic text-fear", className)}>{children}</div>;
}

/* ── PageHeader (with theme + TextType) ── */
export function PageHeader({ title, count }: { title: string; count?: number }) {
  const t           = useTranslations("Store");
  const { isDark }  = useTheme();

  return (
    <div className="mb-5">
      <div className={`inline-block px-5 py-1.5 vhs-skew-clip mb-2 ${isDark ? "bg-gradient-to-r from-fear to-fear/80" : "bg-gradient-to-r from-[#c4234e] to-[#a01d40]"}`}>
        <span className="font-bold text-xl sm:text-2xl tracking-[3px] italic text-white">{title}</span>
      </div>
      {count !== undefined && (
        <div className={`font-vcr text-xs mt-1.5 ${isDark ? "text-vhs-cyan" : "text-[#0094a8]"}`}>
          <TextType
            text={`// ${t("showingRecords", { count })}`}
            typingSpeed={30}
            loop={false}
            showCursor
            cursorCharacter="█"
            cursorBlinkDuration={0.5}
          />
        </div>
      )}
    </div>
  );
}

/* ── CardGrid ── */
export function CardGrid({ children, minWidth = 180 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${minWidth}px, 100%), 1fr))` }}>
      {children}
    </div>
  );
}
