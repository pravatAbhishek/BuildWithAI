// Asset value calculations for appreciating and depreciating assets

import type { Asset, MarketAsset } from "@/types/game";
import { GAME_CONFIG } from "@/lib/constants";

export interface MaintenanceBreakdown {
  assetId: string;
  assetName: string;
  cost: number;
  daysPastGrace: number;
  note: string;
}

/**
 * Calculate current value of an appreciating asset
 * Now uses interval-based appreciation instead of daily
 */
export function calculateAppreciatingAssetValue(
  asset: Asset,
  currentDay: number,
): number {
  if (asset.type !== "appreciating") return asset.currentValue;

  const daysSincePurchase = currentDay - asset.purchaseDay;
  const peakDay = asset.peakDay || 90;
  const appreciationRate = asset.appreciationRate || 0.10;
  const appreciationInterval = asset.appreciationInterval || 15;

  // Calculate how many appreciation periods have passed
  const periods = Math.floor(daysSincePurchase / appreciationInterval);

  if (daysSincePurchase <= peakDay) {
    // Asset is still appreciating - exponential growth per interval
    const growth = Math.pow(1 + appreciationRate, periods);
    return Math.floor(asset.purchasePrice * growth);
  } else {
    // Asset has peaked and may decline slowly
    const peakPeriods = Math.floor(peakDay / appreciationInterval);
    const peakValue = asset.purchasePrice * Math.pow(1 + appreciationRate, peakPeriods);
    const daysAfterPeak = daysSincePurchase - peakDay;
    const declineRate = 0.003; // 0.3% daily decline after peak
    const currentValue = peakValue * Math.pow(1 - declineRate, daysAfterPeak);
    return Math.floor(Math.max(asset.purchasePrice * 0.8, currentValue));
  }
}

/**
 * Calculate current value of a depreciating asset
 */
export function calculateDepreciatingAssetValue(
  asset: Asset,
  currentDay: number,
): number {
  if (asset.type !== "depreciating") return asset.currentValue;

  const daysSincePurchase = Math.max(0, currentDay - asset.purchaseDay);
  const depreciationRate = asset.depreciationRate || 0.1;
  const depreciationInterval =
    asset.maintenanceInterval || GAME_CONFIG.DEPRECIATING_EFFECT_DECAY_INTERVAL_DAYS;
  const depreciationSteps = Math.floor(daysSincePurchase / Math.max(1, depreciationInterval));
  const depreciation = Math.pow(1 - depreciationRate, depreciationSteps);
  const floorValue = Math.max(10, Math.floor(asset.purchasePrice * 0.2));

  return Math.floor(Math.max(floorValue, asset.purchasePrice * depreciation));
}

/**
 * Depreciating asset effects decay in fixed cycles and can turn negative.
 */
export function getDepreciatingYieldMultiplier(asset: Asset, currentDay: number): number {
  if (asset.type !== "depreciating") return 1;

  const baseMultiplier = asset.boostMultiplier || 1;
  const daysSincePurchase = Math.max(0, currentDay - asset.purchaseDay);
  const decayInterval =
    asset.maintenanceInterval || GAME_CONFIG.DEPRECIATING_EFFECT_DECAY_INTERVAL_DAYS;
  const decaySteps = Math.floor(daysSincePurchase / Math.max(1, decayInterval));
  const baseBoostPercent = (baseMultiplier - 1) * 100;
  const decayedPercent =
    baseBoostPercent - decaySteps * GAME_CONFIG.DEPRECIATING_EFFECT_DECAY_PERCENT;
  const multiplier = 1 + decayedPercent / 100;

  return Math.max(GAME_CONFIG.DEPRECIATING_EFFECT_MIN_MULTIPLIER, multiplier);
}

/**
 * Calculate current value of any asset
 */
export function calculateAssetValue(asset: Asset, currentDay: number): number {
  if (asset.type === "appreciating") {
    return calculateAppreciatingAssetValue(asset, currentDay);
  }
  return calculateDepreciatingAssetValue(asset, currentDay);
}

/**
 * Update all assets with current values and check maintenance
 */
export function updateAssetValues(
  assets: Asset[],
  currentDay: number,
): Asset[] {
  return assets.map((asset) => {
    const effectiveMultiplier =
      asset.type === "depreciating" ? getDepreciatingYieldMultiplier(asset, currentDay) : 1;

    const updatedAsset = {
      ...asset,
      currentValue: calculateAssetValue(asset, currentDay),
      boostExpired:
        asset.type === "depreciating"
          ? effectiveMultiplier <= 1
          : undefined,
    };

    // Check storm trigger for high-risk depreciating assets
    if (asset.stormTriggerDay && !asset.hasTriggeredStorm) {
      const daysSincePurchase = currentDay - asset.purchaseDay;
      if (daysSincePurchase >= asset.stormTriggerDay) {
        updatedAsset.hasTriggeredStorm = false; // Will be set true when storm happens
      }
    }

    // Check car maintenance due
    if (asset.maintenanceInterval && asset.maintenanceBaseCost) {
      if (!asset.nextMaintenanceDay) {
        updatedAsset.nextMaintenanceDay = asset.purchaseDay + asset.maintenanceInterval;
        updatedAsset.maintenanceCount = 0;
      }
    }

    return updatedAsset;
  });
}

/**
 * Calculate car maintenance cost (exponential growth)
 */
export function calculateCarMaintenanceCost(asset: Asset): number {
  if (!asset.maintenanceBaseCost || asset.maintenanceCount === undefined) return 0;
  return Math.floor(asset.maintenanceBaseCost * Math.pow(2, asset.maintenanceCount));
}

/**
 * Daily maintenance breakdown for depreciating assets.
 * Costs scale exponentially after each asset's grace period.
 */
export function calculateDailyMaintenanceBreakdown(
  assets: Asset[],
  currentDay: number,
): MaintenanceBreakdown[] {
  const breakdown: MaintenanceBreakdown[] = [];

  for (const asset of assets) {
    if (asset.type !== "depreciating") continue;

    const daysOwned = Math.max(0, currentDay - asset.purchaseDay);
    const maintenanceInterval =
      asset.maintenanceInterval || GAME_CONFIG.DEPRECIATING_MAINTENANCE_INTERVAL_DAYS;
    if (daysOwned === 0 || daysOwned % Math.max(1, maintenanceInterval) !== 0) continue;

    const cycleCount = Math.floor(daysOwned / Math.max(1, maintenanceInterval));
    const baseCost = asset.maintenanceCost || asset.maintenanceBaseCost || 25;

    const growthFactor =
      asset.name.includes("Car")
        ? 1.22
        : asset.id === "creator-kit"
          ? 1.28
          : 1.18;

    const cost = Math.floor(baseCost * Math.pow(growthFactor, Math.max(0, cycleCount - 1)));
    if (cost <= 0) continue;

    breakdown.push({
      assetId: asset.id,
      assetName: asset.name,
      cost,
      daysPastGrace: cycleCount,
      note:
        cycleCount <= 2
          ? `Recurring maintenance (every ${maintenanceInterval} days)`
          : `Recurring maintenance is getting expensive (cycle ${cycleCount})`,
    });
  }

  return breakdown;
}

/**
 * Check if any assets need maintenance and calculate total cost
 */
export function getMaintenanceDue(assets: Asset[], currentDay: number): Array<{
  asset: Asset;
  cost: number;
  type: "car" | "gadget";
}> {
  const maintenanceDue: Array<{ asset: Asset; cost: number; type: "car" | "gadget" }> = [];

  for (const asset of assets) {
    // Car maintenance check
    if (asset.maintenanceInterval && asset.nextMaintenanceDay && currentDay >= asset.nextMaintenanceDay) {
      maintenanceDue.push({
        asset,
        cost: calculateCarMaintenanceCost(asset),
        type: "car",
      });
    }
  }

  return maintenanceDue;
}

/**
 * Apply maintenance to car (resets timer, increases count)
 */
export function applyCarMaintenance(asset: Asset, currentDay: number): Asset {
  return {
    ...asset,
    maintenanceCount: (asset.maintenanceCount || 0) + 1,
    nextMaintenanceDay: currentDay + (asset.maintenanceInterval || 15),
  };
}

/**
 * Calculate daily maintenance costs for depreciating assets (old simple system)
 */
export function calculateMaintenanceCosts(
  assets: Asset[],
  currentDay: number,
): number {
  return calculateDailyMaintenanceBreakdown(assets, currentDay).reduce(
    (sum, item) => sum + item.cost,
    0,
  );
}

/**
 * Calculate profit/loss from selling an asset
 */
export function calculateAssetProfitLoss(
  asset: Asset,
  currentDay: number,
): number {
  const currentValue = calculateAssetValue(asset, currentDay);
  return currentValue - asset.purchasePrice;
}

/**
 * Check if it's a good time to sell an appreciating asset
 */
export function shouldSellAppreciatingAsset(
  asset: Asset,
  currentDay: number,
): boolean {
  if (asset.type !== "appreciating") return false;

  const daysSincePurchase = currentDay - asset.purchaseDay;
  const peakDay = asset.peakDay || 30;

  // Suggest selling around peak or after
  return daysSincePurchase >= peakDay - 2;
}

/**
 * Create owned asset from market asset
 */
export function purchaseAsset(
  marketAsset: MarketAsset,
  currentDay: number,
): Asset {
  const asset: Asset = {
    id: crypto.randomUUID(),
    name: marketAsset.name,
    type: marketAsset.type,
    description: marketAsset.description,
    purchasePrice: marketAsset.currentPrice,
    currentValue: marketAsset.currentPrice,
    purchaseDay: currentDay,
    appreciationRate: marketAsset.appreciationRate,
    appreciationInterval: marketAsset.appreciationInterval,
    peakDay: marketAsset.peakDay,
    boostMultiplier: marketAsset.boostMultiplier,
    boostDuration: marketAsset.boostDuration,
    depreciationRate: marketAsset.depreciationRate,
    maintenanceCost: marketAsset.maintenanceCost,
    boostExpired: false,
  };

  // Add storm-risk properties for creator kit style assets
  if (marketAsset.stormChanceBoost) {
    asset.stormChanceBoost = marketAsset.stormChanceBoost;
    asset.stormTriggerDay = marketAsset.stormTriggerDay;
    asset.hasTriggeredStorm = false;
  }

  // Add car-specific properties
  if (marketAsset.waterCostReduction) {
    asset.waterCostReduction = marketAsset.waterCostReduction;
  }
  if (marketAsset.maintenanceInterval) {
    asset.maintenanceInterval = marketAsset.maintenanceInterval;
    asset.maintenanceBaseCost = marketAsset.maintenanceBaseCost;
    asset.maintenanceCount = 0;
    asset.nextMaintenanceDay = currentDay + marketAsset.maintenanceInterval;
  }

  return asset;
}

/**
 * Get income boost multiplier from all active depreciating assets
 */
export function getIncomeBoostMultiplier(
  assets: Asset[],
  currentDay: number,
): number {
  let multiplier = 1;

  for (const asset of assets) {
    if (asset.type === "depreciating" && asset.boostMultiplier) {
      const daysSincePurchase = currentDay - asset.purchaseDay;
      if (daysSincePurchase < (asset.boostDuration || 0)) {
        multiplier *= asset.boostMultiplier;
      }
    }
  }

  return multiplier;
}
