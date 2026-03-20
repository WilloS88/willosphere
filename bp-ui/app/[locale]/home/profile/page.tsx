"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { useStoreTheme } from "@/app/context/StoreThemeContext";
import {
  PageHeader,
  Badge,
  SectionLabel,
} from "@/app/components/ui/elastic-slider/StoreUI";

export default function ProfilePage() {
  const t            = useTranslations("Store");
  const { session }  = useAuth();
  const { isDark }   = useStoreTheme();
  const user         = session?.user;

  return (
    <>
      <PageHeader title={t("nav_profile")} count={1} />

      <div
        className={`max-w-2xl rounded border p-5 sm:p-8 ${
          isDark
            ? "bg-vhs-card border-royalblue/20"
            : "border-[#c4b8a8]/40 bg-white/80"
        }`}
      >
        {/* Avatar + name */}
        <div className="mb-6 flex items-center gap-4">
          <div className="from-fear to-vhs-purple border-fear/40 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-gradient-to-br text-2xl font-bold text-white sm:h-20 sm:w-20 sm:text-3xl">
            {user?.displayName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div
              className={`text-base font-bold tracking-[2px] sm:text-lg ${isDark ? "text-fearyellow" : "text-[#c4234e]"}`}
            >
              {user?.displayName ?? t("guestUser")}
            </div>
            <div
              className={`text-[10px] tracking-wider ${isDark ? "text-vhs-muted" : "text-[#8a8578]"}`}
            >
              {user?.email ?? "not@logged.in"}
            </div>
            <div className="mt-1.5 flex gap-1.5">
              {user?.roles?.map((r, i) => (
                <Badge key={i} variant="cyan" className="text-[8px]">
                  {typeof r === "string"
                    ? r.toUpperCase()
                    : r.role.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`space-y-3 border-t pt-4 ${isDark ? "border-royalblue/20" : "border-[#c4b8a8]/20"}`}
        >
          <SectionLabel>{t("accountInfo")}</SectionLabel>

          {[
            [t("idLabel"), user?.id ?? "—"],
            [t("emailLabel"), user?.email ?? "—"],
            [t("displayNameLabel"), user?.displayName ?? "—"],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className={`flex items-center justify-between rounded px-3 py-2 text-[11px] ${
                isDark ? "bg-royalblue/10" : "bg-[#ede7db]/60"
              }`}
            >
              <span className={isDark ? "text-vhs-muted" : "text-[#8a8578]"}>
                {label}
              </span>
              <span className={isDark ? "text-vhs-white" : "text-[#2a2520]"}>
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
