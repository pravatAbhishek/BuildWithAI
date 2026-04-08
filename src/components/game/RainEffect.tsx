"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface RainEffectProps {
  intensity: number; // 0-100
  isActive: boolean;
}

interface Raindrop {
  id: number;
  left: number;
  delay: number;
  duration: number;
}

export const RainEffect = ({ intensity, isActive }: RainEffectProps) => {
  const raindrops = useMemo(() => {
    const count = Math.floor((intensity / 100) * 50); // Up to 50 drops
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 0.8 + Math.random() * 0.4,
    }));
  }, [intensity]);

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Rain overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-blue-300 pointer-events-none z-10"
          />

          {/* Raindrops */}
          <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
            {raindrops.map((drop) => (
              <motion.div
                key={drop.id}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: "100vh", opacity: [0, 1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: drop.duration,
                  delay: drop.delay,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute w-1 h-4 bg-blue-400 rounded-full"
                style={{ left: `${drop.left}%` }}
              />
            ))}
          </div>

          {/* Rain sound effect (visual indicator) */}
          <motion.div
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className="fixed inset-0 pointer-events-none z-5 bg-gradient-to-b from-blue-200 to-transparent"
          />
        </>
      )}
    </AnimatePresence>
  );
};
