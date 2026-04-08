// Core game engine logic

import { GAME_CONFIG } from "./constants";
import type { Tree, Player, Asset } from "@/types/game";

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
 * Calculate water cost for a bundle
 */
export function calculateWaterCost(units: number): number {
  return units * GAME_CONFIG.WATER_COST;
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
 * Update tree state after watering
 */
export function updateTreeAfterWatering(tree: Tree): Tree {
  return {
    ...tree,
    timesWateredToday: tree.timesWateredToday + 1,
    health: Math.min(100, tree.health + GAME_CONFIG.TREE_HEALTH_GAIN),
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
    wallet: GAME_CONFIG.INITIAL_MONEY,
    waterUnits: GAME_CONFIG.INITIAL_WATER,
    currentDay: 1,
    totalEarnings: 0,
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
  };
}
