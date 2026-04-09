"use client";

import { useGameStore } from "@/store/gameStore";
import { Card } from "@/components/ui";
import { AssetCard } from "./AssetCard";

export function AssetShop() {
  const { player, marketAssets, buyAsset } = useGameStore();

  // Separate by type
  const appreciatingAssets = marketAssets.filter(
    (a) => a.type === "appreciating",
  );
  const depreciatingAssets = marketAssets.filter(
    (a) => a.type === "depreciating",
  );

  return (
    <Card title="Asset Market" icon="🏪">
      <div className="space-y-4">
        {/* Appreciating Assets */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-green-500">📈</span> Long-term Investments
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Increases tree earnings permanently by 12-18% every day after purchase.
          </p>
          <div className="space-y-3">
            {appreciatingAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                mode="market"
                onAction={() => buyAsset(asset.id)}
                disabled={player.wallet < asset.currentPrice}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-4">
          {/* Depreciating Assets */}
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-orange-500">🚀</span> Boost Items (Use
            Carefully!)
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Gives quick boost to daily earnings for 2-3 days but will need costly repairs later.
          </p>
          <div className="space-y-3">
            {depreciatingAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                mode="market"
                onAction={() => buyAsset(asset.id)}
                disabled={player.wallet < asset.currentPrice}
              />
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-800">
            💡 <strong>Tip:</strong> Depreciating assets (like vehicles) give
            great boosts at first, but costly repairs can hit after the boost period.
          </p>
        </div>
      </div>
    </Card>
  );
}
