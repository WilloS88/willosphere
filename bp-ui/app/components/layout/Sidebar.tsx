"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePlayer } from "@/app/context/PlayerContext";
import { useTheme, useNav } from "@/lib/hooks";
import { SectionLabel } from "@/app/components/ui/elastic-slider/StoreUI";
import { type StoreNavItem } from "@/lib/store-data";
import { cn } from "@/lib/utils";
import { ChevronLeft, Menu, X } from "lucide-react";

function NavItem({ item }: { item: StoreNavItem }) {
  const t                                = useTranslations("Store");
  const { navCollapsed, setNavCollapsed } = useNav();
  const { isDark }                       = useTheme();
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
        onClick={() => {
          // Close drawer on mobile after nav click
          if (window.matchMedia("(max-width: 768px)").matches) setNavCollapsed(true);
        }}
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
                  : "text-[#524a44] hover:bg-[#c4234e]/5 hover:text-[#2a2520]",
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
                : "border-[#a89888]/50 bg-white text-[#2a2520] shadow-md",
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
                isDark ? "border-r-royalblue/40" : "border-r-[#a89888]/50",
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
  const { isDark }                            = useTheme();
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
            : "bg-transparent text-[#635b53] hover:text-[#2a2520]",
      )}
    >
      {name}
    </button>
  );
}

function SystemStatus() {
  const t                 = useTranslations("Store");
  const { navCollapsed }  = useNav();
  const { isDark }        = useTheme();

  return (
    <div
      className={cn(
        "rounded-sm border",
        isDark
          ? "bg-royalblue/15 border-royalblue/20"
          : "border-[#a89888]/30 bg-[#c4234e]/5",
        navCollapsed ? "mx-1 my-2 p-2" : "mx-3 my-2 p-2.5",
      )}
    >
      {!navCollapsed ? (
        <>
          <SectionLabel className="mb-1.5">{t("systemStatus")}</SectionLabel>
          <div
            className={`text-xs leading-relaxed tracking-wider ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}
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
  const t                                                      = useTranslations("Store");
  const { navCollapsed, toggleNav: toggleNavCollapsed, setNavCollapsed } = useNav();
  const { isDark }                                             = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  // Auto-collapse on mobile + track mobile state
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    if (mq.matches) setNavCollapsed(true);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches) setNavCollapsed(true);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setNavCollapsed]);

  // On mobile: completely hidden when collapsed, full drawer when expanded
  const mobileHidden = isMobile && navCollapsed;
  const mobileDrawer = isMobile && !navCollapsed;

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setNavCollapsed(true)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar / Drawer */}
      {!mobileHidden && (
        <aside
          className={cn(
            "flex flex-col border-r transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            // Desktop: normal sidebar behavior
            !isMobile && (navCollapsed ? "w-[52px] min-w-[52px]" : "w-[200px] min-w-[200px]"),
            !isMobile && (navCollapsed ? "overflow-visible" : "overflow-hidden"),
            // Mobile drawer: fixed full-height overlay
            isMobile && "fixed inset-y-0 left-0 z-40 w-[280px] overflow-hidden shadow-2xl",
            isDark
              ? "from-vhs-surface to-darkblue border-royalblue/25 bg-gradient-to-b"
              : "border-[#a89888]/30 bg-gradient-to-b from-[#ede7db] to-[#e5dfd3]",
          )}
        >
          {/* Header: collapse/close button */}
          <button
            onClick={toggleNavCollapsed}
            className={cn(
              "flex cursor-pointer items-center gap-2 border-none bg-transparent py-3 text-sm transition-all",
              isDark
                ? "text-vhs-muted border-royalblue/15"
                : "border-[#a89888]/20 text-[#635b53]",
              // Mobile drawer: show close X, aligned left with padding
              isMobile ? "justify-between px-4" : (navCollapsed ? "justify-center px-0" : "justify-start px-4"),
            )}
          >
            {isMobile ? (
              <>
                <span className={`text-xs font-bold tracking-[2px] ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}>
                  MENU
                </span>
                <X size={18} />
              </>
            ) : (
              <>
                <span
                  className="text-base transition-transform duration-300"
                  style={{ transform: navCollapsed ? "rotate(0)" : "rotate(180deg)" }}
                >
                  <Menu />
                </span>
                {!navCollapsed && (
                  <span className={`text-xs tracking-[2px] ${isDark ? "text-vhs-muted" : "text-[#635b53]"}`}>
                    {t("collapse")}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Nav items */}
          <div
            className={cn(
              "flex-1 py-2",
              !isMobile && navCollapsed ? "overflow-visible" : "vhs-scrollbar overflow-y-auto",
            )}
          >
            {(!navCollapsed || isMobile) && (
              <SectionLabel
                className={`mb-1 border-b px-4 py-2 ${isDark ? "border-royalblue/10" : "border-[#a89888]/15"}`}
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
      )}
    </>
  );
}
