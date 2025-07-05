import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Particle = {
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  delay: number;
};

export default function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated = [...Array(30)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: Math.floor(Math.random() * 80) + 20,
      height: Math.floor(Math.random() * 4) + 2,
      color: Math.random() > 0.5 ? "#ed2c5e" : "#253078",
      delay: Math.random() * 3,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="pointer-events-none absolute top-[100px] right-0 left-0 z-10 h-[calc(100vh-100px)] overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: `${p.width}px`,
            height: `${p.height}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            backgroundColor: p.color,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            x: [-10, 10, -10],
            scaleX: [1, 1.5, 1],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
