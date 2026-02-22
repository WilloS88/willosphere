"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/components/auth/AuthProvider";
import LocaleSwitcher from "@/app/components/locale/LocaleSwitcher";
import { Shield, LogIn, LogOut, UserPlus } from "lucide-react";

export const Navbar = () => {
  const t                   = useTranslations("Navbar");
  const { locale }          = useParams<{ locale: string }>();
  const { session, logout } = useAuth();
  const userName            = session?.user.displayName ?? "Guest";
  const isAdmin             = session?.user.roles?.some((r) => r === "admin");

  return (
    <div className="navbar bg-base-100 px-4 shadow-sm">
      <div className="navbar-start">
        <Link href="/">
          <Image src="/logo.png" alt="logo" width={100} height={40} priority />
        </Link>
      </div>

      <div className="navbar-center">
        <input
          type="text"
          placeholder={`${t("search")}`}
          className="input input-bordered w-[350px]"
        />
      </div>
      <div className="navbar-end flex items-center gap-2">
        <div className="dropdown h-full">
          <div tabIndex={0} role="button" className="btn m-1">
            <div className="flex items-center gap-2">
              <div className="avatar">
                <div className="w-13 rounded-full">
                  <img
                    src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp"
                    alt="cat"
                  />
                </div>
              </div>
              <div>
                <p>{userName}</p>
              </div>
            </div>
          </div>
          <ul
            tabIndex={-1}
            className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
          >
            {
            isAdmin
              ? (
              <li>
                <Link href={`/${locale}/admin`}>
                  <Shield size={20} />
                  {t("adminDashboard")}
                </Link>
              </li>)
              : null
            }
            {session
              ? (
              <li>
                <button type="button" onClick={logout}>
                  <LogOut size={20} />
                  {t("logout")}
                </button>
              </li>
            ) : (
              <>
                <li>
                  <Link href={`/${locale}/signup`}>
                    <UserPlus size={20} />
                    {t("signup")}
                  </Link>

                </li>
                <li>
                  <Link href={`/${locale}/login`}>
                    <LogIn size={20} />
                    {t("login")}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
        <LocaleSwitcher />
      </div>
    </div>
  );
};
