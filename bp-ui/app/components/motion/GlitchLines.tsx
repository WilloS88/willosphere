"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Line = {
  top: number;
  width: number;
  color: string;
  delay: number;
  duration: number;
  blur: boolean;
};

export default function GlitchLines() {
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 40 }, () => ({
      top: Math.random() * 100,
      width: Math.random() * 80 + 20, // 20–100%
      color: ["#ed2c5e", "#253078", "#00f7ff", "#ffffff"][
        Math.floor(Math.random() * 4)
      ],
      delay: Math.random() * 3,
      duration: Math.random() * 1.5 + 1,
      blur: Math.random() > 0.7,
    }));
    setLines(generated);
  }, []);

  return (
    <div className="pointer-events-none absolute top-[100px] right-0 left-0 z-10 h-[calc(100vh-100px)] overflow-hidden mix-blend-screen">
      {lines.map((line, i) => (
        <motion.div
          key={i}
          className={`absolute h-[1px] ${line.blur ? "blur-sm" : ""}`}
          style={{
            top: `${line.top}%`,
            width: `${line.width}%`,
            backgroundColor: line.color,
            left: `${Math.random() * 100}%`,
            opacity: 0.6,
          }}
          animate={{
            x: [-5, 5, -5],
            opacity: [0, 0.8, 0.2, 0.6, 0],
          }}
          transition={{
            duration: line.duration,
            delay: line.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
