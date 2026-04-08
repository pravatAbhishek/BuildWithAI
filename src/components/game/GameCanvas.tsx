"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Variants } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import {
  applyWeatherModifier,
  calculateTreeYield,
  canWaterTree,
  getWaterBundleOptions,
} from "@/lib/gameEngine";
import { GAME_CONFIG } from "@/lib/constants";
import { calculateAssetValue } from "@/lib/assetCalculator";
import { BankPanel } from "@/components/banking";
import { WeatherManager } from "./WeatherManager";
import { WeatherOverlay } from "./WeatherOverlay";
import { DailyLesson } from "@/components/lesson";
import type { AssetType, MarketAsset, Asset, SuddenEvent } from "@/types/game";
import { EventCard } from "./EventCard";
import { ConsequenceReel } from "./ConsequenceReel";

type Phase = "morning" | "events" | "evening" | "night" | "sunrise";
type ShopTab = AssetType | "water";

const treeShakeVariants: Variants = {
  calm: { rotate: 0, scaleY: 1 },
  shake: { rotate: [0, -3, 3, -2, 2, 0], scaleY: [1, 0.95, 1.05, 1] },
};

// Sparkle particle component
function Sparkle({
  delay = 0,
  offsetX,
  offsetY,
}: {
  delay?: number;
  offsetX: number;
  offsetY: number;
}) {
  return (
    <motion.div
      className="absolute w-2 h-2 bg-yellow-300 rounded-full"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
        x: [0, offsetX],
        y: [0, offsetY],
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
    currentDay,
    riskMeter,
    riskLevel,
    treeHealth,
    currentWeather,
    fixedDeposits,
    sips,
    waterTree,
    buyWater,
    buyAsset,
    sellAsset,
    advanceDay,
    resetGame,
    aiTip,
    showBankModal,
    toggleBankModal,
    activeSuddenEvent,
    showSuddenEvent,
    resolveSuddenEvent,
    activeGameEvent,
    activeDailyEvents,
    handleEventChoice,
    eventConsequences,
    maintenanceChargesToday,
    showMaintenancePopup,
    dismissMaintenancePopup,
    isGameOver,
    gameOverReason,
  } = useGameStore();

  const [phase, setPhase] = useState<Phase>("morning");
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<ShopTab>("water");
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [shakeTree, setShakeTree] = useState(false);
  const [coinPop, setCoinPop] = useState<number | null>(null);
  const [showSparkles, setShowSparkles] = useState(false);
  const morningAwardRef = useRef<number>(0);

  const wateringsLeft = Math.max(0, 3 - tree.timesWateredToday);
  const canWater =
      canWaterTree(tree, player.waterUnits) &&
      phase === "morning" &&
    !showSuddenEvent &&
    !isGameOver;

  const bgClass = useMemo(() => {
    if (phase === "morning") return "from-sky-400 via-cyan-300 to-emerald-300";
    if (phase === "evening") return "from-orange-400 via-amber-300 to-yellow-200";
    if (phase === "night") return "from-indigo-950 via-purple-900 to-slate-900";
    return "from-yellow-300 via-orange-200 to-pink-200";
  }, [phase]);

  const inventoryValue = useMemo(
    () =>
      ownedAssets.reduce(
        (sum, asset) => sum + calculateAssetValue(asset, player.currentDay),
        0,
      ),
    [ownedAssets, player.currentDay],
  );

  const netWorth = player.wallet + savings.balance + inventoryValue;

  useEffect(() => {
    if (morningAwardRef.current === currentDay) return;
    morningAwardRef.current = currentDay;
    const morningEarnings = Math.floor(
      calculateTreeYield(
        tree,
        ownedAssets,
        currentDay,
        player.investmentBalance,
        riskMeter,
      ),
    );
    useGameStore.setState((state) => ({
      player: {
        ...state.player,
        wallet: state.player.wallet + morningEarnings,
        totalEarnings: state.player.totalEarnings + morningEarnings,
      },
    }));
    window.setTimeout(() => setCoinPop(morningEarnings), 0);
    window.setTimeout(() => setShowSparkles(true), 0);
    window.setTimeout(() => setCoinPop(null), 1200);
    window.setTimeout(() => setShowSparkles(false), 900);
  }, [currentDay, ownedAssets, player.investmentBalance, riskMeter, tree]);

  useEffect(() => {
    if (phase !== "morning" || isGameOver) return;
    const interval = window.setInterval(() => {
      const autoYield = Math.floor(
        calculateTreeYield(tree, ownedAssets, currentDay, player.investmentBalance, riskMeter) * 0.2,
      );
      setCoinPop(autoYield);
      window.setTimeout(() => setCoinPop(null), 900);
    }, 4500);
    const timeout = window.setTimeout(
      () => setPhase("events"),
      GAME_CONFIG.MORNING_PHASE_DURATION_MS,
    );
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [phase, isGameOver, tree, ownedAssets, currentDay, player.investmentBalance, riskMeter]);

  useEffect(() => {
    if (phase !== "events" || isGameOver) return;
    if (!activeGameEvent && activeDailyEvents.length === 0) {
      const timeout = window.setTimeout(() => setPhase("evening"), 1000);
      return () => window.clearTimeout(timeout);
    }
  }, [phase, activeGameEvent, activeDailyEvents.length, isGameOver]);

  const missions = useMemo(
    () => [
      {
        id: "emergency-fund",
        title: "Emergency Fund Builder",
        description: "Keep ₹500 in savings.",
        progress: Math.min(savings.balance, 500),
        target: 500,
        unit: "₹",
      },
      {
        id: "first-fd",
        title: "Start a Fixed Deposit",
        description: "Create at least one FD.",
        progress: Math.min(fixedDeposits.length, 1),
        target: 1,
        unit: "",
      },
      {
        id: "first-sip",
        title: "Monthly SIP Discipline",
        description: "Start a SIP for 1 or 2 months.",
        progress: Math.min(sips.length, 1),
        target: 1,
        unit: "",
      },
      {
        id: "long-term-investor",
        title: "Own a Growing Asset",
        description: "Buy at least one appreciating asset.",
        progress: Math.min(
          ownedAssets.filter((asset) => asset.type === "appreciating").length,
          1,
        ),
        target: 1,
        unit: "",
      },
      {
        id: "net-worth",
        title: "Net Worth ₹2000",
        description: "Reach ₹2000 across wallet, savings, and assets.",
        progress: Math.min(Math.max(netWorth, 0), 2000),
        target: 2000,
        unit: "₹",
      },
    ],
    [fixedDeposits.length, netWorth, ownedAssets, savings.balance, sips.length],
  );

  const onWater = () => {
    if (!canWater) return;
    setShakeTree(true);
    setShowSparkles(true);
    const earned = applyWeatherModifier(
      calculateTreeYield(tree, ownedAssets, player.currentDay),
      currentWeather,
    );
    waterTree();
    setCoinPop(earned);
    window.setTimeout(() => setShakeTree(false), 300);
    window.setTimeout(() => setCoinPop(null), 1200);
    window.setTimeout(() => setShowSparkles(false), 1000);

  };

  const onConfirmEvening = () => {
    setPhase("night");
  };

  const onStartNewDay = () => {
    setPhase("sunrise");
    window.setTimeout(() => {
      advanceDay();
      setShopOpen(false);
      setMissionsOpen(false);
      setInventoryOpen(false);
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
          day={currentDay}
          wallet={player.wallet}
          water={player.waterUnits}
          wateringsLeft={wateringsLeft}
          savings={savings.balance}
          riskMeter={riskMeter}
          riskLevel={riskLevel}
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
          treeHealth={treeHealth.value}
          shakeTree={shakeTree}
          phase={phase}
          canWater={canWater}
          onWater={onWater}
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
                    <Sparkle
                      key={i}
                      delay={i * 0.05}
                      offsetX={Math.cos((i / 8) * Math.PI * 2) * 32}
                      offsetY={Math.sin((i / 8) * Math.PI * 2) * 32}
                    />
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

        <AnimatePresence>
          {phase === "events" && (
            <motion.div
              className="absolute top-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900/80 px-4 py-2 text-sm font-bold text-white"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              ⚡ Event Time
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "events" && (
          <EventCard
            event={activeGameEvent}
            onChoice={(choiceId) => {
              handleEventChoice(choiceId);
              window.setTimeout(() => {
                if (!useGameStore.getState().activeGameEvent) setPhase("evening");
              }, 250);
            }}
          />
        )}

        {/* Night Lesson Bubble */}
        <AnimatePresence>
          {phase === "night" && (
            <NightLessonBubble
              tip={aiTip}
              onContinue={onStartNewDay}
              treeHealth={treeHealth.value}
              riskMeter={riskMeter}
              consequences={eventConsequences}
            />
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
              canEndDay={tree.timesWateredToday > 0 && !showSuddenEvent && !isGameOver}
              onShop={() => !showSuddenEvent && !isGameOver && setShopOpen(true)}
              onEndDay={() => !showSuddenEvent && !isGameOver && setPhase("events")}
              onBank={() => !showSuddenEvent && !isGameOver && toggleBankModal()}
              onMissions={() => setMissionsOpen(true)}
              onInventory={() => setInventoryOpen(true)}
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
          {showBankModal && phase === "morning" && !showSuddenEvent && !isGameOver && (
            <QuickBankModal onClose={toggleBankModal} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuddenEvent && activeSuddenEvent && (
            <SuddenEventModal
              event={activeSuddenEvent}
              onSelect={resolveSuddenEvent}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {missionsOpen && (
            <MissionsModal
              missions={missions}
              onClose={() => setMissionsOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {inventoryOpen && (
            <InventoryModal
              assets={ownedAssets}
              currentDay={player.currentDay}
              onSell={sellAsset}
              onClose={() => setInventoryOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showMaintenancePopup && maintenanceChargesToday.length > 0 && (
            <MaintenancePopup
              charges={maintenanceChargesToday}
              onClose={dismissMaintenancePopup}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isGameOver && (
            <GameOverOverlay
              reason={gameOverReason}
              netWorth={netWorth}
              onRestart={resetGame}
            />
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
  riskMeter,
  riskLevel,
  onBankClick,
}: {
  day: number;
  wallet: number;
  water: number;
  wateringsLeft: number;
  savings: number;
  riskMeter: number;
  riskLevel: "low" | "medium" | "high";
  onBankClick: () => void;
}) {
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute left-0 right-0 top-0 z-30 p-4"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl bg-white/95 backdrop-blur-sm px-4 py-3 shadow-xl border border-white/50 gap-2">
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
        <motion.div className="min-w-40 rounded-xl bg-slate-100 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Risk {riskLevel}</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${
                riskMeter > 65 ? "bg-red-500" : riskMeter > 35 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, riskMeter)}%` }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Enhanced Scene Tree
function SceneTree({
  treeStage,
  treeHealth,
  phase,
  shakeTree,
  canWater,
  onWater,
}: {
  treeStage: "seed" | "sprout" | "small" | "medium" | "large" | "full";
  treeHealth: number;
  phase: Phase;
  shakeTree: boolean;
  canWater: boolean;
  onWater: () => void;
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
        whileInView={{
          filter:
            treeHealth > 85
              ? "drop-shadow(0 0 18px rgba(234,179,8,0.8))"
              : treeHealth > 45
                ? "drop-shadow(0 0 12px rgba(34,197,94,0.5))"
                : "saturate(0.7)",
        }}
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
  onMissions,
  onInventory,
}: {
  canEndDay: boolean;
  onShop: () => void;
  onEndDay: () => void;
  onBank: () => void;
  onMissions: () => void;
  onInventory: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="absolute bottom-6 left-0 right-0 z-40 px-4"
    >
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-5">
        <motion.button
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShop}
          className="rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 px-4 py-4 text-lg font-black text-white shadow-xl hover:shadow-purple-500/40 transition-shadow"
          style={{
            boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3), inset 0 -3px 0 rgba(0,0,0,0.15)",
          }}
        >
          <span className="flex items-center justify-center gap-3">
            <span className="text-2xl">🛒</span>
            <span>Shop</span>
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBank}
          className="rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 px-4 py-4 text-lg font-black text-white shadow-xl hover:shadow-green-500/40 transition-shadow"
          style={{
            boxShadow: "0 10px 30px rgba(16, 185, 129, 0.3), inset 0 -3px 0 rgba(0,0,0,0.15)",
          }}
        >
          <span className="flex items-center justify-center gap-3">
            <span className="text-2xl">🏦</span>
            <span>Bank</span>
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMissions}
          className="rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 px-4 py-4 text-lg font-black text-white shadow-xl hover:shadow-sky-500/40 transition-shadow"
          style={{
            boxShadow: "0 10px 30px rgba(14, 165, 233, 0.3), inset 0 -3px 0 rgba(0,0,0,0.15)",
          }}
        >
          <span className="flex items-center justify-center gap-3">
            <span className="text-2xl">🎯</span>
            <span>Missions</span>
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={onInventory}
          className="rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-600 px-4 py-4 text-lg font-black text-white shadow-xl hover:shadow-pink-500/40 transition-shadow"
          style={{
            boxShadow: "0 10px 30px rgba(236, 72, 153, 0.3), inset 0 -3px 0 rgba(0,0,0,0.15)",
          }}
        >
          <span className="flex items-center justify-center gap-3">
            <span className="text-2xl">🧾</span>
            <span>Inventory</span>
          </span>
        </motion.button>

        <motion.button
          whileHover={canEndDay ? { scale: 1.05, y: -3 } : {}}
          whileTap={canEndDay ? { scale: 0.95 } : {}}
          onClick={onEndDay}
          disabled={!canEndDay}
          className={`rounded-2xl px-4 py-4 text-lg font-black text-white shadow-xl transition-all ${
            canEndDay 
              ? "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 hover:shadow-orange-500/40" 
              : "bg-gradient-to-br from-slate-400 to-slate-500 opacity-60 cursor-not-allowed"
          }`}
          style={canEndDay ? {
            boxShadow: "0 10px 30px rgba(249, 115, 22, 0.3), inset 0 -3px 0 rgba(0,0,0,0.15)",
          } : {}}
        >
          <span className="flex items-center justify-center gap-3">
            <span className="text-2xl">🌙</span>
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
  treeHealth,
  riskMeter,
  consequences,
}: {
  tip: string | null;
  onContinue: () => void;
  treeHealth: number;
  riskMeter: number;
  consequences: Array<{ id: string; icon: string; title: string; summary: string }>;
}) {
  const shareWithFamily = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#E0F2FE";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#166534";
    ctx.font = "bold 60px sans-serif";
    ctx.fillText("🌳 Growtopia Day Summary", 70, 90);
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(`Tree Health: ${treeHealth}%`, 70, 180);
    ctx.fillText(`Risk Meter: ${riskMeter}%`, 70, 240);
    ctx.fillText(`Top Choice: ${consequences.at(-1)?.summary ?? "Steady day"}`, 70, 300);
    const link = document.createElement("a");
    link.download = `growtopia-day.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

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
        <ConsequenceReel items={consequences} />
        <button
          onClick={shareWithFamily}
          aria-label="Share day summary as PNG"
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 py-3 text-lg font-black text-white"
        >
          📸 Share with Family
        </button>
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

function SuddenEventModal({
  event,
  onSelect,
}: {
  event: SuddenEvent;
  onSelect: (optionId: string) => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-[65] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl"
        initial={{ y: 20, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.96 }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Sudden Event</p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">{event.title}</h2>
        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{event.scenario}</p>

        <div className="mt-4 space-y-2">
          {event.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              <p className="font-bold text-slate-900">{option.label}</p>
              <p className="mt-1 text-sm text-slate-600">{option.resultText}</p>
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-amber-700">
          Choose carefully. This decision affects growth, financial stability, and tomorrow&apos;s review.
        </p>
      </motion.div>
    </motion.div>
  );
}

function MissionsModal({
  missions,
  onClose,
}: {
  missions: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    target: number;
    unit: string;
  }>;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-xl rounded-3xl bg-gradient-to-br from-white via-cyan-50 to-sky-50 p-6 shadow-2xl"
        initial={{ y: 20, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-black text-sky-900">🎯 Missions</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-600 hover:bg-slate-300"
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          {missions.map((mission) => {
            const progressRatio = mission.target === 0 ? 0 : mission.progress / mission.target;
            const progressPercent = Math.min(100, Math.floor(progressRatio * 100));
            const completed = progressPercent >= 100;

            return (
              <div
                key={mission.id}
                className={`rounded-2xl border p-4 ${
                  completed ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{mission.title}</p>
                    <p className="text-xs text-slate-600">{mission.description}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {mission.unit}
                    {Math.floor(mission.progress)} / {mission.unit}
                    {mission.target}
                  </p>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      completed ? "bg-emerald-500" : "bg-sky-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function InventoryModal({
  assets,
  currentDay,
  onSell,
  onClose,
}: {
  assets: Asset[];
  currentDay: number;
  onSell: (assetId: string) => void;
  onClose: () => void;
}) {
  const portfolio = assets.map((asset) => {
    const sellValue = calculateAssetValue(asset, currentDay);
    return {
      ...asset,
      sellValue,
      profitLoss: sellValue - asset.purchasePrice,
    };
  });

  return (
    <motion.div
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-3xl rounded-3xl bg-gradient-to-br from-white via-fuchsia-50 to-rose-50 p-6 shadow-2xl"
        initial={{ y: 20, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-black text-rose-900">🧾 Inventory</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-600 hover:bg-slate-300"
          >
            Close
          </button>
        </div>

        {portfolio.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-600">
            No assets yet. Buy assets from shop and review sell value here.
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {portfolio.map((asset) => (
              <div key={asset.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-900">{asset.name}</p>
                    <p className="text-xs text-slate-500">Owned since day {asset.purchaseDay}</p>
                    <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
                      Bought at: ₹{asset.purchasePrice} | Sell now: ₹{asset.sellValue}
                    </div>
                    <p
                      className={`mt-2 text-sm font-semibold ${
                        asset.profitLoss >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {asset.profitLoss >= 0 ? "+" : ""}₹{asset.profitLoss} {asset.profitLoss >= 0 ? "profit" : "loss"}
                    </p>
                  </div>

                  <button
                    onClick={() => onSell(asset.id)}
                    className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-bold text-white hover:from-rose-600 hover:to-red-700"
                  >
                    Sell for ₹{asset.sellValue}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-rose-700">
          Depreciating assets lose value and their maintenance can rise exponentially. Sell at the right time.
        </p>
      </motion.div>
    </motion.div>
  );
}

function MaintenancePopup({
  charges,
  onClose,
}: {
  charges: Array<{ assetId: string; assetName: string; cost: number; note: string }>;
  onClose: () => void;
}) {
  const total = charges.reduce((sum, charge) => sum + charge.cost, 0);

  return (
    <motion.div
      className="absolute inset-0 z-[62] flex items-center justify-center bg-black/35 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
        initial={{ y: 20, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.96 }}
      >
        <h3 className="text-2xl font-black text-slate-900">🧰 Daily Maintenance</h3>
        <p className="mt-2 text-sm text-slate-600">
          Your depreciating assets consumed ₹{total} today.
        </p>

        <div className="mt-4 space-y-2">
          {charges.map((charge) => (
            <div
              key={charge.assetId}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <p className="font-semibold text-slate-800">{charge.assetName}: ₹{charge.cost}</p>
              <p className="text-xs text-slate-600">{charge.note}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Understood
        </button>
      </motion.div>
    </motion.div>
  );
}

function GameOverOverlay({
  reason,
  netWorth,
  onRestart,
}: {
  reason: string | null;
  netWorth: number;
  onRestart: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"
        initial={{ y: 20, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.96 }}
      >
        <h3 className="text-3xl font-black text-red-600">Game Over</h3>
        <p className="mt-3 text-sm text-slate-700">
          {reason || "Your financial position dropped below zero."}
        </p>
        <p className="mt-2 font-semibold text-slate-900">Net Worth: ₹{netWorth}</p>

        <button
          onClick={onRestart}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 text-sm font-semibold text-white hover:from-emerald-600 hover:to-green-700"
        >
          Restart and Try Better Planning
        </button>
      </motion.div>
    </motion.div>
  );
}
