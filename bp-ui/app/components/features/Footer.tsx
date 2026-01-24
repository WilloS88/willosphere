import Image from "next/image";
import Link from "next/link";
import { Twitter, Facebook, Youtube } from "lucide-react";
import { useTranslations } from "next-intl";

export const Footer = () => {
  const tFooter = useTranslations("Footer");
  
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
          title={`${tFooter("twitter")}`}
        >
          <Twitter
            color="#f4e526"
            size={30}
          />
        </Link>
        <Link
          href="/"
          title={`${tFooter("youtube")}`}
        >
          <Youtube
            color="#f4e526"
            size={30}
          />
        </Link>
        <Link
          href="/"
          title={`${tFooter("facebook")}`}
        >
          <Facebook
            color="#f4e526"
            size={30}
          />
        </Link>
      </nav>
    </footer>
  );
};
