import { createElement } from "react";
import { LayoutGrid, TrendingUp, Sparkles, Radio, Users, ShoppingBag, Disc, Disc3, ListMusic, CalendarDays, Settings, ShoppingCart, Receipt } from "lucide-react";
import type { StoreNavItem } from "./store-data";

export const HOME_NAV_ITEMS: StoreNavItem[] = [
  { id: "browse",    icon: createElement(LayoutGrid,  { size: 15 }), label: "BROWSE_ALL",  href: "/home" },
  { id: "charts",    icon: createElement(TrendingUp,  { size: 15 }), label: "TOP_CHARTS",  href: "/home/charts" },
  { id: "new",       icon: createElement(Sparkles,    { size: 15 }), label: "NEW_DROPS",   href: "/home/new-drops" },
  { id: "artists",   icon: createElement(Users,       { size: 15 }), label: "ARTISTS",     href: "/home/artists" },
  { id: "albums",    icon: createElement(Disc3,       { size: 15 }), label: "ALBUMS",      href: "/home/albums" },
  { id: "playlists", icon: createElement(ListMusic,   { size: 15 }), label: "PLAYLISTS",   href: "/home/playlists" },
  { id: "merch",     icon: createElement(ShoppingBag,  { size: 15 }), label: "MERCH_SHOP",  href: "/home/merch" },
  { id: "cart",      icon: createElement(ShoppingCart, { size: 15 }), label: "CART",        href: "/home/cart" },
  { id: "orders",    icon: createElement(Receipt,      { size: 15 }), label: "ORDERS",      href: "/home/orders" },
  { id: "profile",   icon: createElement(Settings,     { size: 15 }), label: "PROFILE",     href: "/home/profile" },
];
