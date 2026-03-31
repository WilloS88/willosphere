"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePlayer } from "@/app/context/PlayerContext";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import { SectionLabel } from "@/app/components/ui/elastic-slider/StoreUI";
import { type StoreNavItem } from "@/lib/store-data";
import { cn } from "@/lib/utils";
import { ChevronLeft, Menu } from "lucide-react";

function NavItem({ item }: { item: StoreNavItem }) {
  const t                 = useTranslations("Store");
  const { navCollapsed }  = usePlayer();
  const { isDark }        = useStoreTheme();
  const pathname          = usePathname();
  const { locale }        = useParams<{ locale: string }>();
  const fullHref          = `/${locale}${item.href}`;
  const active =
    pathname === fullHref ||
    (item.href !== "/store" &&
      item.href !== "/home" &&
      pathname.startsWith(fullHref));

  const [hovered, setHovered] = useState(false);

  return (
    // KLÍČ: position: relative + overflow: visible na wrapperu
    <div
      className="relative w-full"
      style={{ overflow: "visible" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={fullHref}
        className={cn(
          "group relative flex w-full items-center gap-2.5 border-l-2 no-underline transition-all",
          navCollapsed
            ? "justify-center px-0 py-2.5"
            : "justify-start px-4 py-2",
          active
            ? cn(
                "from-fear/15 border-l-fear bg-gradient-to-r to-transparent",
                isDark ? "text-fearyellow" : "text-[#c4234e]",
              )
            : cn(
                "border-l-transparent",
                isDark
                  ? "text-vhs-light hover:text-vhs-white hover:bg-royalblue/10"
                  : "text-[#6b6560] hover:bg-[#c4234e]/5 hover:text-[#2a2520]",
              ),
          "font-vcr text-xs tracking-wider",
        )}
      >
        <span
          className={cn(
            "flex w-5 shrink-0 items-center justify-center",
            active && "drop-shadow-[0_0_4px_#ed2c5e]",
          )}
        >
          {item.icon}
        </span>
        {!navCollapsed && <span>{t(`nav_${item.id}`)}</span>}
        {active && !navCollapsed && (
          <ChevronLeft size={10} className="text-fear ml-auto" />
        )}
      </Link>

      <AnimatePresence>
        {navCollapsed && hovered && (
          <motion.div
            initial={{ opacity: 0, x: -6, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            // KLÍČ: fixed positioning — vymaní se ze všech overflow kontextů
            style={{ position: "fixed", zIndex: 9999 }}
            className={cn(
              "pointer-events-none flex items-center rounded-sm border px-2.5 py-1.5",
              "font-vcr text-xs tracking-wider whitespace-nowrap",
              isDark
                ? "bg-darkblue border-royalblue/40 text-vhs-white shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
                : "border-[#c4b8a8]/50 bg-white text-[#2a2520] shadow-md",
            )}
            // Pozici vypočítáme přes ref na wrapper
            ref={(el) => {
              if (!el)
                return;

              const parent = el.parentElement;
              if (!parent)
                return;

              const rect    = parent.getBoundingClientRect();
              el.style.top  = `${rect.top + rect.height / 2 - el.offsetHeight / 2}px`;
              el.style.left = `${rect.right + 8}px`;
            }}
          >
            {/* Šipka vlevo */}
            <span
              className={cn(
                "absolute top-1/2 right-full -translate-y-1/2 border-y-4 border-r-4 border-y-transparent",
                isDark ? "border-r-royalblue/40" : "border-r-[#c4b8a8]/50",
              )}
            />
            {t(`nav_${item.id}`)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryItem({ name }: { name: string }) {
  const { activeCategory, setActiveCategory } = usePlayer();
  const { isDark }                            = useStoreTheme();
  const active                                = activeCategory === name;

  return (
    <button
      onClick={() => setActiveCategory(active ? null : name)}
      className={cn(
        "font-vcr w-full cursor-pointer border-none px-4 py-[7px] text-left text-xs tracking-wider transition-all",
        active
          ? isDark
            ? "bg-royalblue/20 text-vhs-white"
            : "bg-[#c4234e]/10 text-[#2a2520]"
          : isDark
            ? "text-vhs-muted hover:text-vhs-light bg-transparent"
            : "bg-transparent text-[#8a8578] hover:text-[#2a2520]",
      )}
    >
      {name}
    </button>
  );
}

function SystemStatus() {
  const t = useTranslations("Store");
  const { navCollapsed } = usePlayer();
  const { isDark } = useStoreTheme();

  return (
    <div
      className={cn(
        "rounded-sm border",
        isDark
          ? "bg-royalblue/15 border-royalblue/20"
          : "border-[#c4b8a8]/30 bg-[#c4234e]/5",
        navCollapsed ? "mx-1 my-2 p-2" : "mx-3 my-2 p-2.5",
      )}
    >
      {!navCollapsed ? (
        <>
          <SectionLabel className="mb-1.5">{t("systemStatus")}</SectionLabel>
          <div
            className={`text-[11px] leading-relaxed tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
          >
            {t("cacheLabel")}: <span className="text-vhs-green">OK</span>
            <br />
            {t("signalLabel")}: <span className="text-vhs-green">100%</span>
            <br />
            {t("memoryLabel")}:{" "}
            <span className="text-vhs-green">{t("optimalValue")}</span>
          </div>
        </>
      ) : (
        <div className="bg-vhs-green mx-auto h-2 w-2 rounded-full shadow-[0_0_6px_#00ff88]" />
      )}
    </div>
  );
}

export function Sidebar({ navItems }: { navItems: StoreNavItem[] }) {
  const t                                   = useTranslations("Store");
  const { navCollapsed, setNavCollapsed }   = usePlayer();
  const { isDark }                          = useStoreTheme();

  return (
    <aside
      className={cn(
        "flex flex-col border-r transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        navCollapsed ? "w-[52px] min-w-[52px]" : "w-[200px] min-w-[200px]",
        // KLÍČ: overflow-visible když je collapsed (kvůli tooltipům), jinak overflow-hidden
        navCollapsed ? "overflow-visible" : "overflow-hidden",
        isDark
          ? "from-vhs-surface to-darkblue border-royalblue/25 bg-gradient-to-b"
          : "border-[#c4b8a8]/30 bg-gradient-to-b from-[#ede7db] to-[#e5dfd3]",
        "max-md:fixed max-md:top-11 max-md:bottom-[72px] max-md:left-0 max-md:z-40",
      )}
    >
      <button
        onClick={() => setNavCollapsed(!navCollapsed)}
        className={cn(
          "flex cursor-pointer items-center gap-2 border-b border-none bg-transparent py-3 text-sm transition-all",
          isDark
            ? "text-vhs-muted border-royalblue/15"
            : "border-[#c4b8a8]/20 text-[#8a8578]",
          navCollapsed ? "justify-center px-0" : "justify-start px-4",
        )}
      >
        <span
          className="text-base transition-transform duration-300"
          style={{ transform: navCollapsed ? "rotate(0)" : "rotate(180deg)" }}
        >
          <Menu />
        </span>
        {!navCollapsed && (
          <span
            className={`text-[11px] tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
          >
            {t("collapse")}
          </span>
        )}
      </button>

      {/* KLÍČ: overflow-visible na scroll divu v collapsed módu */}
      <div
        className={cn(
          "flex-1 py-2",
          navCollapsed ? "overflow-visible" : "vhs-scrollbar overflow-y-auto",
        )}
      >
        {!navCollapsed && (
          <SectionLabel
            className={`mb-1 border-b px-4 py-2 ${isDark ? "border-royalblue/10" : "border-[#c4b8a8]/15"}`}
          >
            {t("navigation")}
          </SectionLabel>
        )}
        {navItems.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}
      </div>

      <SystemStatus />
    </aside>
  );
}
