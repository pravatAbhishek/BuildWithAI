// Asset value calculations for appreciating and depreciating assets

import type { Asset, MarketAsset } from "@/types/game";

/**
 * Calculate current value of an appreciating asset
 */
export function calculateAppreciatingAssetValue(
  asset: Asset,
  currentDay: number,
): number {
  if (asset.type !== "appreciating") return asset.currentValue;

  const daysSincePurchase = currentDay - asset.purchaseDay;
  const peakDay = asset.peakDay || 30;
  const appreciationRate = asset.appreciationRate || 0.01;

  if (daysSincePurchase <= peakDay) {
    // Asset is still appreciating
    const growth = Math.pow(1 + appreciationRate, daysSincePurchase);
    return Math.floor(asset.purchasePrice * growth);
  } else {
    // Asset has peaked and may decline slowly
    const peakValue =
      asset.purchasePrice * Math.pow(1 + appreciationRate, peakDay);
    const daysAfterPeak = daysSincePurchase - peakDay;
    const declineRate = 0.005; // 0.5% daily decline after peak
    const currentValue = peakValue * Math.pow(1 - declineRate, daysAfterPeak);
    return Math.floor(Math.max(asset.purchasePrice * 0.8, currentValue)); // Never below 80% of purchase
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

  const daysSincePurchase = currentDay - asset.purchaseDay;
  const boostDuration = asset.boostDuration || 5;
  const depreciationRate = asset.depreciationRate || 0.1;

  if (daysSincePurchase <= boostDuration) {
    // During boost period, asset maintains value
    return asset.purchasePrice;
  } else {
    // After boost, asset depreciates
    const daysAfterBoost = daysSincePurchase - boostDuration;
    const depreciation = Math.pow(1 - depreciationRate, daysAfterBoost);
    return Math.floor(Math.max(10, asset.purchasePrice * depreciation)); // Minimum value of 10
  }
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
 * Update all assets with current values
 */
export function updateAssetValues(
  assets: Asset[],
  currentDay: number,
): Asset[] {
  return assets.map((asset) => ({
    ...asset,
    currentValue: calculateAssetValue(asset, currentDay),
    boostExpired:
      asset.type === "depreciating"
        ? currentDay - asset.purchaseDay >= (asset.boostDuration || 0)
        : undefined,
  }));
}

/**
 * Calculate daily maintenance costs for depreciating assets
 */
export function calculateMaintenanceCosts(
  assets: Asset[],
  currentDay: number,
): number {
  let totalCost = 0;

  for (const asset of assets) {
    if (asset.type === "depreciating" && asset.maintenanceCost) {
      const daysSincePurchase = currentDay - asset.purchaseDay;
      const boostDuration = asset.boostDuration || 0;

      if (daysSincePurchase > boostDuration) {
        totalCost += asset.maintenanceCost;
      }
    }
  }

  return totalCost;
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
  return {
    id: crypto.randomUUID(),
    name: marketAsset.name,
    type: marketAsset.type,
    description: marketAsset.description,
    purchasePrice: marketAsset.currentPrice,
    currentValue: marketAsset.currentPrice,
    purchaseDay: currentDay,
    appreciationRate: marketAsset.appreciationRate,
    peakDay: marketAsset.peakDay,
    boostMultiplier: marketAsset.boostMultiplier,
    boostDuration: marketAsset.boostDuration,
    depreciationRate: marketAsset.depreciationRate,
    maintenanceCost: marketAsset.maintenanceCost,
    boostExpired: false,
  };
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
