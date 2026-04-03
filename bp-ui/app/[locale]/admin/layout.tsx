"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useTranslations } from "use-intl";
import { getRoleRedirect } from "@/lib/auth";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { ArrowBigLeft, Users, AudioLines, Disc3, Barcode, Package, ListMusic, Mic2, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/hooks";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const t                       = useTranslations("Admin");
  const { session, isHydrated } = useAuth();
  const router                  = useRouter();
  const { locale }              = useParams<{ locale: string }>();
  const { isDark, toggle }      = useTheme();

  useEffect(() => {
    if(!isHydrated)
      return;

    const target = getRoleRedirect(session?.user ?? null, locale);

    if(target !== `/${locale}/admin`) {
      router.replace(target);
    }
  }, [session, isHydrated, router, locale]);

  if(!isHydrated)
    return null;

  return (


    <div className="drawer lg:drawer-open min-h-screen bg-base-100">
      <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content bg-base-100">

        <nav className="navbar w-full bg-base-300">
          <div className="flex-1">
            <Link
              href={`/${locale}/admin`}
              className="px-4 font-fear text-lg font-bold"
            >
              {t("header")}
            </Link>
          </div>
          <div className="flex-none">
            <button
              onClick={toggle}
              className="btn btn-ghost btn-circle"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </nav>
        <div className="p-3">
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </div>

      <div className="drawer-side is-drawer-close:overflow-visible">
        <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
        <div className="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-40 is-drawer-open:w-100">

          <ul className="menu w-full grow gap-2">
            <li>
              <Link
                href={`/${locale}`}>
                <div className="flex items-center ps-3 h-14">
                  <ArrowBigLeft size={20} />
                  <span className="link">{t("home")}</span>
                </div>
              </Link>
            </li>

            <li>
              <Link
                href={`/${locale}/admin/users`}
                title={t("users")}
              >
                <Users size={20} />
                {t("users")}
              </Link>
            </li>

            <li className="border-b-1 pb-1">
              <Link
                href={`/${locale}/admin/artists`}
                title={t("artists")}
              >
                <Mic2 size={20} />
                {t("artists")}
              </Link>
            </li>

            <li className="border-t-1 pt-1">
              <Link
                href={`/${locale}/admin/tracks`}>
                <AudioLines  size={20} />
                {t("tracks")}
              </Link>
            </li>

            <li className="">
              <Link
                href={`/${locale}/admin/albums`}>
                <Disc3  size={20} />
                {t("albums")}
              </Link>
            </li>

            <li className="border-b-1 pb-1">
              <Link
                href={`/${locale}/admin/playlists`}>
                <ListMusic  size={20} />
                {t("playlists")}
              </Link>
            </li>

            <li className="border-t-1 pt-1">
              <Link
                href={`/${locale}/admin/products`}>
                <Barcode  size={20} />
                {t("products")}
              </Link>
            </li>

            <li  className="">
              <Link
                href={`/${locale}/admin/orders`}>
                <Package  size={20} />
                {t("orders")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>

  );
}


