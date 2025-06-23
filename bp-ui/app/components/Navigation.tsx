import { useTranslations } from "next-intl";
import LocaleSwitcher from "./LocaleSwitcher";
import Link from "next/link";

export default function Navigation() {
  const t = useTranslations("Navigation");

  return (
    <div className="bg-slate-850">
      <nav className="container flex justify-between p-2 text-white">
        <div>
          <Link href="/">{t("home")} home</Link>
          <Link href="/pathnames">{t("pathnames")} pathnames</Link>
        </div>
        <LocaleSwitcher />
      </nav>
    </div>
  );
}
