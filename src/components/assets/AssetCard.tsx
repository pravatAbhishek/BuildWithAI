"use client";

import { Button } from "@/components/ui";
import type { Asset, MarketAsset } from "@/types/game";

interface AssetCardProps {
  asset: Asset | MarketAsset;
  mode: "market" | "owned";
  currentDay?: number;
  onAction: () => void;
  disabled?: boolean;
}

export function AssetCard({
  asset,
  mode,
  currentDay = 1,
  onAction,
  disabled,
}: AssetCardProps) {
  const isOwned = mode === "owned";
  const ownedAsset = isOwned ? (asset as Asset) : null;
  const marketAsset = !isOwned ? (asset as MarketAsset) : null;

  // Calculate profit/loss for owned assets
  const profitLoss = ownedAsset
    ? ownedAsset.currentValue - ownedAsset.purchasePrice
    : 0;
  const profitPercent = ownedAsset
    ? ((profitLoss / ownedAsset.purchasePrice) * 100).toFixed(1)
    : 0;

  // Check if boost is active for depreciating assets
  const isBoostActive =
    ownedAsset?.type === "depreciating" && !ownedAsset.boostExpired;
  const daysOwned = ownedAsset ? currentDay - ownedAsset.purchaseDay : 0;
  const boostDaysLeft = ownedAsset?.boostDuration
    ? ownedAsset.boostDuration - daysOwned
    : 0;

  return (
    <div
      className={`p-4 rounded-lg border ${
        asset.type === "appreciating"
          ? "bg-green-50 border-green-200"
          : "bg-orange-50 border-orange-200"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-800">{asset.name}</h4>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              asset.type === "appreciating"
                ? "bg-green-200 text-green-800"
                : "bg-orange-200 text-orange-800"
            }`}
          >
            {asset.type === "appreciating"
              ? "📈 Appreciating"
              : "📉 Depreciating"}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3">{asset.description}</p>

      {/* Price/Value Info */}
      {isOwned && ownedAsset ? (
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Bought for:</span>
            <span>₹{ownedAsset.purchasePrice}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Current value:</span>
            <span className="font-bold">₹{ownedAsset.currentValue}</span>
          </div>
          <div
            className={`flex justify-between text-sm font-medium ${
              profitLoss >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            <span>Profit/Loss:</span>
            <span>
              {profitLoss >= 0 ? "+" : ""}₹{profitLoss} ({profitPercent}%)
            </span>
          </div>

          {/* Boost status for depreciating */}
          {asset.type === "depreciating" && (
            <div
              className={`mt-2 p-2 rounded text-sm ${
                isBoostActive
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isBoostActive ? (
                <>
                  🚀 Boost active! {boostDaysLeft} days left (
                  {((ownedAsset.boostMultiplier || 1) - 1) * 100}% extra income)
                </>
              ) : (
                <>
                  ⚠️ Boost expired. Costly repairs may hit after the fast-growth period.
                </>
              )}
            </div>
          )}

          {/* Days owned */}
          <div className="text-xs text-gray-400 mt-1">
            Owned for {daysOwned} day{daysOwned !== 1 ? "s" : ""}
          </div>
        </div>
      ) : marketAsset ? (
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Price:</span>
            <span className="font-bold text-lg">
              ₹{marketAsset.currentPrice}
            </span>
          </div>

          {/* Asset type specific info */}
          {asset.type === "appreciating" ? (
            <div className="text-xs text-green-600">
              📈 +{((marketAsset.appreciationRate || 0) * 100).toFixed(1)}%
              daily growth
            </div>
          ) : (
            <div className="text-xs text-orange-600">
              🚀 {((marketAsset.boostMultiplier || 1) - 1) * 100}% income boost
              for {marketAsset.boostDuration} days
            </div>
          )}
        </div>
      ) : null}

      {/* Action Button */}
      <Button
        onClick={onAction}
        disabled={disabled}
        variant={isOwned ? "danger" : "success"}
        className="w-full"
        size="sm"
      >
        {isOwned
          ? `Sell for ₹${ownedAsset?.currentValue}`
          : `Buy for ₹${marketAsset?.currentPrice}`}
      </Button>
    </div>
  );
}
