"use client";

import Link from "next/link";
import LocaleSwitcher from "../locale/LocaleSwitcher";
import { useParams } from 'next/navigation';

export const Navbar = () => {
  const { locale } = useParams<{ locale: string }>();

  return (
    <div className="navbar bg-base-100 px-4 shadow-sm">
      <div className="navbar-start">
        <Link href="/">
          <img src="/logo.png" alt="logo" width={100} />
        </Link>
      </div>

      <div className="navbar-center">
        <input
          type="text"
          placeholder="Search"
          className="input input-bordered w-[350px]"
        />
      </div>
      <div className="navbar-end flex items-center gap-2">
        <div className="dropdown h-full">
          <div tabIndex={0} role="button" className="btn m-1">
            <div className="flex gap-2">
              <div className="avatar">
                <div className="rounded-full w-13">
                    <img src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp" />
                </div>
              </div>
              <div>
                <p>My WilloSphere</p>
                <p className="text-start">Log in</p>
              </div>
            </div>
          </div>
          <ul tabIndex="-1" className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
            <li>
              <Link href={`/${locale}/signup`}>Sign up</Link>
            </li>
            <li>
              <Link href={`/${locale}/login`}>Log in</Link>
            </li>
          </ul>
        </div>
        <LocaleSwitcher />
      </div>
    </div>
  );
};
