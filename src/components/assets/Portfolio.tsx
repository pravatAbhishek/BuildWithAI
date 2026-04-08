"use client";

import React from "react";
import { useGameStore } from "@/store/gameStore";
import { Card } from "@/components/ui";
import { AssetCard } from "./AssetCard";

export function Portfolio() {
  const { player, ownedAssets, sellAsset } = useGameStore();

  if (ownedAssets.length === 0) {
    return (
      <Card title="Your Portfolio" icon="📊">
        <div className="text-center py-8">
          <span className="text-4xl">📭</span>
          <p className="text-gray-500 mt-2">No assets yet!</p>
          <p className="text-sm text-gray-400">
            Buy assets from the market to grow your wealth.
          </p>
        </div>
      </Card>
    );
  }

  // Calculate totals
  const totalInvested = ownedAssets.reduce(
    (sum, a) => sum + a.purchasePrice,
    0,
  );
  const totalValue = ownedAssets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalProfitLoss = totalValue - totalInvested;

  // Separate by type
  const appreciating = ownedAssets.filter((a) => a.type === "appreciating");
  const depreciating = ownedAssets.filter((a) => a.type === "depreciating");

  return (
    <Card title="Your Portfolio" icon="📊">
      <div className="space-y-4">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-gray-500">Invested</div>
            <div className="font-bold">₹{totalInvested}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Value</div>
            <div className="font-bold">₹{totalValue}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">P/L</div>
            <div
              className={`font-bold ${totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {totalProfitLoss >= 0 ? "+" : ""}₹{totalProfitLoss}
            </div>
          </div>
        </div>

        {/* Appreciating Assets */}
        {appreciating.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              📈 Appreciating ({appreciating.length})
            </h4>
            <div className="space-y-2">
              {appreciating.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  mode="owned"
                  currentDay={player.currentDay}
                  onAction={() => sellAsset(asset.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Depreciating Assets */}
        {depreciating.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              📉 Depreciating ({depreciating.length})
            </h4>
            <div className="space-y-2">
              {depreciating.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  mode="owned"
                  currentDay={player.currentDay}
                  onAction={() => sellAsset(asset.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
