"use client";

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
  Activity,
  ShieldCheck,
  RefreshCcw,
  ChevronRight,
} from "lucide-react";

type QuickCard = {
  key: string;
  href: (locale: string) => string;
  icon: React.ReactNode;
};

export default function AdminPage() {
  const t = useTranslations("Admin");
  const { locale } = useParams<{ locale: string }>();

  const quickCards: QuickCard[] = [
    {
      key: "users",
      href: (l) => `/${l}/admin/users`,
      icon: <Users size={20} />,
    },
    {
      key: "tracks",
      href: (l) => `/${l}/admin/tracks`,
      icon: <AudioLines size={20} />,
    },
    {
      key: "albums",
      href: (l) => `/${l}/admin/albums`,
      icon: <Disc3 size={20} />,
    },
    {
      key: "playlists",
      href: (l) => `/${l}/admin/playlists`,
      icon: <ListMusic size={20} />,
    },
    {
      key: "products",
      href: (l) => `/${l}/admin/products`,
      icon: <Barcode size={20} />,
    },
    {
      key: "orders",
      href: (l) => `/${l}/admin/orders`,
      icon: <Package size={20} />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <header className="h-14 bg-white border-b flex items-center justify-between px-6 rounded-sm">
        <div className="font-semibold flex items-center gap-2 text-lg">
          {t("welcome")}
        </div>
      </header>

      <main className="p-4 flex-1 overflow-auto space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="card bg-white border shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-70">{t("kpi.activeUsers")}</span>
                <Activity size={18} />
              </div>
              <div className="text-3xl font-bold mt-2">—</div>
              <div className="text-xs opacity-60">{t("kpi.activeUsersHint")}</div>
            </div>
          </div>

          <div className="card bg-white border shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-70">{t("kpi.streamsToday")}</span>
                <TrendingUp size={18} />
              </div>
              <div className="text-3xl font-bold mt-2">—</div>
              <div className="text-xs opacity-60">{t("kpi.streamsTodayHint")}</div>
            </div>
          </div>

          <div className="card bg-white border shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-70">{t("kpi.pendingOrders")}</span>
                <Package size={18} />
              </div>
              <div className="text-3xl font-bold mt-2">—</div>
              <div className="text-xs opacity-60">{t("kpi.pendingOrdersHint")}</div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card bg-white border shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("quickActions")}</h2>
              <span className="text-xs opacity-60">{t("quickActionsHint")}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {quickCards.map((c) => (
                <Link
                  key={c.key}
                  href={c.href(locale)}
                  className="card bg-base-200 hover:bg-base-300 transition-colors border border-base-300"
                >
                  <div className="card-body p-4 flex flex-row items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center">
                      {c.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{t(`nav.${c.key}`)}</div>
                      <div className="text-xs opacity-70">{t(`nav.${c.key}Hint`)}</div>
                    </div>
                    <ChevronRight size={14} className="opacity-60" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="card bg-white border shadow-sm">
            <div className="card-body p-4">
              <h2 className="text-lg font-bold">{t("recentActivity")}</h2>
              <div className="divider my-2" />

              <ul className="text-sm space-y-2">
                <li className="flex items-start justify-between gap-4">
                  <span className="opacity-80">{t("activity.placeholder1")}</span>
                  <span className="text-xs opacity-60">{t("activity.now")}</span>
                </li>
                <li className="flex items-start justify-between gap-4">
                  <span className="opacity-80">{t("activity.placeholder2")}</span>
                  <span className="text-xs opacity-60">{t("activity.minutesAgo", { n: 12 })}</span>
                </li>
                <li className="flex items-start justify-between gap-4">
                  <span className="opacity-80">{t("activity.placeholder3")}</span>
                  <span className="text-xs opacity-60">{t("activity.hoursAgo", { n: 3 })}</span>
                </li>
              </ul>

              <div className="mt-3 text-xs opacity-60">
                {t("recentActivityHint")}
              </div>
            </div>
          </div>

          <div className="card bg-white border shadow-sm">
            <div className="card-body p-4">
              <h2 className="text-lg font-bold">{t("systemStatus")}</h2>
              <div className="divider my-2" />

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
                  <span className="opacity-80">{t("status.api")}</span>
                  <span className="badge badge-success">{t("status.ok")}</span>
                </div>

                <div className="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
                  <span className="opacity-80">{t("status.db")}</span>
                  <span className="badge badge-success">{t("status.ok")}</span>
                </div>

                <div className="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
                  <span className="opacity-80">{t("status.storage")}</span>
                  <span className="badge badge-warning">{t("status.degraded")}</span>
                </div>
              </div>

              <div className="mt-3">
                <Link href={`/${locale}/admin/users`} className="btn btn-sm btn-neutral">
                  {t("manageUsers")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}