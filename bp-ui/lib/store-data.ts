/* ── Types ── */

import { createElement } from "react";
import type { ReactNode } from "react";
import { LayoutGrid, TrendingUp, Sparkles, Radio, Users, ShoppingBag, Disc, CalendarDays } from "lucide-react";

export interface StoreNavItem {
  id:     string;
  icon:   ReactNode;
  label:  string;
  href:   string;
}

export interface Album {
  id:     number;
  title:  string;
  artist: string;
  year:   number;
  price:  number;
  color:  string;
}

export interface MerchItem {
  id:     number;
  title:  string;
  artist: string;
  price:  number;
  tag:    string;
}

export interface Track {
  title:    string;
  artist:   string;
  duration: number;
}

/* ── Navigation (store-relative paths, locale prepended at runtime) ── */

export const STORE_NAV_ITEMS: StoreNavItem[] = [
  { id: "browse",  icon: createElement(LayoutGrid,    { size: 15 }), label: "BROWSE_ALL",  href: "/store" },
  { id: "charts",  icon: createElement(TrendingUp,    { size: 15 }), label: "TOP_CHARTS",  href: "/store/charts" },
  { id: "new",     icon: createElement(Sparkles,      { size: 15 }), label: "NEW_DROPS",   href: "/store/new-drops" },
  { id: "radio",   icon: createElement(Radio,         { size: 15 }), label: "RADIO_MIX",   href: "/store/radio" },
  { id: "artists", icon: createElement(Users,         { size: 15 }), label: "ARTISTS",     href: "/store/artists" },
  { id: "merch",   icon: createElement(ShoppingBag,   { size: 15 }), label: "MERCH_SHOP",  href: "/store/merch" },
  { id: "vinyl",   icon: createElement(Disc,          { size: 15 }), label: "VINYL_STORE", href: "/store/vinyl" },
  { id: "events",  icon: createElement(CalendarDays,  { size: 15 }), label: "LIVE_EVENTS", href: "/store/events" },
];

export const CATEGORIES: string[] = [
  "SYNTHWAVE", "VAPORWAVE", "LO-FI_BEATS", "DARK_AMBIENT",
  "CYBERPUNK", "FUTURE_FUNK", "RETROWAVE", "CHILLWAVE",
];

export const ALBUMS: Album[] = [
  { id: 1, title: "CYBER_SKYLINE_88",   artist: "AESTHETIC_VOX",    year: 1994, price: 19.99, color: "#00e5ff" },
  { id: 2, title: "NEON_DREAMS_V2",     artist: "SYNTH_WIZARD",     year: 1992, price: 12.50, color: "#9b59ff" },
  { id: 3, title: "ANALOG_ECHOES",      artist: "TAPE_WARP",        year: 1998, price: 15.00, color: "#ed2c5e" },
  { id: 4, title: "VAPOR_SUNSET",       artist: "MACINTOSH_PLUS_X", year: 1988, price: 0,     color: "#f4e526" },
  { id: 5, title: "DATA_CORE_REDUX",    artist: "ZERO_ONE",         year: 1990, price: 25.00, color: "#00ff88" },
  { id: 6, title: "LO_FI_RAIN_DAYS",    artist: "CITY_SLEEPER",     year: 1995, price: 9.99,  color: "#00e5ff" },
  { id: 7, title: "MIDNIGHT_PROTOCOL",  artist: "GHOST_DATA",       year: 1991, price: 18.00, color: "#ed2c5e" },
  { id: 8, title: "CHROME_HEARTS",      artist: "DIGITAL_NOIR",     year: 1997, price: 14.50, color: "#9b59ff" },
];

export const MERCH_ITEMS: MerchItem[] = [
  { id: 101, title: "VHS_LOGO_TEE",        artist: "WAVE_STORE",    price: 29.99, tag: "SHIRT" },
  { id: 102, title: "NEON_POSTER_PACK",    artist: "AESTHETIC_VOX", price: 15.00, tag: "POSTER" },
  { id: 103, title: "RETRO_CAP_V2",        artist: "SYNTH_WIZARD",  price: 24.99, tag: "CAP" },
  { id: 104, title: "CASSETTE_PIN_SET",    artist: "TAPE_WARP",     price: 12.00, tag: "PINS" },
  { id: 105, title: "HOLOGRAPHIC_STICKER", artist: "ZERO_ONE",      price: 5.99,  tag: "STICKER" },
  { id: 106, title: "SYNTH_HOODIE",        artist: "GHOST_DATA",    price: 49.99, tag: "HOODIE" },
];

export const PLAYLIST: Track[] = [
  { title: "CYBER_SKYLINE_88", artist: "AESTHETIC_VOX",    duration: 225 },
  { title: "NEON_DREAMS_V2",   artist: "SYNTH_WIZARD",     duration: 198 },
  { title: "MIDNIGHT_RUN",     artist: "GHOST_DATA",        duration: 312 },
  { title: "VAPOR_SUNSET",     artist: "MACINTOSH_PLUS_X", duration: 267 },
  { title: "DATA_CORE_REDUX",  artist: "ZERO_ONE",          duration: 241 },
];

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
