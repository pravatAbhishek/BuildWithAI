"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RainEffect } from "./RainEffect";
import { StormEffect } from "./StormEffect";
import { DroughtEffect } from "./DroughtEffect";
import { useGameStore } from "@/store/gameStore";
import { WEATHER_TIPS } from "./WeatherManager";
import { useEffect, useState } from "react";

export const WeatherOverlay = () => {
  const { currentWeather, weatherIntensity } = useGameStore();
  const [showTip, setShowTip] = useState(false);
  const [tipSeen, setTipSeen] = useState<string | null>(null);

  useEffect(() => {
    if (currentWeather !== "none" && tipSeen !== currentWeather) {
      setShowTip(true);
      setTipSeen(currentWeather);
    }
  }, [currentWeather, tipSeen]);

  const tip =
    WEATHER_TIPS[
      currentWeather as keyof typeof WEATHER_TIPS
    ];

  return (
    <>
      {/* Weather effects */}
      <RainEffect
        intensity={weatherIntensity}
        isActive={currentWeather === "rain"}
      />
      <StormEffect
        intensity={weatherIntensity}
        isActive={currentWeather === "storm"}
      />
      <DroughtEffect
        intensity={weatherIntensity}
        isActive={currentWeather === "drought"}
      />

      {/* Weather tip notification */}
      <AnimatePresence>
        {showTip && tip && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-md">
              <h3 className="font-bold text-lg mb-2">{tip.title}</h3>
              <p className="text-sm mb-4">{tip.message}</p>
              <button
                onClick={() => setShowTip(false)}
                className="bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition-colors"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
