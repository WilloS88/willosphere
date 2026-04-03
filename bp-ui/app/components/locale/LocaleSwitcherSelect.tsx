"use client";

import { Locale } from "next-intl";
import React, {
  ReactNode,
  useMemo,
  useState,
  useRef,
  useEffect,
  useTransition,
} from "react";
import { usePathname, useRouter } from "@/app/i18n/navigation";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  value: Locale;
  label: string;
  icon?: ReactNode;
};

type Props = {
  items:        Item[];
  defaultValue: Locale;
  label:        string;
};

/**
 * Detect VHS dark/light from the nearest [data-store-theme] ancestor.
 * Works regardless of whether StoreThemeProvider exists in the tree.
 */
function useDetectTheme(ref: React.RefObject<HTMLElement | null>) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if(!ref.current)
      return;

    const check = () => {
      const el = ref.current?.closest("[data-store-theme]");
      setIsDark(!el || el.getAttribute("data-store-theme") !== "light");
    };

    check();

    // Re-check when theme toggles
    const observer = new MutationObserver(check);
    const root =
      ref.current.closest("[data-store-theme]") ?? document.documentElement;
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-store-theme"],
    });

    return () => observer.disconnect();
  }, [ref]);

  return isDark;
}

export default function LocaleSwitcherSelect({
  items,
  defaultValue,
  label,
}: Props) {
  const router                        = useRouter();
  const pathname                      = usePathname();
  const [isPending, startTransition]  = useTransition();
  const [open, setOpen]               = useState(false);
  const containerRef                  = useRef<HTMLDivElement>(null);
  const isDark                        = useDetectTheme(containerRef);

  const current = useMemo(
    () => items.find((i) => i.value === defaultValue) ?? items[0],
    [items, defaultValue],
  );

  // Close on outside click
  useEffect(() => {
    if(!open)
      return;

    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if(!open)
      return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")
        setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const onPick = (nextLocale: Locale) => {
    if(nextLocale === defaultValue) {
      setOpen(false);
      return;
    }
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-block",
        isPending && "pointer-events-none opacity-50",
      )}
    >
      <p className="sr-only">{label}</p>

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "font-vcr flex cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 h-8 text-[11px] tracking-wider transition-all",
          isDark
            ? "border-royalblue/40 bg-royalblue/20 text-vhs-light hover:border-fear/40 hover:text-fearyellow"
            : "border-[#a89888] bg-white/60 text-[#524a44] hover:border-[#c4234e]/40 hover:text-[#c4234e]",
        )}
      >
        {current?.icon}
        <span className="hidden sm:inline">{current?.label}</span>
        <ChevronDown
          size={12}
          className={cn(
            "transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          className={cn(
            "absolute top-full right-0 z-[300] mt-1.5 min-w-[140px] overflow-hidden rounded-sm border",
            "animate-slide-up",
            isDark
              ? "bg-vhs-surface border-royalblue/30 shadow-[0_4px_20px_rgba(11,15,45,0.8)]"
              : "border-[#a89888]/40 bg-[#f5f0e8] shadow-[0_4px_16px_rgba(0,0,0,0.12)]",
          )}
        >
          {items.map((it) => {
            const isActive = it.value === defaultValue;

            return (
              <button
                key={it.value}
                type="button"
                onClick={() => onPick(it.value)}
                disabled={isPending}
                className={cn(
                  "font-vcr flex w-full cursor-pointer items-center gap-2.5 border-none px-2 py-2.5 text-left text-[11px] tracking-wider transition-colors",
                  isActive
                    ? isDark
                      ? "bg-fear/15 text-fearyellow"
                      : "bg-[#c4234e]/10 text-[#c4234e]"
                    : isDark
                      ? "text-vhs-light hover:bg-royalblue/15 hover:text-vhs-white"
                      : "text-[#524a44] hover:bg-[#c4234e]/5 hover:text-[#2a2520]",
                )}
              >
                {it.icon}
                <span className="flex-1">{it.label}</span>
                {isActive && (
                  <Check size={12} className="text-fear shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
