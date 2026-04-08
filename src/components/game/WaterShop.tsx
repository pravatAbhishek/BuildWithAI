"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { Button, Card } from "@/components/ui";
import { GAME_CONFIG } from "@/lib/constants";
import { calculateWaterCost, getWaterBundleOptions } from "@/lib/gameEngine";

export function WaterShop() {
  const { player, ownedAssets, buyWater } = useGameStore();
  const [quantity, setQuantity] = useState<number>(1);

  const cost = calculateWaterCost(quantity, ownedAssets);
  const canAfford = player.wallet >= cost;
  const waterOptions = getWaterBundleOptions(ownedAssets);

  const handleBuy = () => {
    if (canAfford) {
      buyWater(quantity);
    }
  };

  return (
    <Card title="Water Shop" icon="🏪">
      <div className="space-y-4">
        {/* Current water display */}
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-gray-600">Your Water:</span>
          <span className="text-xl font-bold text-blue-600">
            💧 {player.waterUnits}
          </span>
        </div>

        {/* Quick select buttons with bundle prices */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-600 mb-1">
            Buy Water Drops
          </label>
          <div className="flex gap-2">
            {waterOptions.map((opt) => (
              <Button
                key={opt.units}
                variant={quantity === opt.units ? "primary" : "secondary"}
                size="sm"
                onClick={() => setQuantity(opt.units)}
                className="flex-1"
              >
                {opt.units} = ₹{opt.cost}
              </Button>
            ))}
          </div>
        </div>

        {/* Price and buy button */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600">Total Cost:</span>
            <span
              className={`text-xl font-bold ${canAfford ? "text-green-600" : "text-red-500"}`}
            >
              ₹{cost}
            </span>
          </div>

          <Button onClick={handleBuy} disabled={!canAfford} className="w-full">
            {canAfford ? `Buy ${quantity} Water 💧` : "Not Enough Money"}
          </Button>
        </div>

        {/* Price info */}
        <p className="text-xs text-gray-500 text-center">
          💡 1 drop = ₹{GAME_CONFIG.WATER_COST_SINGLE} | 5 drops = ₹{GAME_CONFIG.WATER_COST_5} (save ₹50) | 10 drops = ₹{GAME_CONFIG.WATER_COST_10} (save ₹100)
        </p>
      </div>
    </Card>
  );
}
