"use client";

import { useEffect } from "react";
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
  const {
    currentWeather,
    startNewDay,
    triggerWeatherEvent,
    clearWeatherEvent,
    player,
  } = useGameStore();

  useEffect(() => {
    // Randomly trigger weather based on day count
    // 30% chance each day for a weather event
    const shouldTriggerWeather = Math.random() < 0.3;

    if (shouldTriggerWeather && currentWeather === "none") {
      const weatherEvents = ["rain", "drought", "storm"] as const;
      const randomWeather =
        weatherEvents[Math.floor(Math.random() * weatherEvents.length)];

      triggerWeatherEvent(randomWeather);

      // Duration: 5 days
      const duration = 5;
      const endDay = player.currentDay + duration;

      // Clear weather after duration
      const timer = setTimeout(() => {
        if (useGameStore.getState().currentWeather === randomWeather) {
          clearWeatherEvent();
        }
      }, duration * 5000); // Approximate timing

      return () => clearTimeout(timer);
    }
  }, [player.currentDay, currentWeather, triggerWeatherEvent, clearWeatherEvent]);

  return null;
};

export { WEATHER_TIPS };
