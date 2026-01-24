"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/components/auth/AuthProvider";
import LocaleSwitcher from "@/app/components/locale/LocaleSwitcher";

export const Navbar = () => {
  const { locale }          = useParams<{ locale: string }>();
  const { session, logout } = useAuth();
  const userName            = session?.user.displayName ?? "Guest";
  const tNavbar             = useTranslations("Navbar");

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
          placeholder={`${tNavbar("search")}`}
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
            {session ? (
              <li>
                <button type="button" onClick={logout}>
                  {tNavbar("logout")}
                </button>
              </li>
            ) : (
              <>
                <li>
                  <Link href={`/${locale}/signup`}>{tNavbar("signup")}</Link>
                </li>
                <li>
                  <Link href={`/${locale}/login`}>{tNavbar("login")}</Link>
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
