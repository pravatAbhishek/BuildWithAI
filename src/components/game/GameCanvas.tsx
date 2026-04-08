"use client";

import { useMemo, useState } from "react";
import type { Variants } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { calculateTreeYield, canWaterTree } from "@/lib/gameEngine";
import type { AssetType, MarketAsset } from "@/types/game";

type Phase = "morning" | "evening" | "night" | "sunrise";
type ShopTab = AssetType;

const treeShakeVariants: Variants = {
  calm: { rotate: 0, scaleY: 1 },
  shake: { rotate: [0, -3, 3, -2, 2, 0], scaleY: [1, 0.95, 1.05, 1] },
};

export function GameCanvas() {
  const {
    tree,
    player,
    ownedAssets,
    marketAssets,
    waterTree,
    buyAsset,
    saveToBank,
    investMoney,
    startNewDay,
    aiTip,
  } = useGameStore();

  const [phase, setPhase] = useState<Phase>("morning");
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<ShopTab>("depreciating");
  const [shakeTree, setShakeTree] = useState(false);
  const [coinPop, setCoinPop] = useState<number | null>(null);
  const [bankChoice, setBankChoice] = useState(0);
  const [investChoice, setInvestChoice] = useState(0);

  const wateringsLeft = Math.max(0, 3 - tree.timesWateredToday);
  const canWater = canWaterTree(tree, player.waterUnits) && phase === "morning";
  const remaining = Math.max(0, player.wallet - bankChoice - investChoice);

  const bgClass = useMemo(() => {
    if (phase === "morning") return "from-sky-300 via-cyan-200 to-emerald-200";
    if (phase === "evening")
      return "from-orange-300 via-amber-200 to-emerald-200";
    if (phase === "night") return "from-indigo-950 via-blue-900 to-slate-900";
    return "from-yellow-200 via-orange-100 to-sky-300";
  }, [phase]);

  const onWater = () => {
    if (!canWater) return;
    setShakeTree(true);
    const earned = calculateTreeYield(tree, ownedAssets, player.currentDay);
    waterTree();
    setCoinPop(earned);
    window.setTimeout(() => setShakeTree(false), 250);
    window.setTimeout(() => setCoinPop(null), 900);

    if (tree.timesWateredToday + 1 >= 3) {
      window.setTimeout(() => setPhase("evening"), 550);
    }
  };

  const onConfirmEvening = () => {
    if (bankChoice + investChoice > player.wallet) return;
    if (bankChoice > 0) saveToBank(bankChoice);
    if (investChoice > 0) investMoney(investChoice);
    setBankChoice(0);
    setInvestChoice(0);
    setPhase("night");
  };

  const onStartNewDay = () => {
    setPhase("sunrise");
    window.setTimeout(() => {
      startNewDay();
      setShopOpen(false);
      setPhase("morning");
    }, 950);
  };

  return (
    <div
      className={`relative h-screen w-full overflow-hidden bg-gradient-to-b ${bgClass} transition-all duration-700`}
    >
      <TopHUD
        day={player.currentDay}
        wallet={player.wallet}
        water={player.waterUnits}
        wateringsLeft={wateringsLeft}
      />

      <div className="pointer-events-none absolute inset-x-0 top-16 text-center">
        <motion.h1
          className="text-4xl font-black text-emerald-950 drop-shadow-sm md:text-5xl"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Growtopia Adventure
        </motion.h1>
      </div>

      <SceneTree
        treeStage={tree.stage}
        shakeTree={shakeTree}
        phase={phase}
        canWater={canWater}
        onWater={onWater}
      />

      <AnimatePresence>
        {coinPop !== null && (
          <motion.div
            key="coin-pop"
            initial={{ y: 0, scale: 0.5, opacity: 0 }}
            animate={{ y: -80, scale: 1.1, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute left-1/2 top-[52%] z-40 -translate-x-1/2 rounded-full bg-yellow-300 px-5 py-2 text-3xl font-black text-yellow-900 shadow-xl"
          >
            +₹{coinPop}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "evening" && (
          <EveningChoiceModal
            wallet={player.wallet}
            bankChoice={bankChoice}
            setBankChoice={setBankChoice}
            investChoice={investChoice}
            setInvestChoice={setInvestChoice}
            remaining={remaining}
            onConfirm={onConfirmEvening}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "night" && (
          <NightLessonBubble tip={aiTip} onContinue={onStartNewDay} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "sunrise" && <SunriseOverlay />}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "morning" && (
          <BottomActions
            canEndDay={tree.timesWateredToday > 0}
            onShop={() => setShopOpen(true)}
            onEndDay={() => setPhase("evening")}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shopOpen && (
          <ShopModal
            tab={shopTab}
            setTab={setShopTab}
            marketAssets={marketAssets}
            wallet={player.wallet}
            ownedAssets={ownedAssets}
            onBuy={buyAsset}
            onClose={() => setShopOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TopHUD({
  day,
  wallet,
  water,
  wateringsLeft,
}: {
  day: number;
  wallet: number;
  water: number;
  wateringsLeft: number;
}) {
  return (
    <div className="absolute left-0 right-0 top-0 z-30 p-4">
      <div className="mx-auto flex max-w-3xl items-center justify-between rounded-[2rem] bg-white/90 px-5 py-4 shadow-xl">
        <div className="text-2xl font-extrabold text-emerald-800">
          Day {day}
        </div>
        <div className="text-3xl font-black text-yellow-600">🪙 ₹{wallet}</div>
        <div className="text-2xl font-extrabold text-sky-700">💧 {water}</div>
        <div className="text-xl font-bold text-indigo-700">
          Left: {wateringsLeft}
        </div>
      </div>
    </div>
  );
}

function SceneTree({
  treeStage,
  phase,
  shakeTree,
  canWater,
  onWater,
}: {
  treeStage: "seed" | "sprout" | "small" | "medium" | "large" | "full";
  phase: Phase;
  shakeTree: boolean;
  canWater: boolean;
  onWater: () => void;
}) {
  const treeEmoji = getTreeEmoji(treeStage);

  return (
    <div className="absolute inset-0">
      <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-t-[40%] bg-gradient-to-b from-emerald-400 to-emerald-600" />

      <motion.div
        className="absolute bottom-[26%] left-1/2 z-20 -translate-x-1/2 text-[11rem] md:text-[13rem]"
        variants={treeShakeVariants}
        animate={shakeTree ? "shake" : "calm"}
        transition={{ duration: 0.25 }}
      >
        {treeEmoji}
      </motion.div>

      <AnimatePresence>
        {phase === "morning" && (
          <motion.button
            initial={{ opacity: 0, y: 28, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: [1, 1.05, 1] }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            onClick={onWater}
            disabled={!canWater}
            className="absolute bottom-[17%] left-1/2 z-30 -translate-x-1/2 rounded-full bg-sky-500 px-10 py-6 text-4xl font-black text-white shadow-2xl disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            🪣 Water
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

function BottomActions({
  canEndDay,
  onShop,
  onEndDay,
}: {
  canEndDay: boolean;
  onShop: () => void;
  onEndDay: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 30, opacity: 0 }}
      className="absolute bottom-5 left-0 right-0 z-40 px-4"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={onShop}
          className="flex-1 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 px-6 py-5 text-3xl font-black text-white shadow-xl"
        >
          🛒 Shop
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={onEndDay}
          disabled={!canEndDay}
          className="flex-1 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 px-6 py-5 text-3xl font-black text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          🌙 End Day
        </motion.button>
      </div>
    </motion.div>
  );
}

function ShopModal({
  tab,
  setTab,
  marketAssets,
  wallet,
  ownedAssets,
  onBuy,
  onClose,
}: {
  tab: ShopTab;
  setTab: (tab: ShopTab) => void;
  marketAssets: MarketAsset[];
  wallet: number;
  ownedAssets: { name: string; type: AssetType }[];
  onBuy: (assetId: string) => void;
  onClose: () => void;
}) {
  const filteredAssets = marketAssets.filter((a) => a.type === tab);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-end bg-black/40 p-3 md:items-center md:justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ y: 28, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 28, opacity: 0 }}
        className="w-full max-w-3xl rounded-[2rem] bg-white p-5 shadow-2xl md:p-7"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-4xl font-black text-emerald-800">Asset Shop</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-200 px-4 py-2 text-xl font-black text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mb-4 rounded-2xl bg-yellow-100 p-3 text-center text-3xl font-black text-yellow-800">
          🪙 ₹{wallet}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => setTab("depreciating")}
            className={`rounded-2xl px-4 py-4 text-2xl font-black ${
              tab === "depreciating"
                ? "bg-red-500 text-white"
                : "bg-red-100 text-red-800"
            }`}
          >
            ⚡ Depreciating
          </button>
          <button
            onClick={() => setTab("appreciating")}
            className={`rounded-2xl px-4 py-4 text-2xl font-black ${
              tab === "appreciating"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            🌳 Appreciating
          </button>
        </div>

        <div
          className={`mb-4 rounded-2xl p-3 text-center text-xl font-bold ${
            tab === "depreciating"
              ? "bg-red-100 text-red-800"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {tab === "depreciating"
            ? "Greedy choice: quick boost now, but maintenance and value drop later."
            : "Patient choice: no instant boost, but better long-term growth."}
        </div>

        <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
          {filteredAssets.map((asset) => {
            const owned = ownedAssets.some(
              (a) => a.name === asset.name && a.type === asset.type,
            );
            const canAfford = wallet >= asset.currentPrice && !owned;

            return (
              <div
                key={asset.id}
                className={`rounded-2xl border-2 p-4 ${
                  canAfford
                    ? "border-emerald-300 bg-emerald-50"
                    : owned
                      ? "border-slate-300 bg-slate-100"
                      : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-3xl font-black text-slate-800">{asset.name}</div>
                    <div className="mt-1 text-lg font-semibold text-slate-700">
                      {asset.description}
                    </div>
                  </div>
                  <div className="text-3xl font-black text-yellow-700">₹{asset.currentPrice}</div>
                </div>
                <motion.button
                  whileHover={{ scale: canAfford ? 1.03 : 1 }}
                  whileTap={{ scale: canAfford ? 0.95 : 1 }}
                  disabled={!canAfford}
                  onClick={() => onBuy(asset.id)}
                  className="mt-3 w-full rounded-full bg-indigo-600 px-5 py-4 text-2xl font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {owned ? "Owned ✅" : canAfford ? "Buy" : "Not Enough Coins"}
                </motion.button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function EveningChoiceModal({
  wallet,
  bankChoice,
  setBankChoice,
  investChoice,
  setInvestChoice,
  remaining,
  onConfirm,
}: {
  wallet: number;
  bankChoice: number;
  setBankChoice: (v: number) => void;
  investChoice: number;
  setInvestChoice: (v: number) => void;
  remaining: number;
  onConfirm: () => void;
}) {
  const maxBank = Math.max(0, wallet - investChoice);
  const maxInvest = Math.max(0, wallet - bankChoice);

  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl md:p-8"
        initial={{ y: 24, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 24, opacity: 0 }}
      >
        <h2 className="text-center text-4xl font-black text-emerald-800">
          Evening Choice
        </h2>
        <p className="mt-2 text-center text-2xl font-bold text-slate-700">
          Pick how to grow your coins before bedtime.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-sky-100 p-5">
            <div className="text-6xl">🔐</div>
            <div className="mt-2 text-3xl font-black text-sky-800">
              Safe Box
            </div>
            <div className="text-xl font-bold text-sky-700">
              Secure + smaller growth
            </div>
            <input
              type="range"
              min={0}
              max={maxBank}
              value={bankChoice}
              onChange={(e) => setBankChoice(Number(e.target.value))}
              className="mt-4 w-full"
            />
            <div className="mt-2 text-3xl font-black text-sky-900">
              ₹{bankChoice}
            </div>
          </div>

          <div className="rounded-3xl bg-emerald-100 p-5">
            <div className="text-6xl">🪴</div>
            <div className="mt-2 text-3xl font-black text-emerald-800">
              Garden Plot
            </div>
            <div className="text-xl font-bold text-emerald-700">
              Riskier + faster growth
            </div>
            <input
              type="range"
              min={0}
              max={maxInvest}
              value={investChoice}
              onChange={(e) => setInvestChoice(Number(e.target.value))}
              className="mt-4 w-full"
            />
            <div className="mt-2 text-3xl font-black text-emerald-900">
              ₹{investChoice}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-amber-100 p-4 text-center text-2xl font-black text-amber-800">
          Unused tonight: ₹{remaining}
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={onConfirm}
          className="mt-6 w-full rounded-full bg-indigo-600 py-5 text-3xl font-black text-white shadow-xl"
        >
          Continue to Night
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function NightLessonBubble({
  tip,
  onContinue,
}: {
  tip: string | null;
  onContinue: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-end justify-center bg-black/35 p-4 pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl md:p-8"
        initial={{ y: 30, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 18, opacity: 0 }}
      >
        <div className="mb-3 text-center text-7xl">🦉</div>
        <div className="relative rounded-[2rem] bg-indigo-100 p-5">
          <div className="absolute -bottom-4 left-14 h-0 w-0 border-l-[16px] border-r-[16px] border-t-[20px] border-l-transparent border-r-transparent border-t-indigo-100" />
          <p className="text-center text-3xl font-black text-indigo-900">
            {tip ?? "Great choices today! Keep balancing saving and investing."}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={onContinue}
          className="mt-6 w-full rounded-full bg-emerald-600 py-5 text-3xl font-black text-white shadow-xl"
        >
          Start New Day
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function SunriseOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-amber-100 via-yellow-200 to-orange-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.85, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.95 }}
    >
      <motion.div
        initial={{ y: 60, scale: 0.7 }}
        animate={{ y: -40, scale: 1.2 }}
        transition={{ duration: 0.95, ease: "easeOut" }}
        className="text-[8rem]"
      >
        ☀️
      </motion.div>
    </motion.div>
  );
}
