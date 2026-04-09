"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RainEffect } from "./RainEffect";
import { StormEffect } from "./StormEffect";
import { DroughtEffect } from "./DroughtEffect";
import { useGameStore } from "@/store/gameStore";
import { WEATHER_TIPS } from "./WeatherManager";
import { useState } from "react";

type WeatherOverlayProps = {
  suppressUi?: boolean;
};

export const WeatherOverlay = ({ suppressUi = false }: WeatherOverlayProps) => {
  const {
    currentWeather,
    weatherIntensity,
    player,
    activeStormEmergency,
  } = useGameStore();
  const [dismissedTips, setDismissedTips] = useState<Record<string, boolean>>({});

  const tipKey = `${player.currentDay}-${currentWeather}`;

  const showTip = !suppressUi && currentWeather !== "none" && !dismissedTips[tipKey];
  const tip = WEATHER_TIPS[currentWeather as keyof typeof WEATHER_TIPS];
  const stormEmergencySummary =
    currentWeather === "storm" && activeStormEmergency
      ? `Emergency charge applied: \u20b9${activeStormEmergency.cost} (Wallet: \u20b9${activeStormEmergency.fromWallet}, Savings: \u20b9${activeStormEmergency.fromSavings}${
          activeStormEmergency.deficit > 0
            ? `, Debt: \u20b9${activeStormEmergency.deficit}`
            : ""
        }).`
      : null;

  const weatherImpactText =
    currentWeather === "rain"
      ? "Loss today: ₹0"
      : currentWeather === "drought"
        ? "Loss today: 60% of each watering earning"
        : currentWeather === "storm"
          ? `Loss today: ₹${activeStormEmergency?.cost ?? 80} immediate shock`
          : "";

  return (
    <>
      {/* Weather effects */}
      <RainEffect
        intensity={weatherIntensity}
        isActive={currentWeather === "rain" || currentWeather === "storm"}
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
            className="fixed top-12 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-md">
              <h3 className="font-bold text-lg mb-2">{tip.title}</h3>
              <p className="text-sm mb-4">{tip.message}</p>
              {stormEmergencySummary && (
                <p className="text-xs mb-4 rounded-md bg-black/20 px-3 py-2">
                  {stormEmergencySummary}
                </p>
              )}
              <button
                onClick={() =>
                  setDismissedTips((prev) => ({
                    ...prev,
                    [tipKey]: true,
                  }))
                }
                className="bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition-colors"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!suppressUi && currentWeather === "drought" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-6 left-1/2 z-50 w-[min(90vw,420px)] -translate-x-1/2"
          >
            <div className="rounded-3xl border border-white/40 bg-white/90 p-5 shadow-2xl backdrop-blur-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.15em] text-slate-500">
                      Active Event
                    </p>
                    <h4 className="text-xl font-bold text-slate-900">
                      {currentWeather === "rain" && "Rain Day"}
                      {currentWeather === "drought" && "Drought Day"}
                    </h4>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {currentWeather === "rain" &&
                    "Rain has no earning change today. Keep steady habits."}
                  {currentWeather === "drought" &&
                    "Drought is a challenge day. Earnings are reduced by 60%, but all investments remain open."}
                </p>
                <p className="text-sm font-bold text-slate-800">{weatherImpactText}</p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {currentWeather === "drought" ? (
                    <div className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                      Drought cannot be cleared with money
                    </div>
                  ) : (
                    <div className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                      Rain is neutral today
                    </div>
                  )}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Wallet: ₹{player.wallet}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
