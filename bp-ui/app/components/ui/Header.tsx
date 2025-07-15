"use client";

import { motion } from "framer-motion";
import FloatingParticles from "../motion/FloatingParticles";

export default function WilloSphere() {
  return (
    <div className="justify- mt-5 flex min-h-screen flex-col items-center gap-8">
      {/* Rotating Globe */}
      <motion.div
        className="text-center"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      >
        <motion.h1
          className="text-6xl font-bold"
          style={{
            background: "linear-gradient(45deg, #ed2c5e, #253078, #ed2c5e)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <span className="font-fear">WilloSphere</span>
        </motion.h1>
        <motion.p
          className="mt-4 text-xl"
          style={{ color: "#253078" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          Open source, Open sound
        </motion.p>
      </motion.div>

      <motion.div
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <motion.svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          className="drop-shadow-2xl"
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          {/* Globe base */}
          <defs>
            <radialGradient id="globeGradient" cx="0.3" cy="0.3">
              {/* <stop offset="0%" stopColor="#253078" /> */}
              <stop offset="0%" stopColor="#ed2c5e" />
              <stop offset="100%" stopColor="#0b0f2d" />
            </radialGradient>
            <radialGradient id="glowGradient" cx="0.5" cy="0.5">
              <stop offset="0%" stopColor="#ed2c5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ed2c5e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer glow */}
          <circle cx="150" cy="150" r="160" fill="url(#glowGradient)" />

          {/* Main globe */}
          <circle
            cx="150"
            cy="150"
            r="120"
            fill="url(#globeGradient)"
            stroke="#253078"
            strokeWidth="2"
          />

          {/* Longitude lines */}
          <g stroke="#253078" strokeWidth="1" fill="none" opacity="0.8">
            <ellipse cx="150" cy="150" rx="120" ry="120" />
            <ellipse cx="150" cy="150" rx="100" ry="120" />
            <ellipse cx="150" cy="150" rx="80" ry="120" />
            <ellipse cx="150" cy="150" rx="60" ry="120" />
            <ellipse cx="150" cy="150" rx="40" ry="120" />
            <ellipse cx="150" cy="150" rx="20" ry="120" />
          </g>

          {/* Latitude lines */}
          <g stroke="#253078" strokeWidth="1" fill="none" opacity="0.8">
            <line x1="30" y1="150" x2="270" y2="150" />
            <ellipse cx="150" cy="150" rx="120" ry="90" />
            <ellipse cx="150" cy="150" rx="120" ry="60" />
            <ellipse cx="150" cy="150" rx="120" ry="30" />
          </g>

          {/* Highlight/shine effect */}
          <ellipse
            cx="120"
            cy="100"
            rx="30"
            ry="40"
            fill="#ffffff"
            opacity="0.3"
          />
        </motion.svg>
      </motion.div>

      {/* WilloSphere Title */}
      {/* <motion.div
        className="text-center"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      >
        <motion.h1
          className="text-6xl font-bold"
          style={{
            background: "linear-gradient(45deg, #ed2c5e, #253078, #ed2c5e)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <span className="font-fear">WilloSphere</span>
        </motion.h1>
        <motion.p
          className="mt-4 text-xl"
          style={{ color: "#253078" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          Open source, Open sound
        </motion.p>
      </motion.div> */}

      <FloatingParticles />
    </div>
  );
}
