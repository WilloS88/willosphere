import Image from "next/image";
import Link from "next/link";
import { Sun, Moon } from 'lucide-react';
import { useTranslations } from "next-intl";

export const Footer = () => {
  const t = useTranslations("Footer");
  
  return (
    <footer className="footer items-center sm:footer-horizontal bg-neutral text-neutral-content  p-4">
      <aside className="grid-flow-col items-center">
        <Image
        src="/logo.png"
        alt="Logo firmy"
        width={75}
        height={75}
      />
        <p className="text-fear font-fear">Copyright © {new Date().getFullYear()} - All rights reserved</p>
      </aside>
      <nav className="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
        <Link
          href="/"
          title={`${t("twitter")}`}
        >
        </Link>
        <Link
          href="/"
          title={`${t("youtube")}`}
        >
        </Link>
        <Link
          href="/"
          title={`${t("facebook")}`}
        >
        </Link>
      </nav>
      <label className="flex cursor-pointer gap-2">
        <Sun />
        <input type="checkbox" value="synthwave" className="toggle theme-controller" />
        <Moon />
      </label>
    </footer>
  );
};
