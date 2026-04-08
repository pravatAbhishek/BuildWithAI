"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { canWaterTree } from "@/lib/gameEngine";

type Phase = "morning" | "evening" | "night" | "sunrise";

export function GameCanvas() {
  const {
    tree,
    player,
    waterTree,
    saveToBank,
    investMoney,
    startNewDay,
    resetGame,
    aiTip,
  } = useGameStore();

  const [phase, setPhase] = useState<Phase>("morning");
  const [shakeTree, setShakeTree] = useState(false);
  const [coinPop, setCoinPop] = useState<number | null>(null);
  const [bankChoice, setBankChoice] = useState(0);
  const [investChoice, setInvestChoice] = useState(0);

  const wateringsLeft = Math.max(0, 3 - tree.timesWateredToday);
  const canWater = canWaterTree(tree, player.waterUnits) && phase === "morning";
  const remaining = Math.max(0, player.wallet - bankChoice - investChoice);

  useEffect(() => {
    if (phase === "morning" && tree.timesWateredToday >= 3) {
      setPhase("evening");
    }
  }, [phase, tree.timesWateredToday]);

  useEffect(() => {
    if (phase !== "evening") {
      setBankChoice(0);
      setInvestChoice(0);
    }
  }, [phase]);

  const bgClass = useMemo(() => {
    if (phase === "morning") return "from-sky-300 via-cyan-200 to-emerald-200";
    if (phase === "evening") return "from-orange-300 via-amber-200 to-emerald-200";
    if (phase === "night") return "from-indigo-950 via-blue-900 to-slate-900";
    return "from-yellow-200 via-orange-100 to-sky-300";
  }, [phase]);

  const onWater = () => {
    if (!canWater) return;
    setShakeTree(true);
    const before = player.wallet;
    waterTree();
    const earned = Math.max(1, player.wallet - before || 25);
    setCoinPop(earned);
    window.setTimeout(() => setShakeTree(false), 250);
    window.setTimeout(() => setCoinPop(null), 900);
  };

  const onConfirmEvening = () => {
    if (bankChoice > 0) saveToBank(bankChoice);
    if (investChoice > 0) investMoney(investChoice);
    setPhase("night");
  };

  const onStartNewDay = () => {
    setPhase("sunrise");
    window.setTimeout(() => {
      startNewDay();
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
        {phase === "night" && <NightLessonBubble tip={aiTip} onContinue={onStartNewDay} />}
      </AnimatePresence>

      <AnimatePresence>{phase === "sunrise" && <SunriseOverlay />}</AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          resetGame();
          setPhase("morning");
        }}
        className="absolute bottom-5 right-5 z-40 rounded-full bg-white/95 px-6 py-4 text-2xl font-extrabold text-emerald-700 shadow-xl"
      >
        Reset
      </motion.button>
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
        <div className="text-2xl font-extrabold text-emerald-800">Day {day}</div>
        <div className="text-3xl font-black text-yellow-600">🪙 ₹{wallet}</div>
        <div className="text-2xl font-extrabold text-sky-700">💧 {water}</div>
        <div className="text-xl font-bold text-indigo-700">Left: {wateringsLeft}</div>
      </div>
    </div>
  );
}

function SceneTree({
  phase,
  shakeTree,
  canWater,
  onWater,
}: {
  phase: Phase;
  shakeTree: boolean;
  canWater: boolean;
  onWater: () => void;
}) {
  return (
    <div className="absolute inset-0">
      <div className="absolute bottom-0 left-0 right-0 h-1/3 rounded-t-[40%] bg-gradient-to-b from-emerald-400 to-emerald-600" />

      <motion.div
        className="absolute bottom-[26%] left-1/2 z-20 -translate-x-1/2 text-[11rem] md:text-[13rem]"
        animate={shakeTree ? { rotate: [0, -3, 3, -2, 2, 0], scaleY: [1, 0.95, 1.05, 1] } : { rotate: 0, scaleY: 1 }}
        transition={{ duration: 0.25 }}
      >
        🌳
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
        <h2 className="text-center text-4xl font-black text-emerald-800">Evening Choice</h2>
        <p className="mt-2 text-center text-2xl font-bold text-slate-700">
          Pick how to grow your coins before bedtime.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-sky-100 p-5">
            <div className="text-6xl">🔐</div>
            <div className="mt-2 text-3xl font-black text-sky-800">Safe Box</div>
            <div className="text-xl font-bold text-sky-700">Secure + smaller growth</div>
            <input
              type="range"
              min={0}
              max={maxBank}
              value={bankChoice}
              onChange={(e) => setBankChoice(Number(e.target.value))}
              className="mt-4 w-full"
            />
            <div className="mt-2 text-3xl font-black text-sky-900">₹{bankChoice}</div>
          </div>

          <div className="rounded-3xl bg-emerald-100 p-5">
            <div className="text-6xl">🪴</div>
            <div className="mt-2 text-3xl font-black text-emerald-800">Garden Plot</div>
            <div className="text-xl font-bold text-emerald-700">Riskier + faster growth</div>
            <input
              type="range"
              min={0}
              max={maxInvest}
              value={investChoice}
              onChange={(e) => setInvestChoice(Number(e.target.value))}
              className="mt-4 w-full"
            />
            <div className="mt-2 text-3xl font-black text-emerald-900">₹{investChoice}</div>
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
