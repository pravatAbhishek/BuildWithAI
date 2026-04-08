"use client";

import { motion, AnimatePresence } from "framer-motion";

interface DroughtEffectProps {
  intensity: number; // 0-100
  isActive: boolean;
}

export const DroughtEffect = ({ intensity, isActive }: DroughtEffectProps) => {
  const desaturation = (intensity / 100) * 70; // Up to 70% desaturation

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Soil-colored overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: intensity / 150 }} // Max 0.67 opacity
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-amber-900 pointer-events-none z-10"
          />

          {/* Dust/sand particles floating */}
          <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={`dust-${i}`}
                initial={{
                  y: Math.random() > 0.5 ? -20 : window.innerHeight,
                  x: Math.random() * 100 + "%",
                  opacity: 0,
                }}
                animate={{
                  y: Math.random() > 0.5 ? window.innerHeight : -20,
                  x: `calc(${Math.random() * 100}% + ${Math.sin(i) * 50}px)`,
                  opacity: [0, 0.4, 0],
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 2,
                }}
                className="absolute w-2 h-2 bg-amber-700 rounded-full"
              />
            ))}
          </div>

          {/* Cracked soil pattern */}
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: intensity / 200 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-full h-full pointer-events-none z-15"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id="cracks"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 5,0 Q 10,5 5,10 L 15,10 Q 10,15 15,20"
                  stroke="#b45309"
                  strokeWidth="0.2"
                  fill="none"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#cracks)" />
          </motion.svg>

          {/* Desaturation effect on entire screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: intensity / 200 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-12"
            style={{
              background: `linear-gradient(135deg, rgba(217, 119, 6, 0.3), rgba(180, 83, 9, 0.3))`,
            }}
          />

          {/* Faded sun - heatwave effect */}
          <motion.div
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
            className="fixed top-10 right-10 w-24 h-24 bg-yellow-600 rounded-full pointer-events-none z-5 blur-2xl"
          />
        </>
      )}
    </AnimatePresence>
  );
};
