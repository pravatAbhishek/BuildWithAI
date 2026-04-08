"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

const WEATHER_TIPS = {
  rain: {
    title: "💧 Rainy Season!",
    message:
      "During rainfall, trees need less watering. This is a great time to save water and money for future droughts!",
    lessonKey: "rain-conservation",
  },
  drought: {
    title: "🏜️ Drought Warning!",
    message:
      "During drought, your earnings are reduced. Good thing you've been saving money! This is why emergency funds matter.",
    lessonKey: "drought-resilience",
  },
  storm: {
    title: "⛈️ Storm Alert!",
    message:
      'Storms can damage your earnings. Having an investing account helps your wealth grow through long-term saving!',
    lessonKey: "storm-protection",
  },
};

export const WeatherManager = () => {
  const { currentWeather, player, triggerWeatherEvent } = useGameStore();
  const triggeredDayRef = useRef<number>(0);

  useEffect(() => {
    if (currentWeather !== "none") return;
    if (triggeredDayRef.current === player.currentDay) return;

    triggeredDayRef.current = player.currentDay;
    const shouldTriggerWeather = Math.random() < 0.3;
    if (!shouldTriggerWeather) return;

    const weatherEvents = ["rain", "drought", "storm"] as const;
    const randomWeather =
      weatherEvents[Math.floor(Math.random() * weatherEvents.length)];

    triggerWeatherEvent(randomWeather);
  }, [currentWeather, player.currentDay, triggerWeatherEvent]);

  return null;
};

export { WEATHER_TIPS };
