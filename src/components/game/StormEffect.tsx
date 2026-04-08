"use client";

import { motion, AnimatePresence } from "framer-motion";

interface StormEffectProps {
  intensity: number; // 0-100
  isActive: boolean;
}

export const StormEffect = ({ intensity, isActive }: StormEffectProps) => {
  const shakeAmount = (intensity / 100) * 8; // Up to 8px shake

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Dark storm overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-gray-800 pointer-events-none z-10"
          />

          {/* Lightning flashes */}
          <motion.div
            animate={{
              opacity: [0, 0.8, 0, 0.6, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              times: [0, 0.2, 0.3, 0.5, 1],
            }}
            className="fixed inset-0 bg-yellow-100 pointer-events-none z-15"
          />

          {/* Wind effect - horizontal streaks */}
          <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={`wind-${i}`}
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1 + (i % 2) * 0.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.3,
                }}
                className="absolute h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                style={{
                  top: `${20 + i * 15}%`,
                  width: "200%",
                  height: "2px",
                }}
              />
            ))}
          </div>

          {/* Screen shake effect container - affects entire viewport */}
          <motion.div
            animate={{
              x: [0, -shakeAmount, shakeAmount, -shakeAmount, 0],
              y: [0, 0, -shakeAmount / 2, shakeAmount / 2, 0],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
            className="fixed inset-0 pointer-events-none z-5"
            style={{ transformOrigin: "center center" }}
          />

          {/* Falling debris */}
          <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={`debris-${i}`}
                initial={{ y: -50, rotate: 0 }}
                animate={{
                  y: "100vh",
                  rotate: 360 + Math.random() * 360,
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.8,
                }}
                className="absolute w-2 h-2 bg-green-600 rounded-full opacity-60"
                style={{ left: `${20 + i * 30}%` }}
              />
            ))}
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
