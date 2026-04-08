"use client";

import React, { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { Button, Card } from "@/components/ui";
import { GAME_CONFIG } from "@/lib/constants";
import { calculateWaterCost } from "@/lib/gameEngine";

export function WaterShop() {
  const { player, buyWater } = useGameStore();
  const [quantity, setQuantity] = useState(GAME_CONFIG.WATER_BUNDLE_SIZE);

  const cost = calculateWaterCost(quantity);
  const canAfford = player.wallet >= cost;

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

        {/* Quantity selector */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">
            Buy Water Units
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </Button>
            <div className="flex-1 text-center py-2 px-4 bg-gray-100 rounded-lg font-bold">
              {quantity}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </Button>
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex gap-2">
          {[1, 5, 10].map((amt) => (
            <Button
              key={amt}
              variant={quantity === amt ? "primary" : "secondary"}
              size="sm"
              onClick={() => setQuantity(amt)}
              className="flex-1"
            >
              {amt}
            </Button>
          ))}
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
          Price: ₹{GAME_CONFIG.WATER_COST} per unit
        </p>
      </div>
    </Card>
  );
}
