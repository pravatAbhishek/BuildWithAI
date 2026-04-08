"use client";

import { useMemo, useState } from "react";
import type { Variants } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { calculateTreeYield, canWaterTree, getWaterBundleOptions } from "@/lib/gameEngine";
import { BankPanel } from "@/components/banking";
import { WeatherManager } from "./WeatherManager";
import { WeatherOverlay } from "./WeatherOverlay";
import { DailyLesson } from "@/components/lesson";
import type { AssetType, MarketAsset } from "@/types/game";

type Phase = "morning" | "evening" | "night" | "sunrise";
type ShopTab = AssetType | "water";

const treeShakeVariants: Variants = {
  calm: { rotate: 0, scaleY: 1 },
  shake: { rotate: [0, -3, 3, -2, 2, 0], scaleY: [1, 0.95, 1.05, 1] },
};

// Sparkle particle component
function Sparkle({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 bg-yellow-300 rounded-full"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
        x: [0, (Math.random() - 0.5) * 60],
        y: [0, (Math.random() - 0.5) * 60],
      }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      style={{
        boxShadow: "0 0 8px 2px rgba(253, 224, 71, 0.8)",
      }}
    />
  );
}

export function GameCanvas() {
  const {
    tree,
    player,
    ownedAssets,
    marketAssets,
    savings,
    waterTree,
    buyWater,
    buyAsset,
    startNewDay,
    resetGame,
    aiTip,
    showBankModal,
    toggleBankModal,
    depositToSavings,
    withdrawFromSavings,
  } = useGameStore();

  const [phase, setPhase] = useState<Phase>("morning");
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<ShopTab>("water");
  const [shakeTree, setShakeTree] = useState(false);
  const [coinPop, setCoinPop] = useState<number | null>(null);
  const [showSparkles, setShowSparkles] = useState(false);

  const wateringsLeft = Math.max(0, 3 - tree.timesWateredToday);
  const canWater = canWaterTree(tree, player.waterUnits) && phase === "morning";

  const bgClass = useMemo(() => {
    if (phase === "morning") return "from-sky-400 via-cyan-300 to-emerald-300";
    if (phase === "evening") return "from-orange-400 via-amber-300 to-yellow-200";
    if (phase === "night") return "from-indigo-950 via-purple-900 to-slate-900";
    return "from-yellow-300 via-orange-200 to-pink-200";
  }, [phase]);

  const onWater = () => {
    if (!canWater) return;
    setShakeTree(true);
    setShowSparkles(true);
    const earned = calculateTreeYield(tree, ownedAssets, player.currentDay);
    waterTree();
    setCoinPop(earned);
    window.setTimeout(() => setShakeTree(false), 300);
    window.setTimeout(() => setCoinPop(null), 1200);
    window.setTimeout(() => setShowSparkles(false), 1000);

    if (tree.timesWateredToday + 1 >= 3) {
      window.setTimeout(() => setPhase("evening"), 600);
    }
  };

  const onConfirmEvening = () => {
    setPhase("night");
  };

  const onStartNewDay = () => {
    setPhase("sunrise");
    window.setTimeout(() => {
      startNewDay();
      setShopOpen(false);
      setPhase("morning");
    }, 1200);
  };

  return (
    <>
      <WeatherManager />
      <WeatherOverlay />
      <DailyLesson />
      <div
        className={`relative h-screen w-full overflow-hidden bg-gradient-to-b ${bgClass} transition-all duration-1000 ease-in-out`}
      >
        {/* Enhanced Top HUD */}
        <TopHUD
          day={player.currentDay}
          wallet={player.wallet}
          water={player.waterUnits}
          wateringsLeft={wateringsLeft}
          savings={savings.balance}
          onBankClick={toggleBankModal}
        />

        {/* Reset Button with rotation */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => resetGame()}
          className="absolute top-4 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg flex items-center justify-center text-xl hover:shadow-red-500/50 hover:shadow-xl transition-shadow"
        >
          🔄
        </motion.button>

        {/* Scene with Tree */}
        <SceneTree
          treeStage={tree.stage}
          shakeTree={shakeTree}
          phase={phase}
          canWater={canWater}
          onWater={onWater}
          showSparkles={showSparkles}
        />

        {/* Enhanced Coin Pop Animation */}
        <AnimatePresence>
          {coinPop !== null && (
            <motion.div
              key="coin-pop"
              className="absolute left-1/2 top-[48%] z-40 -translate-x-1/2"
            >
              {/* Sparkles */}
              {showSparkles && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  {[...Array(8)].map((_, i) => (
                    <Sparkle key={i} delay={i * 0.05} />
                  ))}
                </div>
              )}
              {/* Coin */}
              <motion.div
                initial={{ y: 0, scale: 0, opacity: 0, rotate: 0 }}
                animate={{
                  y: -100,
                  scale: [0.5, 1.3, 1.1, 1.2],
                  opacity: [0, 1, 1, 0],
                  rotate: [0, 10, -10, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 px-6 py-3 text-4xl font-black text-yellow-900 shadow-2xl"
                style={{
                  boxShadow: "0 0 30px 10px rgba(253, 224, 71, 0.6), 0 8px 32px rgba(0,0,0,0.3)",
                  border: "3px solid rgba(255,255,255,0.5)",
                }}
              >
                +₹{coinPop}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Banking Interface Modal (Evening) */}
        <AnimatePresence>
          {phase === "evening" && (
            <BankingInterfaceModal onConfirm={onConfirmEvening} />
          )}
        </AnimatePresence>

        {/* Night Lesson Bubble */}
        <AnimatePresence>
          {phase === "night" && (
            <NightLessonBubble tip={aiTip} onContinue={onStartNewDay} />
          )}
        </AnimatePresence>

        {/* Spectacular Sunrise */}
        <AnimatePresence>
          {phase === "sunrise" && <SunriseOverlay />}
        </AnimatePresence>

        {/* Bottom Action Buttons */}
        <AnimatePresence>
          {phase === "morning" && (
            <BottomActions
              canEndDay={tree.timesWateredToday > 0}
              onShop={() => setShopOpen(true)}
              onEndDay={() => setPhase("evening")}
              onBank={toggleBankModal}
            />
          )}
        </AnimatePresence>

        {/* Enhanced Shop Modal */}
        <AnimatePresence>
          {shopOpen && (
            <ShopModal
              tab={shopTab}
              setTab={setShopTab}
              marketAssets={marketAssets}
              wallet={player.wallet}
              ownedAssets={ownedAssets}
              onBuy={buyAsset}
              onBuyWater={buyWater}
              onClose={() => setShopOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Quick Bank Access Modal */}
        <AnimatePresence>
          {showBankModal && phase === "morning" && (
            <QuickBankModal onClose={toggleBankModal} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// Enhanced Top HUD
function TopHUD({
  day,
  wallet,
  water,
  wateringsLeft,
  savings,
  onBankClick,
}: {
  day: number;
  wallet: number;
  water: number;
  wateringsLeft: number;
  savings: number;
  onBankClick: () => void;
}) {
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute left-0 right-0 top-0 z-30 p-4"
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-3 shadow-xl border border-white/50">
        {/* Day Counter */}
        <motion.div 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-2xl">📅</span>
          <span className="text-xl font-black text-emerald-800">Day {day}</span>
        </motion.div>

        {/* Wallet with pulsing glow */}
        <motion.div 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-200"
          animate={{ 
            boxShadow: ["0 0 0px rgba(253, 224, 71, 0)", "0 0 15px rgba(253, 224, 71, 0.5)", "0 0 0px rgba(253, 224, 71, 0)"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-2xl">🪙</span>
          <span className="text-xl font-black text-yellow-700">₹{wallet}</span>
        </motion.div>

        {/* Water */}
        <motion.div 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-sky-100 to-blue-200"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-2xl">💧</span>
          <span className="text-xl font-black text-sky-700">{water}</span>
        </motion.div>

        {/* Waterings Left */}
        <motion.div 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-200"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-2xl">🌿</span>
          <span className="text-xl font-black text-indigo-700">{wateringsLeft} left</span>
        </motion.div>

        {/* Savings Quick Access */}
        <motion.button
          onClick={onBankClick}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-green-100 to-emerald-200 hover:from-green-200 hover:to-emerald-300 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-2xl">🏦</span>
          <span className="text-xl font-black text-green-700">₹{savings}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// Enhanced Scene Tree
function SceneTree({
  treeStage,
  phase,
  shakeTree,
  canWater,
  onWater,
  showSparkles,
}: {
  treeStage: "seed" | "sprout" | "small" | "medium" | "large" | "full";
  phase: Phase;
  shakeTree: boolean;
  canWater: boolean;
  onWater: () => void;
  showSparkles: boolean;
}) {
  const treeEmoji = getTreeEmoji(treeStage);

  return (
    <div className="absolute inset-0">
      {/* Ground with gradient */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-1/3 rounded-t-[50%]"
        style={{
          background: "linear-gradient(180deg, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
          boxShadow: "inset 0 20px 40px rgba(255,255,255,0.2), inset 0 -10px 30px rgba(0,0,0,0.1)",
        }}
      />

      {/* Tree with enhanced animation */}
      <motion.div
        className="absolute bottom-[26%] left-1/2 z-20 -translate-x-1/2 cursor-pointer"
        variants={treeShakeVariants}
        animate={shakeTree ? "shake" : "calm"}
        transition={{ duration: 0.3 }}
        onClick={onWater}
        whileHover={canWater ? { scale: 1.05 } : {}}
        style={{ fontSize: "clamp(8rem, 15vw, 13rem)" }}
      >
        {treeEmoji}
      </motion.div>

      {/* Water Button */}
      <AnimatePresence>
        {phase === "morning" && (
          <motion.button
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
            }}
            exit={{ opacity: 0, y: 30 }}
            whileHover={canWater ? { scale: 1.1, y: -5 } : {}}
            whileTap={canWater ? { scale: 0.95 } : {}}
            onClick={onWater}
            disabled={!canWater}
            className={`absolute bottom-[15%] left-1/2 z-30 -translate-x-1/2 rounded-full px-10 py-5 text-3xl font-black text-white shadow-2xl transition-all ${
              canWater 
                ? "bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 hover:shadow-blue-500/50" 
                : "bg-gradient-to-br from-slate-400 to-slate-500 cursor-not-allowed opacity-70"
            }`}
            style={canWater ? {
              boxShadow: "0 10px 40px rgba(59, 130, 246, 0.4), inset 0 -4px 0 rgba(0,0,0,0.1)",
            } : {}}
          >
            <span className="flex items-center gap-3">
              <span className="text-4xl">🪣</span>
              <span>Water</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function getTreeEmoji(stage: "seed" | "sprout" | "small" | "medium" | "large" | "full") {
  if (stage === "seed") return "🫘";
  if (stage === "sprout") return "🌱";
  if (stage === "small") return "🪴";
  if (stage === "medium") return "🌿";
  return "🌳";
}

// Enhanced Bottom Actions
function BottomActions({
  canEndDay,
  onShop,
  onEndDay,
  onBank,
}: {
  canEndDay: boolean;
  onShop: () => void;
  onEndDay: () => void;
  onBank: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="absolute bottom-6 left-0 right-0 z-40 px-4"
    >
      <div className="mx-auto flex max-w-3xl items-center gap-4">
        {/* Shop Button */}
        <motion.button
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShop}
          className="flex-1 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 px-6 py-5 text-2xl font-black text-white shadow-xl hover:shadow-purple-500/40 transition-shadow"
          style={{
            boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3), inset 0 -3px 0 rgba(0,0,0,0.15)",
          }}
        >
          <span className="flex items-center justify-center gap-3">
            <span className="text-3xl">🛒</span>
            <span>Shop</span>
          </span>
        </motion.button>

        {/* Bank Button */}
        <motion.button
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBank}
          className="flex-1 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 px-6 py-5 text-2xl font-black text-white shadow-xl hover:shadow-green-500/40 transition-shadow"
          style={{
            boxShadow: "0 10px 30px rgba(16, 185, 129, 0.3), inset 0 -3px 0 rgba(0,0,0,0.15)",
          }}
        >
          <span className="flex items-center justify-center gap-3">
            <span className="text-3xl">🏦</span>
            <span>Bank</span>
          </span>
        </motion.button>

        {/* End Day Button */}
        <motion.button
          whileHover={canEndDay ? { scale: 1.05, y: -3 } : {}}
          whileTap={canEndDay ? { scale: 0.95 } : {}}
          onClick={onEndDay}
          disabled={!canEndDay}
          className={`flex-1 rounded-2xl px-6 py-5 text-2xl font-black text-white shadow-xl transition-all ${
            canEndDay 
              ? "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 hover:shadow-orange-500/40" 
              : "bg-gradient-to-br from-slate-400 to-slate-500 opacity-60 cursor-not-allowed"
          }`}
          style={canEndDay ? {
            boxShadow: "0 10px 30px rgba(249, 115, 22, 0.3), inset 0 -3px 0 rgba(0,0,0,0.15)",
          } : {}}
        >
          <span className="flex items-center justify-center gap-3">
            <span className="text-3xl">🌙</span>
            <span>End Day</span>
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// Enhanced Shop Modal
function ShopModal({
  tab,
  setTab,
  marketAssets,
  wallet,
  ownedAssets,
  onBuy,
  onBuyWater,
  onClose,
}: {
  tab: ShopTab;
  setTab: (tab: ShopTab) => void;
  marketAssets: MarketAsset[];
  wallet: number;
  ownedAssets: { name: string; type: AssetType }[];
  onBuy: (assetId: string) => void;
  onBuyWater: (units: number) => void;
  onClose: () => void;
}) {
  const filteredAssets = marketAssets.filter((a) => a.type === tab);
  const { ownedAssets: assets } = useGameStore();
  const waterOptions = getWaterBundleOptions(assets);
  const tabButtonStyles: Record<
    "water" | "depreciating" | "appreciating",
    { active: string; inactive: string }
  > = {
    water: {
      active: "bg-sky-500 text-white shadow-lg",
      inactive: "bg-sky-100 text-sky-800 hover:bg-sky-200",
    },
    depreciating: {
      active: "bg-orange-500 text-white shadow-lg",
      inactive: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    },
    appreciating: {
      active: "bg-green-500 text-white shadow-lg",
      inactive: "bg-green-100 text-green-800 hover:bg-green-200",
    },
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm p-3 md:items-center md:justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ y: 50, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 50, scale: 0.95, opacity: 0 }}
        className="w-full max-w-3xl rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-2xl md:p-7"
        style={{
          boxShadow: "0 25px 50px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            🛒 Shop
          </h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-xl transition-colors"
          >
            ✕
          </motion.button>
        </div>

        {/* Wallet Display with pulsing glow */}
        <motion.div 
          className="mb-4 rounded-2xl bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-100 p-4 text-center"
          animate={{ 
            boxShadow: ["0 0 0px rgba(253, 224, 71, 0)", "0 0 20px rgba(253, 224, 71, 0.4)", "0 0 0px rgba(253, 224, 71, 0)"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-3xl font-black text-yellow-800">🪙 ₹{wallet}</span>
        </motion.div>

        {/* Tab Buttons */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            { id: "water" as ShopTab, label: "💧 Water" },
            { id: "depreciating" as ShopTab, label: "⚡ Fast" },
            { id: "appreciating" as ShopTab, label: "📈 Long" },
          ].map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-4 py-3 text-lg font-bold transition-all ${
                tab === t.id
                  ? tabButtonStyles[t.id].active
                  : tabButtonStyles[t.id].inactive
              }`}
              style={tab === t.id ? { 
                boxShadow: `0 4px 15px rgba(0,0,0,0.2)` 
              } : {}}
            >
              {t.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Description */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`mb-4 rounded-xl p-3 text-center text-sm font-medium ${
            tab === "water" 
              ? "bg-sky-50 text-sky-800" 
              : tab === "depreciating"
                ? "bg-orange-50 text-orange-800"
                : "bg-green-50 text-green-800"
          }`}
        >
          {tab === "water" && "Buy water drops to water your plant and earn coins!"}
          {tab === "depreciating" && "Quick boost assets - high returns now, but value decreases over time"}
          {tab === "appreciating" && "Long-term assets - value grows exponentially every 15 days"}
        </motion.div>

        {/* Content */}
        <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-1">
          {tab === "water" ? (
            // Water bundles
            waterOptions.map((option, i) => (
              <motion.div
                key={option.units}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border-2 border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 p-4 hover:border-sky-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">💧</span>
                    <div>
                      <div className="text-xl font-black text-sky-800">{option.label}</div>
                      <div className="text-sm text-sky-600">
                        {option.units > 1 && `Save ₹${option.units * 100 - option.cost}!`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-yellow-700">₹{option.cost}</div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={wallet < option.cost}
                      onClick={() => onBuyWater(option.units)}
                      className={`mt-2 px-6 py-2 rounded-xl font-bold text-white transition-all ${
                        wallet >= option.cost
                          ? "bg-gradient-to-r from-sky-500 to-blue-600 hover:shadow-lg"
                          : "bg-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Buy
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            // Assets
            filteredAssets.map((asset, i) => {
              const owned = ownedAssets.some(
                (a) => a.name === asset.name && a.type === asset.type,
              );
              const canAfford = wallet >= asset.currentPrice && !owned;

              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={canAfford ? { scale: 1.02, x: 5 } : {}}
                  className={`rounded-2xl border-2 p-4 transition-all ${
                    owned
                      ? "border-green-300 bg-green-50"
                      : canAfford
                        ? "border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 hover:border-indigo-300 hover:shadow-lg"
                        : "border-gray-200 bg-gray-50 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-2xl font-black text-slate-800">{asset.name}</div>
                      <div className="mt-1 text-sm text-slate-600">{asset.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-yellow-700">₹{asset.currentPrice}</div>
                      <motion.button
                        whileHover={canAfford ? { scale: 1.05 } : {}}
                        whileTap={canAfford ? { scale: 0.95 } : {}}
                        disabled={!canAfford}
                        onClick={() => onBuy(asset.id)}
                        className={`mt-2 px-6 py-2 rounded-xl font-bold text-white transition-all ${
                          owned
                            ? "bg-green-500"
                            : canAfford
                              ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg"
                              : "bg-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {owned ? "✅ Owned" : canAfford ? "Buy" : "Can't Afford"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Enhanced Banking Interface Modal
function BankingInterfaceModal({
  onConfirm,
}: {
  onConfirm: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl rounded-3xl bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-6 shadow-2xl md:p-8"
        initial={{ y: 30, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 30, scale: 0.95, opacity: 0 }}
        style={{
          boxShadow: "0 25px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        {/* Animated Bank Icon */}
        <motion.div
          className="text-center mb-2"
          animate={{ 
            rotateY: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          <span className="text-6xl">🏦</span>
        </motion.div>
        
        <h2 className="text-center text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
          Banking Center
        </h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          Manage your savings and investments before the day ends
        </p>

        <div className="mb-6">
          <BankPanel />
        </div>

        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onConfirm}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 py-5 text-2xl font-black text-white shadow-xl hover:shadow-indigo-500/40 transition-shadow"
          animate={{
            boxShadow: ["0 0 0px rgba(99, 102, 241, 0)", "0 0 30px rgba(99, 102, 241, 0.4)", "0 0 0px rgba(99, 102, 241, 0)"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="flex items-center justify-center gap-3">
            <span>Continue to Night</span>
            <span className="text-3xl">🌙</span>
          </span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// Enhanced Night Lesson Bubble
function NightLessonBubble({
  tip,
  onContinue,
}: {
  tip: string | null;
  onContinue: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-end justify-center bg-gradient-to-b from-black/30 to-black/50 backdrop-blur-sm p-4 pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl rounded-3xl bg-gradient-to-br from-white via-indigo-50 to-purple-50 p-6 shadow-2xl md:p-8"
        initial={{ y: 50, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 30, scale: 0.95, opacity: 0 }}
        style={{
          boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 100px rgba(99, 102, 241, 0.2)",
        }}
      >
        {/* Animated Owl */}
        <motion.div 
          className="mb-4 text-center"
          animate={{ 
            rotate: [0, -5, 5, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-7xl">🦉</span>
        </motion.div>

        {/* Speech Bubble */}
        <div className="relative rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 p-5 mb-6">
          <div className="absolute -bottom-3 left-16 w-6 h-6 bg-indigo-100 transform rotate-45" />
          <p className="text-center text-xl font-bold text-indigo-900 relative z-10">
            {tip ?? "Great choices today! Keep balancing saving and investing. 💫"}
          </p>
        </div>

        {/* Continue Button with glow */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 py-5 text-2xl font-black text-white shadow-xl hover:shadow-emerald-500/40 transition-shadow"
          animate={{
            boxShadow: ["0 0 0px rgba(16, 185, 129, 0)", "0 0 40px rgba(16, 185, 129, 0.5)", "0 0 0px rgba(16, 185, 129, 0)"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="flex items-center justify-center gap-3">
            <span className="text-3xl">☀️</span>
            <span>Start New Day</span>
          </span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// Spectacular Sunrise Overlay
function SunriseOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Sky gradient transition */}
      <motion.div
        className="absolute inset-0"
        initial={{ background: "linear-gradient(to bottom, #1e1b4b, #312e81, #1e3a5f)" }}
        animate={{ 
          background: [
            "linear-gradient(to bottom, #1e1b4b, #312e81, #1e3a5f)",
            "linear-gradient(to bottom, #fef3c7, #fde68a, #fcd34d)",
            "linear-gradient(to bottom, #bfdbfe, #93c5fd, #60a5fa)",
          ]
        }}
        transition={{ duration: 1.2, times: [0, 0.5, 1] }}
      />

      {/* Sun rays */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 bg-gradient-to-t from-yellow-400 to-transparent"
          style={{
            height: "50vh",
            transformOrigin: "bottom center",
            rotate: `${i * 30}deg`,
            bottom: "50%",
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ 
            opacity: [0, 0.6, 0],
            scaleY: [0, 1, 0.5],
          }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />
      ))}

      {/* Sun */}
      <motion.div
        initial={{ y: 200, scale: 0.5, opacity: 0 }}
        animate={{ 
          y: [-50, -100],
          scale: [0.5, 1.5, 1.2],
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative"
      >
        <motion.div
          className="text-[10rem] filter drop-shadow-2xl"
          animate={{ rotate: [0, 180] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            textShadow: "0 0 60px rgba(253, 224, 71, 0.8), 0 0 120px rgba(253, 224, 71, 0.4)",
          }}
        >
          ☀️
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Quick Bank Modal (accessible during morning)
function QuickBankModal({ onClose }: { onClose: () => void }) {
  const { player, savings, depositToSavings, withdrawFromSavings } = useGameStore();
  const [amount, setAmount] = useState(50);
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");

  const canDeposit = mode === "deposit" && player.wallet >= amount && amount > 0;
  const canWithdraw = mode === "withdraw" && savings.balance >= amount && amount > 0;

  const handleAction = () => {
    if (mode === "deposit" && canDeposit) {
      depositToSavings(amount);
    } else if (mode === "withdraw" && canWithdraw) {
      withdrawFromSavings(amount);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl bg-gradient-to-br from-white via-green-50 to-emerald-50 p-6 shadow-2xl"
        initial={{ y: 30, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 30, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-emerald-800">🏦 Quick Bank</h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center"
          >
            ✕
          </motion.button>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-yellow-100 p-3 text-center">
            <div className="text-sm text-gray-600">💵 Cash</div>
            <div className="text-xl font-black text-yellow-700">₹{player.wallet}</div>
          </div>
          <div className="rounded-xl bg-green-100 p-3 text-center">
            <div className="text-sm text-gray-600">🏦 Savings</div>
            <div className="text-xl font-black text-green-700">₹{savings.balance}</div>
          </div>
        </div>

        <div className="text-center text-sm text-green-600 mb-4">
          💡 Savings earn 1% interest daily!
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
          <button
            className={`flex-1 py-3 font-bold transition-colors ${
              mode === "deposit"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
            onClick={() => setMode("deposit")}
          >
            ⬇️ Deposit
          </button>
          <button
            className={`flex-1 py-3 font-bold transition-colors ${
              mode === "withdraw"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
            onClick={() => setMode("withdraw")}
          >
            ⬆️ Withdraw
          </button>
        </div>

        {/* Amount Input */}
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-xl font-bold focus:outline-none focus:border-green-500 mb-3"
        />

        {/* Quick Amounts */}
        <div className="flex gap-2 mb-4">
          {[50, 100, 200].map((amt) => (
            <button
              key={amt}
              onClick={() => setAmount(amt)}
              className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-colors"
            >
              ₹{amt}
            </button>
          ))}
          <button
            onClick={() => setAmount(mode === "deposit" ? player.wallet : savings.balance)}
            className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-colors"
          >
            All
          </button>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={canDeposit || canWithdraw ? { scale: 1.02 } : {}}
          whileTap={canDeposit || canWithdraw ? { scale: 0.98 } : {}}
          onClick={handleAction}
          disabled={mode === "deposit" ? !canDeposit : !canWithdraw}
          className={`w-full py-4 rounded-xl font-black text-white text-lg transition-all ${
            (mode === "deposit" ? canDeposit : canWithdraw)
              ? mode === "deposit"
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : "bg-gradient-to-r from-blue-500 to-indigo-600"
              : "bg-slate-400 cursor-not-allowed"
          }`}
        >
          {mode === "deposit" ? `⬇️ Deposit ₹${amount}` : `⬆️ Withdraw ₹${amount}`}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
