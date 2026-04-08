"use client";

import React from "react";
import { useGameStore } from "@/store/gameStore";
import { Card, ProgressBar } from "@/components/ui";
import { GAME_CONFIG } from "@/lib/constants";

export function GameStats() {
  const { player, tree, savings, fixedDeposits, ownedAssets } = useGameStore();

  // Calculate total FD value
  const totalFDValue = fixedDeposits.reduce((sum, fd) => sum + fd.principal, 0);

  // Calculate total asset value
  const totalAssetValue = ownedAssets.reduce(
    (sum, asset) => sum + asset.currentValue,
    0,
  );

  // Calculate net worth
  const netWorth =
    player.wallet + savings.balance + totalFDValue + totalAssetValue;

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-green-100">
      <div className="grid grid-cols-2 gap-4">
        {/* Day Counter */}
        <div className="col-span-2 text-center pb-3 border-b border-green-200">
          <span className="text-sm text-gray-600">Day</span>
          <div className="text-3xl font-bold text-green-700">
            {player.currentDay}
          </div>
        </div>

        {/* Wallet */}
        <div className="text-center p-2 bg-white/50 rounded-lg">
          <span className="text-2xl">💰</span>
          <div className="text-lg font-bold text-gray-800">
            ₹{player.wallet}
          </div>
          <span className="text-xs text-gray-500">Wallet</span>
        </div>

        {/* Water */}
        <div className="text-center p-2 bg-white/50 rounded-lg">
          <span className="text-2xl">💧</span>
          <div className="text-lg font-bold text-blue-600">
            {player.waterUnits}
          </div>
          <span className="text-xs text-gray-500">Water</span>
        </div>

        {/* Tree Health */}
        <div className="col-span-2">
          <ProgressBar
            value={tree.health}
            max={100}
            label="🌳 Tree Health"
            color={
              tree.health > 50 ? "green" : tree.health > 25 ? "yellow" : "red"
            }
          />
        </div>

        {/* Watering Progress */}
        <div className="col-span-2">
          <ProgressBar
            value={tree.timesWateredToday}
            max={GAME_CONFIG.MAX_WATERING_PER_DAY}
            label="🚿 Watering Today"
            color="blue"
          />
        </div>

        {/* Net Worth */}
        <div className="col-span-2 mt-2 p-3 bg-white/70 rounded-lg text-center">
          <span className="text-sm text-gray-600">Total Net Worth</span>
          <div className="text-xl font-bold text-green-700">₹{netWorth}</div>
          <div className="text-xs text-gray-500 mt-1">
            Savings: ₹{savings.balance} | FD: ₹{totalFDValue} | Assets: ₹
            {totalAssetValue}
          </div>
        </div>
      </div>
    </Card>
  );
}
