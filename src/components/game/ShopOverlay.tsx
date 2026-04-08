"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { MARKET_ASSETS } from "@/lib/constants";

export function ShopOverlay() {
  const { player, currentScreen, setScreen, buyWater, buyAsset, ownedAssets } =
    useGameStore();
  const [activeTab, setActiveTab] = useState<"water" | "assets">("water");

  if (currentScreen !== "shop") return null;

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setScreen("play")}
      />

      {/* Shop panel */}
      <div className="absolute bottom-0 left-0 right-0 animate-slide-up">
        <div
          className="bg-gradient-to-b from-amber-100 to-amber-50 rounded-t-3xl p-4 pb-8 shadow-2xl"
          style={{ maxHeight: "80vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-amber-800 flex items-center gap-2">
              🏪 Shop
            </h2>
            <button
              onClick={() => setScreen("play")}
              className="w-10 h-10 rounded-full bg-red-500 text-white text-xl font-bold shadow-lg hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Balance */}
          <div className="bg-white rounded-xl p-3 mb-4 flex items-center justify-center gap-2 shadow">
            <span className="text-2xl">🪙</span>
            <span className="text-xl font-bold text-yellow-600">
              ₹{player.wallet}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden mb-4 shadow">
            <button
              className={`flex-1 py-2 font-bold transition-colors ${
                activeTab === "water"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600"
              }`}
              onClick={() => setActiveTab("water")}
            >
              💧 Water
            </button>
            <button
              className={`flex-1 py-2 font-bold transition-colors ${
                activeTab === "assets"
                  ? "bg-purple-500 text-white"
                  : "bg-white text-gray-600"
              }`}
              onClick={() => setActiveTab("assets")}
            >
              🛍️ Assets
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: "45vh" }}>
            {activeTab === "water" ? (
              <WaterShopContent
                buyWater={buyWater}
                wallet={player.wallet}
                waterUnits={player.waterUnits}
              />
            ) : (
              <AssetsShopContent
                buyAsset={buyAsset}
                wallet={player.wallet}
                ownedAssets={ownedAssets}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WaterShopContent({
  buyWater,
  wallet,
  waterUnits,
}: {
  buyWater: (units: number) => void;
  wallet: number;
  waterUnits: number;
}) {
  const waterPacks = [
    { units: 3, price: 30, emoji: "💧", label: "Small Pack" },
    { units: 5, price: 45, emoji: "💧💧", label: "Medium Pack", popular: true },
    { units: 10, price: 80, emoji: "💧💧💧", label: "Big Pack" },
  ];

  return (
    <div className="space-y-3">
      {/* Current water */}
      <div className="bg-blue-50 rounded-xl p-3 text-center">
        <span className="text-gray-600">Your water: </span>
        <span className="text-xl font-bold text-blue-600">💧 {waterUnits}</span>
      </div>

      {/* Water packs */}
      {waterPacks.map((pack) => {
        const canAfford = wallet >= pack.price;
        return (
          <div
            key={pack.units}
            className={`relative bg-white rounded-xl p-4 shadow-md border-2 transition-all ${
              canAfford
                ? "border-blue-200 hover:border-blue-400 hover:shadow-lg cursor-pointer"
                : "border-gray-200 opacity-60"
            }`}
            onClick={() => canAfford && buyWater(pack.units)}
          >
            {pack.popular && (
              <div className="absolute -top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                ⭐ BEST VALUE
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{pack.emoji}</span>
                <div>
                  <div className="font-bold text-gray-800">{pack.label}</div>
                  <div className="text-sm text-gray-500">
                    {pack.units} water units
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-lg font-bold ${canAfford ? "text-green-600" : "text-red-500"}`}
                >
                  ₹{pack.price}
                </div>
                <div className="text-xs text-gray-400">
                  ₹{(pack.price / pack.units).toFixed(0)}/unit
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssetsShopContent({
  buyAsset,
  wallet,
  ownedAssets,
}: {
  buyAsset: (id: string) => void;
  wallet: number;
  ownedAssets: { id: string }[];
}) {
  const ownedIds = new Set(ownedAssets.map((a) => a.id));

  return (
    <div className="space-y-3">
      {/* Info */}
      <div className="bg-purple-50 rounded-xl p-3 text-center text-sm text-purple-700">
        💡 Assets give special boosts to your earnings!
      </div>

      {/* Assets */}
      {MARKET_ASSETS.map((asset) => {
        const owned = ownedIds.has(asset.id);
        const canAfford = wallet >= asset.currentPrice;

        return (
          <div
            key={asset.id}
            className={`bg-white rounded-xl p-4 shadow-md border-2 transition-all ${
              owned
                ? "border-green-400 bg-green-50"
                : canAfford
                  ? "border-purple-200 hover:border-purple-400 hover:shadow-lg cursor-pointer"
                  : "border-gray-200 opacity-60"
            }`}
            onClick={() => !owned && canAfford && buyAsset(asset.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{asset.name.split(" ")[0]}</span>
                <div>
                  <div className="font-bold text-gray-800">
                    {asset.name.split(" ").slice(1).join(" ")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {asset.description}
                  </div>

                  {/* Asset benefits */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {asset.boostMultiplier && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        +{Math.round((asset.boostMultiplier - 1) * 100)}%
                        earnings
                      </span>
                    )}
                    {asset.boostDuration && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {asset.boostDuration} days
                      </span>
                    )}
                    {asset.appreciationRate && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        +{(asset.appreciationRate * 100).toFixed(1)}%/day
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {owned ? (
                  <span className="text-green-600 font-bold">✓ Owned</span>
                ) : (
                  <div
                    className={`text-lg font-bold ${canAfford ? "text-green-600" : "text-red-500"}`}
                  >
                    ₹{asset.currentPrice}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
