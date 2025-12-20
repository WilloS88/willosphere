import Image from "next/image";
import { Twitter, Facebook, Youtube } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="footer items-center sm:footer-horizontal bg-neutral text-neutral-content  p-4">
      <aside className="grid-flow-col items-center">
        <Image
        src="/logo.png"
        alt="Logo firmy"
        width={75}              
        height={75}             
      />
        <p>Copyright © {new Date().getFullYear()} - All rights reserved</p>
      </aside>
      <nav className="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
        <a>
          <Twitter
            size={30}
          />
        </a>
        <a>
          <Youtube
            size={30}
          />
        </a>
        <a>
          <Facebook
            size={30}
          />
        </a>
      </nav>
    </footer>
  );
};
