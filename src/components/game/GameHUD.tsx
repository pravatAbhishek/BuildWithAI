"use client";

import { useGameStore } from "@/store/gameStore";

export function GameHUD() {
  const { player, tree } = useGameStore();

  const wateringsLeft = tree.maxWateringPerDay - tree.timesWateredToday;

  return (
    <div className="absolute top-0 left-0 right-0 p-4 z-30">
      <div className="flex items-center justify-between gap-2">
        {/* Day indicator */}
        <div className="game-hud-item">
          <span className="text-2xl">📅</span>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Day</span>
            <span className="font-bold text-lg text-gray-800">
              {player.currentDay}
            </span>
          </div>
        </div>

        {/* Coins */}
        <div className="game-hud-item flex-1 max-w-[140px]">
          <span className="text-2xl">🪙</span>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Coins</span>
            <span className="font-bold text-lg text-yellow-600">
              ₹{player.wallet}
            </span>
          </div>
        </div>

        {/* Water */}
        <div className="game-hud-item">
          <span className="text-2xl">💧</span>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Water</span>
            <span className="font-bold text-lg text-blue-600">
              {player.waterUnits}
            </span>
          </div>
        </div>
      </div>

      {/* Watering progress */}
      <div className="mt-3 game-hud-item mx-auto w-fit">
        <span className="text-sm text-gray-600 mr-2">Today:</span>
        <div className="flex gap-1">
          {[...Array(tree.maxWateringPerDay)].map((_, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                i < tree.timesWateredToday
                  ? "bg-green-500 text-white scale-110"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {i < tree.timesWateredToday ? "✓" : "○"}
            </div>
          ))}
        </div>
        {wateringsLeft > 0 && (
          <span className="text-sm text-gray-500 ml-2">
            {wateringsLeft} left
          </span>
        )}
      </div>

      {/* Bank & Investment indicators */}
      {(player.bankBalance > 0 || player.investmentBalance > 0) && (
        <div className="mt-2 flex justify-center gap-2">
          {player.bankBalance > 0 && (
            <div className="game-hud-item text-sm">
              <span>🏦</span>
              <span className="text-blue-600 font-medium">
                ₹{player.bankBalance}
              </span>
            </div>
          )}
          {player.investmentBalance > 0 && (
            <div className="game-hud-item text-sm">
              <span>📈</span>
              <span className="text-purple-600 font-medium">
                ₹{player.investmentBalance}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
