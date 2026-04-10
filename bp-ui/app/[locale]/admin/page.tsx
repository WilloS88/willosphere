"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Users,
  AudioLines,
  Disc3,
  ListMusic,
  Barcode,
  Package,
  TrendingUp,
  Mic2,
  ChevronRight,
  Headphones,
  DollarSign,
  Heart,
  UserPlus,
  ShoppingCart,
  Clock,
} from "lucide-react";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/app/api/enpoints";

type RecentActivityItem = {
  type: "listen" | "signup" | "purchase";
  userName: string;
  detail?: string | null;
  orderId?: number | null;
  timestamp: string;
};

type AdminStats = {
  totalUsers:             number;
  totalArtists:           number;
  totalTracks:            number;
  totalAlbums:            number;
  totalPlaylists:         number;
  totalOrders:            number;
  totalRevenue:           number;
  streamsToday:           number;
  donationPoolThisMonth:  number;
  donationCountThisMonth: number;
  totalDonorsThisMonth:   number;
  recentActivity: RecentActivityItem[];
};

type QuickCard = {
  key:    string;
  href:   (locale: string) => string;
  icon:   React.ReactNode;
  color:  string;
};

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);

  if(mins < 1)
    return "just now";
  if(mins < 60)
    return `${mins}m ago`;

  const hours = Math.floor(mins / 60);

  if(hours < 24)
    return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const activityIcon = (type: RecentActivityItem["type"]) => {
  switch (type) {
    case "listen":
      return <Headphones size={14} className="text-primary" />;
    case "signup":
      return <UserPlus size={14} className="text-success" />;
    case "purchase":
      return <ShoppingCart size={14} className="text-warning" />;
  }
};

const activityBadgeClass = (type: RecentActivityItem["type"]) => {
  switch (type) {
    case "listen":
      return "badge badge-primary badge-xs";
    case "signup":
      return "badge badge-success badge-xs";
    case "purchase":
      return "badge badge-warning badge-xs";
  }
};

export default function AdminPage() {
  const t           = useTranslations("Admin");
  const { locale }  = useParams<{ locale: string }>();

  const [stats, setStats]     = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<AdminStats>(API_ENDPOINTS.adminStats.stats)
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const quickCards: QuickCard[] = [
    { key: "users",     href: (l) => `/${l}/admin/users`,     icon: <Users size={20} />,     color: "text-primary" },
    { key: "tracks",    href: (l) => `/${l}/admin/tracks`,    icon: <AudioLines size={20} />, color: "text-secondary" },
    { key: "albums",    href: (l) => `/${l}/admin/albums`,    icon: <Disc3 size={20} />,      color: "text-accent" },
    { key: "playlists", href: (l) => `/${l}/admin/playlists`, icon: <ListMusic size={20} />,   color: "text-info" },
    { key: "products",  href: (l) => `/${l}/admin/products`,  icon: <Barcode size={20} />,     color: "text-warning" },
    { key: "orders",    href: (l) => `/${l}/admin/orders`,    icon: <Package size={20} />,     color: "text-error" },
  ];

  const kpiCards = stats
    ? [
        {
          label: t("kpi.activeUsers"),
          value: stats.totalUsers,
          icon: <Users size={22} className="text-primary" />,
          desc: `${stats.totalArtists} ${t("artists").toLowerCase()}`,
        },
        {
          label: t("kpi.streamsToday"),
          value: stats.streamsToday,
          icon: <TrendingUp size={22} className="text-success" />,
          desc: t("kpi.streamsTodayHint"),
        },
        {
          label: t("totalOrders"),
          value: stats.totalOrders,
          icon: <Package size={22} className="text-warning" />,
          desc: `${stats.totalRevenue.toLocaleString()} CZK ${t("totalRevenue")}`,
        },
        {
          label: t("kpi.donationPool"),
          value: `${stats.donationPoolThisMonth.toLocaleString()} CZK`,
          icon: <Heart size={22} className="text-error" />,
          desc: t("kpi.donationPoolHint"),
        },
        {
          label: t("kpi.totalDonors"),
          value: stats.totalDonorsThisMonth,
          icon: <DollarSign size={22} className="text-accent" />,
          desc: `${stats.donationCountThisMonth} ${t("totalOrders").toLowerCase()}`,
        },
      ]
    : [];

  const entityCounts = stats
    ? [
        { label: t("tracks"),    value: stats.totalTracks,    icon: <AudioLines size={18} />, color: "text-secondary" },
        { label: t("albums"),    value: stats.totalAlbums,    icon: <Disc3 size={18} />,      color: "text-accent" },
        { label: t("playlists"), value: stats.totalPlaylists, icon: <ListMusic size={18} />,   color: "text-info" },
        { label: t("artists"),   value: stats.totalArtists,   icon: <Mic2 size={18} />,        color: "text-primary" },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="h-14 bg-base-100 border-b border-base-300 flex items-center justify-between px-6 rounded-sm">
        <div className="font-semibold flex items-center gap-2 text-lg">
          {t("welcome")}
        </div>
      </header>

      <main className="p-4 flex-1 overflow-auto space-y-4">

        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {kpiCards.map((kpi, i) => (
            <div key={i} className="stat bg-base-100 border border-base-300 rounded-box shadow-sm">
              <div className="stat-figure">{kpi.icon}</div>
              <div className="stat-title text-base-content/60">{kpi.label}</div>
              <div className="stat-value text-2xl">{kpi.value.toLocaleString()}</div>
              <div className="stat-desc text-base-content/50">{kpi.desc}</div>
            </div>
          ))}
        </div>

        {/* Entity overview mini-stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {entityCounts.map((ec, i) => (
            <div key={i} className="flex items-center gap-3 bg-base-100 border border-base-300 rounded-box px-4 py-3 shadow-sm">
              <div className={`${ec.color}`}>{ec.icon}</div>
              <div>
                <div className="text-xl font-bold">{ec.value.toLocaleString()}</div>
                <div className="text-xs text-base-content/50">{ec.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <h2 className="card-title text-base">{t("quickActions")}</h2>
              <span className="text-xs text-base-content/50">{t("quickActionsHint")}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {quickCards.map((c) => (
                <Link
                  key={c.key}
                  href={c.href(locale)}
                  className="card bg-base-200 hover:bg-base-300 transition-all hover:shadow-md border border-base-300"
                >
                  <div className="card-body p-4 flex flex-row items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-base-100 border border-base-300 flex items-center justify-center ${c.color}`}>
                      {c.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{t(`nav.${c.key}`)}</div>
                      <div className="text-xs text-base-content/50">{t(`nav.${c.key}Hint`)}</div>
                    </div>
                    <ChevronRight size={14} className="text-base-content/30" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body p-4">
            <h2 className="card-title text-base">{t("recentActivity")}</h2>
            <div className="divider my-1" />

            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <ul className="space-y-2">
                {stats.recentActivity.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg bg-base-200 px-3 py-2.5">
                    <div className="flex-shrink-0">{activityIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">
                        {item.type === "listen" && t("activityListen", { user: item.userName, track: item.detail ?? "" })}
                        {item.type === "signup" && t("activitySignup", { user: item.userName })}
                        {item.type === "purchase" && t("activityPurchase", { user: item.userName, amount: item.detail ?? "", orderId: item.orderId ?? 0 })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={activityBadgeClass(item.type)}>{item.type}</span>
                      <span className="text-xs text-base-content/40 flex items-center gap-1">
                        <Clock size={10} />
                        {relativeTime(item.timestamp)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-base-content/40 py-4 text-center">
                {t("noActivity")}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
