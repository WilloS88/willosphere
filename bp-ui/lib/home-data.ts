import { createElement } from "react";
import { LayoutGrid, TrendingUp, Sparkles, Radio, Users, ShoppingBag, Disc, Disc3, ListMusic, CalendarDays, Settings } from "lucide-react";
import type { StoreNavItem } from "./store-data";

export const HOME_NAV_ITEMS: StoreNavItem[] = [
  { id: "browse",    icon: createElement(LayoutGrid,  { size: 15 }), label: "BROWSE_ALL",  href: "/home" },
  { id: "charts",    icon: createElement(TrendingUp,  { size: 15 }), label: "TOP_CHARTS",  href: "/home/charts" },
  { id: "new",       icon: createElement(Sparkles,    { size: 15 }), label: "NEW_DROPS",   href: "/home/new-drops" },
  { id: "radio",     icon: createElement(Radio,       { size: 15 }), label: "RADIO_MIX",   href: "/home/radio" },
  { id: "artists",   icon: createElement(Users,       { size: 15 }), label: "ARTISTS",     href: "/home/artists" },
  { id: "albums",    icon: createElement(Disc3,       { size: 15 }), label: "ALBUMS",      href: "/home/albums" },
  { id: "playlists", icon: createElement(ListMusic,   { size: 15 }), label: "PLAYLISTS",   href: "/home/playlists" },
  { id: "merch",     icon: createElement(ShoppingBag, { size: 15 }), label: "MERCH_SHOP",  href: "/home/merch" },
  { id: "vinyl",     icon: createElement(Disc,        { size: 15 }), label: "VINYL_STORE", href: "/home/vinyl" },
  { id: "events",    icon: createElement(CalendarDays,{ size: 15 }), label: "LIVE_EVENTS", href: "/home/events" },
  { id: "profile",   icon: createElement(Settings,    { size: 15 }), label: "PROFILE",     href: "/home/profile" },
];
