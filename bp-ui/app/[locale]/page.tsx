"use client";

import { Navbar } from "@/app/components/features/Navbar";
import { Footer } from "@/app/components/features/Footer";
import Dither from "@/app/components/ui/dither/Dither";
import { useTranslations } from "use-intl";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <>
      <Navbar />
      <div className="relative w-full h-[800px]">
        <div className="absolute inset-0 z-0">
          <Dither
            waveColor={[1, 1, 0.7]}
            disableAnimation={false}
            enableMouseInteraction={true}
            mouseRadius={0.1}
            colorNum={4}
            waveAmplitude={0.4}
            waveFrequency={3}
            waveSpeed={0.02}
            pixelSize={2}
          />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <p className="font-vcr text-fear text-center text-4xl font-bold mb-4 p-3 rounded bg-darkblue">
             {t("title")}
          </p>
          <p className="font-vcr text-fearyellow text-center text-xl font-bold mb-4 p-3 rounded bg-darkblue">
            Welcome to my streaming platform <br/>
            asdasdasdasd
          </p>
          {/* 
          <GradientText
            colors={["#ed2c5e", "#253078", "#ed2c5e", "#ed2c5e", "#253078"]}
            animationSpeed={10}
            showBorder={false}
            className="text-5xl font-bold font-fear border-none rounded-0 p-3 rounded bg-darkblue"
          >
            WilloSphere
          </GradientText> 
          */}
        </div>
      </div>
      <main className="flex min-h-screen flex-col">
      </main>
      <Footer />
    </>
  );
}