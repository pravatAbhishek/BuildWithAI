"use client";

import React, { useState } from "react";
import { useGameStore } from "@/store/gameStore";

export function EndDayScreen() {
  const {
    player,
    tree,
    showEndOfDay,
    saveToBank,
    investMoney,
    startNewDay,
    setScreen,
  } = useGameStore();

  const [bankAmount, setBankAmount] = useState(0);
  const [investAmount, setInvestAmount] = useState(0);
  const [step, setStep] = useState<"summary" | "allocate" | "confirm">(
    "summary",
  );

  if (!showEndOfDay) return null;

  const remainingMoney = player.wallet - bankAmount - investAmount;

  const handleSaveToBank = () => {
    if (bankAmount > 0) {
      saveToBank(bankAmount);
    }
    if (investAmount > 0) {
      investMoney(investAmount);
    }
    setStep("confirm");
  };

  const handleStartNewDay = () => {
    startNewDay();
    setBankAmount(0);
    setInvestAmount(0);
    setStep("summary");
  };

  return (
    <div className="fixed inset-0 z-50 animate-fade-in">
      {/* Night sky backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        }}
      >
        {/* Stars */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-twinkle rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 60 + "%",
              left: Math.random() * 100 + "%",
              animationDelay: Math.random() * 2 + "s",
            }}
          />
        ))}

        {/* Moon */}
        <div className="absolute top-10 right-10 animate-float">
          <div
            className="w-20 h-20 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, #fffff0 0%, #f5f5dc 50%, #daa520 100%)",
              boxShadow: "0 0 60px rgba(245,245,220,0.4)",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4">
        {step === "summary" && (
          <SummaryStep
            player={player}
            tree={tree}
            onContinue={() => setStep("allocate")}
          />
        )}

        {step === "allocate" && (
          <AllocateStep
            wallet={player.wallet}
            bankAmount={bankAmount}
            setBankAmount={setBankAmount}
            investAmount={investAmount}
            setInvestAmount={setInvestAmount}
            remainingMoney={remainingMoney}
            onConfirm={handleSaveToBank}
            onBack={() => setStep("summary")}
          />
        )}

        {step === "confirm" && (
          <ConfirmStep
            bankAmount={bankAmount}
            investAmount={investAmount}
            onStartNewDay={handleStartNewDay}
          />
        )}
      </div>
    </div>
  );
}

function SummaryStep({
  player,
  tree,
  onContinue,
}: {
  player: { wallet: number; currentDay: number; totalEarnings: number };
  tree: { timesWateredToday: number; stage: string };
  onContinue: () => void;
}) {
  return (
    <div className="animate-slide-up text-center">
      <div className="text-6xl mb-4">🌙</div>
      <h2 className="text-3xl font-bold text-white mb-2">
        Day {player.currentDay} Complete!
      </h2>
      <p className="text-purple-200 mb-6">Time to rest and plan for tomorrow</p>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 space-y-4 max-w-xs mx-auto">
        <div className="flex justify-between items-center text-white">
          <span className="text-purple-200">Waterings today:</span>
          <span className="font-bold">{tree.timesWateredToday} 💧</span>
        </div>
        <div className="flex justify-between items-center text-white">
          <span className="text-purple-200">Plant stage:</span>
          <span className="font-bold capitalize">{tree.stage} 🌱</span>
        </div>
        <div className="flex justify-between items-center text-white">
          <span className="text-purple-200">Today&apos;s earnings:</span>
          <span className="font-bold text-yellow-400">₹{player.wallet} 🪙</span>
        </div>
      </div>

      <button onClick={onContinue} className="game-button text-lg px-8 py-4">
        Manage My Money 💰
      </button>
    </div>
  );
}

function AllocateStep({
  wallet,
  bankAmount,
  setBankAmount,
  investAmount,
  setInvestAmount,
  remainingMoney,
  onConfirm,
  onBack,
}: {
  wallet: number;
  bankAmount: number;
  setBankAmount: (v: number) => void;
  investAmount: number;
  setInvestAmount: (v: number) => void;
  remainingMoney: number;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const maxBank = wallet - investAmount;
  const maxInvest = wallet - bankAmount;

  return (
    <div className="animate-slide-up w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white text-center mb-4">
        💰 What to do with your money?
      </h2>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
        <div className="text-center text-white mb-4">
          <span className="text-purple-200">Available: </span>
          <span className="text-2xl font-bold text-yellow-400">₹{wallet}</span>
        </div>

        {/* Bank option */}
        <div className="bg-blue-500/20 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🏦</span>
            <div className="text-white">
              <div className="font-bold">Save in Bank</div>
              <div className="text-xs text-blue-200">
                +1% interest daily • Available tomorrow
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={maxBank}
              value={bankAmount}
              onChange={(e) => setBankAmount(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-white font-bold w-16 text-right">
              ₹{bankAmount}
            </span>
          </div>
        </div>

        {/* Invest option */}
        <div className="bg-purple-500/20 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📈</span>
            <div className="text-white">
              <div className="font-bold">Invest</div>
              <div className="text-xs text-purple-200">
                +5% growth daily • Cannot withdraw
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={maxInvest}
              value={investAmount}
              onChange={(e) => setInvestAmount(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-white font-bold w-16 text-right">
              ₹{investAmount}
            </span>
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-red-500/20 rounded-xl p-3 text-center">
          <span className="text-red-200 text-sm">
            Money not saved will be lost overnight!{" "}
          </span>
          <span className="text-white font-bold">₹{remainingMoney}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white/20 text-white font-bold py-3 rounded-xl"
        >
          ← Back
        </button>
        <button onClick={onConfirm} className="flex-1 game-button">
          Confirm →
        </button>
      </div>
    </div>
  );
}

function ConfirmStep({
  bankAmount,
  investAmount,
  onStartNewDay,
}: {
  bankAmount: number;
  investAmount: number;
  onStartNewDay: () => void;
}) {
  return (
    <div className="animate-slide-up text-center">
      <div className="text-6xl mb-4">😴</div>
      <h2 className="text-2xl font-bold text-white mb-4">Ready to sleep!</h2>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 space-y-3 max-w-xs mx-auto">
        {bankAmount > 0 && (
          <div className="flex items-center justify-between text-white">
            <span className="flex items-center gap-2">
              🏦 <span className="text-blue-200">Bank savings</span>
            </span>
            <span className="font-bold">₹{bankAmount}</span>
          </div>
        )}
        {investAmount > 0 && (
          <div className="flex items-center justify-between text-white">
            <span className="flex items-center gap-2">
              📈 <span className="text-purple-200">Investments</span>
            </span>
            <span className="font-bold">₹{investAmount}</span>
          </div>
        )}
        {bankAmount === 0 && investAmount === 0 && (
          <div className="text-yellow-300">
            💡 Tip: Save some money next time!
          </div>
        )}
      </div>

      <div className="text-purple-200 text-sm mb-6">
        💫 Your investments will grow while you sleep!
      </div>

      <button onClick={onStartNewDay} className="game-button text-lg px-8 py-4">
        Go to Sleep 😴💤
      </button>
    </div>
  );
}
