"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

const WEATHER_TIPS = {
  rain: {
    title: "💧 Rain Day",
    message: "Rain is neutral today. No earning bonus and no penalty (loss ₹0).",
    lessonKey: "rain-conservation",
  },
  drought: {
    title: "🏜️ Drought Day",
    message: "Drought cuts today earnings by 60%. Loss is 60% of each watering payout.",
    lessonKey: "drought-resilience",
  },
  storm: {
    title: "⛈️ Storm Alert!",
    message: "Storm applies immediate wallet loss of ₹80 and tree health stress for 2 days.",
    lessonKey: "storm-protection",
  },
};

export const WeatherManager = () => {
  const { player, triggerWeatherEvent } = useGameStore();
  const triggeredDayRef = useRef<number>(0);

  useEffect(() => {
    if (triggeredDayRef.current === player.currentDay) return;

    triggeredDayRef.current = player.currentDay;
    // Reduce weather event frequency by 50%: even days are clear weather.
    if (player.currentDay % 2 === 0) {
      triggerWeatherEvent("none");
      return;
    }

    const weatherDayIndex = Math.floor((player.currentDay - 1) / 2);
    const cycleIndex = weatherDayIndex % 3;
    const weather = cycleIndex === 0 ? "rain" : cycleIndex === 1 ? "storm" : "drought";
    triggerWeatherEvent(weather);
  }, [player.currentDay, triggerWeatherEvent]);

  return null;
};

export { WEATHER_TIPS };
