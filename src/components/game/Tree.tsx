"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { Button, Card } from "@/components/ui";
import { canWaterTree, calculateTreeYield } from "@/lib/gameEngine";

export function Tree() {
  const { tree, player, ownedAssets, waterTree } = useGameStore();
  const [isWatering, setIsWatering] = useState(false);
  const [lastEarning, setLastEarning] = useState<number | null>(null);

  const canWater = canWaterTree(tree, player.waterUnits);
  const potentialEarning = calculateTreeYield(
    tree,
    ownedAssets,
    player.currentDay,
  );

  const handleWater = () => {
    if (!canWater) return;

    setIsWatering(true);
    setLastEarning(potentialEarning);

    // Animate then water
    setTimeout(() => {
      waterTree();
      setIsWatering(false);

      // Clear earning display after a bit
      setTimeout(() => setLastEarning(null), 2000);
    }, 500);
  };

  // Tree emoji based on health
  const getTreeEmoji = () => {
    if (tree.health > 95) return "🌟";
    if (tree.health > 80) return "🌳";
    if (tree.health > 50) return "🌲";
    if (tree.health > 25) return "🪵";
    return "🥀";
  };

  const healthVariant =
    tree.health > 85 ? "golden" : tree.health > 45 ? "healthy" : "stressed";

  return (
    <Card className="text-center relative overflow-hidden">
      {/* Background gradient based on health */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          tree.health > 50
            ? "bg-gradient-to-b from-green-50 to-green-100"
            : "bg-gradient-to-b from-yellow-50 to-orange-100"
        }`}
      />

      <div className="relative z-10">
        {/* Tree Display */}
        <motion.div
          variants={{
            healthy: { scale: 1, filter: "drop-shadow(0 0 12px rgba(34,197,94,0.45))" },
            stressed: { scale: [1, 0.98, 1], filter: "saturate(0.75)" },
            golden: { scale: [1, 1.05, 1], filter: "drop-shadow(0 0 18px rgba(234,179,8,0.65))" },
          }}
          animate={healthVariant}
          transition={{ duration: 0.5, repeat: healthVariant === "golden" ? Infinity : 0 }}
          className={`text-8xl mb-4 transition-transform duration-300 ${isWatering ? "scale-110" : ""}`}
        >
          {getTreeEmoji()}
        </motion.div>

        {/* Water animation */}
        {isWatering && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
            💧
          </div>
        )}

        {/* Earning popup */}
        {lastEarning !== null && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-2xl font-bold text-green-600 animate-pulse">
            +₹{lastEarning}
          </div>
        )}

        {/* Tree Info */}
        <div className="mb-4">
          <div className="text-lg font-semibold text-gray-700">
            Level {tree.level} Tree
          </div>
          <div className="text-sm text-gray-500">
            Potential: ₹{potentialEarning} per watering
          </div>
        </div>

        {/* Water Button */}
        <Button
          onClick={handleWater}
          disabled={!canWater || isWatering}
          size="lg"
          className="w-full"
        >
          {isWatering
            ? "💧 Watering..."
            : canWater
              ? `💧 Water Tree (${player.waterUnits} left)`
              : player.waterUnits === 0
                ? "❌ No Water!"
                : "✓ Done for Today"}
        </Button>

        {/* Hint */}
        {!canWater && player.waterUnits === 0 && (
          <p className="text-sm text-orange-600 mt-2">
            Buy more water from the shop!
          </p>
        )}
      </div>
    </Card>
  );
}
