import Link from "next/link";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/app/components/locale/LocaleSwitcher";

export default function Navigation() {
  const t = useTranslations("Navigation");

  return (
    <div className="bg-darkblue">
      <nav className="container flex justify-between p-2 text-white">
        <div>
          <Link href="/">{t("home")} home</Link>
          <Link href="/pathnames">{t("pathnames")}</Link>
        </div>
        <LocaleSwitcher />
      </nav>
    </div>
  );
}
