"use client";

import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { PageHeader, Badge } from "@/app/components/ui/elastic-slider/StoreUI";
import { useStoreTheme } from "@/app/context/StoreThemeContext";

const EVENTS = [
  {
    name: "NEON_NIGHTS_LIVE",
    date: "MAR 15, 2026",
    venue: "CYBER_ARENA // TOKYO",
    artists: ["AESTHETIC_VOX", "SYNTH_WIZARD"],
    price: 45,
    status: "ON_SALE",
    color: "#00e5ff",
  },
  {
    name: "VAPORWAVE_SUMMIT",
    date: "APR 02, 2026",
    venue: "DIGITAL_DOME // LA",
    artists: ["MACINTOSH_PLUS_X", "CITY_SLEEPER"],
    price: 35,
    status: "ON_SALE",
    color: "#9b59ff",
  },
  {
    name: "DARK_FREQUENCY_V3",
    date: "APR 20, 2026",
    venue: "UNDERGROUND_HQ // BERLIN",
    artists: ["GHOST_DATA", "DIGITAL_NOIR"],
    price: 55,
    status: "LOW_STOCK",
    color: "#ed2c5e",
  },
  {
    name: "LO-FI_CAFE_SESSION",
    date: "MAY 10, 2026",
    venue: "RETRO_LOUNGE // LONDON",
    artists: ["CITY_SLEEPER", "TAPE_WARP"],
    price: 20,
    status: "UPCOMING",
    color: "#f4e526",
  },
  {
    name: "RETROWAVE_FEST_88",
    date: "JUN 21, 2026",
    venue: "SUNSET_PARK // MIAMI",
    artists: ["ZERO_ONE", "AESTHETIC_VOX", "SYNTH_WIZARD"],
    price: 75,
    status: "UPCOMING",
    color: "#00ff88",
  },
];

const statusVariant: Record<string, "green" | "fear" | "yellow" | "purple"> = {
  ON_SALE: "green",
  LOW_STOCK: "fear",
  UPCOMING: "yellow",
  SOLD_OUT: "purple",
};

export default function EventsPage() {
  const t           = useTranslations("Store");
  const { isDark }  = useStoreTheme();

  return (
    <>
      <PageHeader title={t("liveEvents")} count={EVENTS.length} />
      <div className="space-y-3 sm:space-y-4">
        {EVENTS.map((event, i) => (
          <div
            key={event.name}
            className={`animate-slide-up rounded border p-4 transition-all sm:p-5 ${
              isDark
                ? "border-royalblue/20 bg-vhs-card hover:border-royalblue/40"
                : "border-[#c4b8a8]/30 bg-white/80 hover:border-[#c4b8a8]/50"
            }`}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <div
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded border sm:h-20 sm:w-20"
                style={{
                  background: `linear-gradient(135deg, ${event.color}22, transparent)`,
                  borderColor: `${event.color}33`,
                }}
              >
                <span
                  className={`text-[9px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
                >
                  {event.date.split(",")[0].split(" ")[0]}
                </span>
                <span
                  className="text-xl font-bold sm:text-2xl"
                  style={{ color: event.color }}
                >
                  {event.date.split(",")[0].split(" ")[1]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3
                    className={`text-sm font-bold tracking-[2px] sm:text-base ${isDark ? "text-vhs-white" : "text-[#2a2520]"}`}
                  >
                    {event.name}
                  </h3>
                  <Badge variant={statusVariant[event.status]}>
                    {event.status}
                  </Badge>
                </div>
                <div
                  className={`mb-2 text-[10px] tracking-wider flex items-center gap-1 ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
                >
                  <MapPin size={10} />{event.venue}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {event.artists.map((a) => (
                    <span
                      key={a}
                      className={`rounded-sm border px-2 py-0.5 text-[9px] tracking-wider ${isDark ? "border-royalblue/30 text-vhs-light" : "border-[#c4b8a8]/30 text-[#6b6560]"}`}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
                <span
                  className={`text-lg font-bold sm:text-xl ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
                >
                  ${event.price}
                </span>
                <button className="bg-fear cursor-pointer rounded-sm px-3 py-1.5 text-[9px] font-bold tracking-wider text-white transition-all hover:brightness-110">
                  {t("getTickets")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
