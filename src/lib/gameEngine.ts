// Core game engine logic

import { GAME_CONFIG } from "./constants";
import type { Tree, Player, Asset, SaplingStage } from "@/types/game";

/**
 * Calculate money earned from watering the tree
 */
export function calculateTreeYield(
  tree: Tree,
  assets: Asset[],
  currentDay: number,
): number {
  const baseYield = GAME_CONFIG.BASE_TREE_YIELD;

  // Health multiplier (0.5 to 1.0 based on health)
  const healthMultiplier = 0.5 + tree.health / 200;

  // Level bonus (10% per level)
  const levelBonus = 1 + (tree.level - 1) * 0.1;

  // Asset boost from depreciating assets
  let assetBoost = 1;
  for (const asset of assets) {
    if (
      asset.type === "depreciating" &&
      asset.boostMultiplier &&
      !asset.boostExpired
    ) {
      const daysSincePurchase = currentDay - asset.purchaseDay;
      if (daysSincePurchase < (asset.boostDuration || 0)) {
        assetBoost *= asset.boostMultiplier;
      }
    }
  }

  return Math.floor(baseYield * healthMultiplier * levelBonus * assetBoost);
}

/**
 * Calculate water cost based on quantity and owned assets
 */
export function calculateWaterCost(units: number, assets: Asset[] = []): number {
  // Calculate base cost based on bundle
  let baseCost: number;
  if (units === 1) {
    baseCost = GAME_CONFIG.WATER_COST_SINGLE;
  } else if (units === 5) {
    baseCost = GAME_CONFIG.WATER_COST_5;
  } else if (units === 10) {
    baseCost = GAME_CONFIG.WATER_COST_10;
  } else {
    // For custom amounts, use single price
    baseCost = units * GAME_CONFIG.WATER_COST_SINGLE;
  }

  // Apply car water cost reduction if owned
  let reduction = 0;
  for (const asset of assets) {
    if (asset.waterCostReduction && !asset.boostExpired) {
      reduction += asset.waterCostReduction * units;
    }
  }

  return Math.max(0, baseCost - reduction);
}

/**
 * Get water bundle options with prices
 */
export function getWaterBundleOptions(assets: Asset[] = []): Array<{ units: number; cost: number; label: string }> {
  return [
    { units: 1, cost: calculateWaterCost(1, assets), label: "1 Drop" },
    { units: 5, cost: calculateWaterCost(5, assets), label: "5 Drops" },
    { units: 10, cost: calculateWaterCost(10, assets), label: "10 Drops" },
  ];
}

/**
 * Check if tree can be watered
 */
export function canWaterTree(tree: Tree, waterUnits: number): boolean {
  return waterUnits > 0 && tree.timesWateredToday < tree.maxWateringPerDay;
}

/**
 * Check if day should end
 */
export function shouldEndDay(tree: Tree): boolean {
  return tree.timesWateredToday >= GAME_CONFIG.WATERING_SESSIONS_PER_DAY;
}

/**
 * Determine sapling stage based on total waterings
 */
export function getSaplingStage(totalWaterings: number): SaplingStage {
  if (totalWaterings < 3) return "seed";
  if (totalWaterings < 10) return "sprout";
  if (totalWaterings < 25) return "small";
  if (totalWaterings < 50) return "medium";
  if (totalWaterings < 100) return "large";
  return "full";
}

/**
 * Update tree state after watering
 */
export function updateTreeAfterWatering(tree: Tree): Tree {
  const newTotalWaterings = tree.totalWaterings + 1;
  const newStage = getSaplingStage(newTotalWaterings);
  const levelUp = newStage !== tree.stage;

  return {
    ...tree,
    timesWateredToday: tree.timesWateredToday + 1,
    health: Math.min(100, tree.health + GAME_CONFIG.TREE_HEALTH_GAIN),
    totalWaterings: newTotalWaterings,
    stage: newStage,
    level: levelUp ? tree.level + 1 : tree.level,
  };
}

/**
 * Reset tree for new day
 */
export function resetTreeForNewDay(tree: Tree): Tree {
  return {
    ...tree,
    timesWateredToday: 0,
    // Small health decay if tree wasn't watered enough
    health: Math.max(
      0,
      tree.health -
        (tree.timesWateredToday < 2 ? GAME_CONFIG.TREE_HEALTH_DECAY : 0),
    ),
  };
}

/**
 * Create initial player state
 */
export function createInitialPlayer(name: string = "Player"): Player {
  return {
    id: crypto.randomUUID(),
    name,
    wallet: GAME_CONFIG.INITIAL_MONEY, // Now 0
    waterUnits: GAME_CONFIG.INITIAL_WATER, // 10 drops
    currentDay: 1,
    totalEarnings: 0,
    bankBalance: 0,
    investmentBalance: 0,
  };
}

/**
 * Create initial tree state
 */
export function createInitialTree(): Tree {
  return {
    level: 1,
    health: 100,
    timesWateredToday: 0,
    maxWateringPerDay: GAME_CONFIG.MAX_WATERING_PER_DAY,
    stage: "seed",
    totalWaterings: 0,
  };
}

/**
 * Apply weather modifier to earnings
 */
export function applyWeatherModifier(
  earnings: number,
  weatherType: string,
): number {
  switch (weatherType) {
    case "rain":
      // Rain actually helps - bonus to water efficiency (no money bonus)
      return earnings;
    case "drought":
      // Drought reduces earnings
      return Math.floor(
        earnings * (1 - GAME_CONFIG.WEATHER_DROUGHT_PENALTY),
      );
    case "storm":
      // Storm reduces earnings
      return Math.floor(
        earnings * (1 - GAME_CONFIG.WEATHER_STORM_PENALTY),
      );
    default:
      return earnings;
  }
}

/**
 * Calculate storm chance based on owned assets
 */
export function calculateStormChance(assets: Asset[], currentDay: number): number {
  let stormChance = GAME_CONFIG.BASE_STORM_CHANCE;

  for (const asset of assets) {
    if (asset.stormChanceBoost && asset.stormTriggerDay) {
      const daysSincePurchase = currentDay - asset.purchaseDay;
      // If past trigger day and storm hasn't occurred yet
      if (daysSincePurchase >= asset.stormTriggerDay && !asset.hasTriggeredStorm) {
        stormChance += asset.stormChanceBoost;
      }
    }
  }

  return Math.min(stormChance, 0.5); // Cap at 50%
}
