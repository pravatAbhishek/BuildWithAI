"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

const WEATHER_TIPS = {
  rain: {
    title: "💧 Rainy Season!",
    message:
      "Rain is a reward for strong savings habits. You get a 1% earning bonus on each watering today.",
    lessonKey: "rain-conservation",
  },
  drought: {
    title: "🏜️ Drought Warning!",
    message:
      "Drought is unavoidable and cuts earnings by 25%. It cannot be removed with money, so planning ahead is key.",
    lessonKey: "drought-resilience",
  },
  storm: {
    title: "⛈️ Storm Alert!",
    message:
      "Storm now triggers an emergency expense. If cash is low, savings are used automatically.",
    lessonKey: "storm-protection",
  },
};

export const WeatherManager = () => {
  const { player, savings, ownedAssets, triggerWeatherEvent } = useGameStore();
  const triggeredDayRef = useRef<number>(0);

  useEffect(() => {
    if (triggeredDayRef.current === player.currentDay) return;

    triggeredDayRef.current = player.currentDay;
    if (player.currentDay <= 1) {
      triggerWeatherEvent("none");
      return;
    }

    // Drought is an unavoidable learning event.
    if (player.currentDay % 6 === 0) {
      triggerWeatherEvent("drought");
      return;
    }

    const hasStormRiskAsset = ownedAssets.some((asset) => {
      if (!asset.stormChanceBoost || !asset.stormTriggerDay) return false;
      return player.currentDay - asset.purchaseDay >= asset.stormTriggerDay;
    });

    const stormChance = hasStormRiskAsset ? 0.45 : 0.12;
    if (Math.random() < stormChance) {
      triggerWeatherEvent("storm");
      return;
    }

    // Rain is a reward event for strong savers.
    if (savings.balance >= 800 && Math.random() < 0.55) {
      triggerWeatherEvent("rain");
      return;
    }

    triggerWeatherEvent("none");
  }, [ownedAssets, player.currentDay, savings.balance, triggerWeatherEvent]);

  return null;
};

export { WEATHER_TIPS };
