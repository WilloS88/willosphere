"use client";

import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useTranslations } from "use-intl";
import WilloSphere from "../components/ui/Header";

export default function Home() {
  const t = useTranslations("HomePage")

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col">
        test
        <p className="font-vcr text-fear text-center text-4xl font-bold">
          {t("title")}
        </p>
        <WilloSphere />
      </main>
      <Footer />
    </>
  );
}
