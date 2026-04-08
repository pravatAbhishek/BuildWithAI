"use client";

import React, { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { Button, Card } from "@/components/ui";
import { GAME_CONFIG } from "@/lib/constants";

export function SavingsAccount() {
  const { player, savings, depositToSavings, withdrawFromSavings } =
    useGameStore();
  const [amount, setAmount] = useState(10);
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");

  const dailyInterest = Math.floor(savings.balance * savings.interestRate);

  const canDeposit =
    mode === "deposit" && player.wallet >= amount && amount > 0;
  const canWithdraw =
    mode === "withdraw" && savings.balance >= amount && amount > 0;

  const handleAction = () => {
    if (mode === "deposit" && canDeposit) {
      depositToSavings(amount);
    } else if (mode === "withdraw" && canWithdraw) {
      withdrawFromSavings(amount);
    }
  };

  return (
    <Card title="Savings Account" icon="🏦">
      <div className="space-y-4">
        {/* Balance Display */}
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <div className="text-sm text-gray-600">Current Balance</div>
          <div className="text-3xl font-bold text-blue-700">
            ₹{savings.balance}
          </div>
          <div className="text-sm text-green-600 mt-1">
            +₹{dailyInterest}/day interest (
            {(savings.interestRate * 100).toFixed(1)}%)
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === "deposit"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setMode("deposit")}
          >
            Deposit
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === "withdraw"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setMode("withdraw")}
          >
            Withdraw
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">Amount (₹)</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) =>
              setAmount(Math.max(0, parseInt(e.target.value) || 0))
            }
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2">
          {[10, 50, 100].map((amt) => (
            <Button
              key={amt}
              variant="secondary"
              size="sm"
              onClick={() => setAmount(amt)}
              className="flex-1"
            >
              ₹{amt}
            </Button>
          ))}
          {mode === "deposit" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAmount(player.wallet)}
              className="flex-1"
            >
              All
            </Button>
          )}
          {mode === "withdraw" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAmount(savings.balance)}
              className="flex-1"
            >
              All
            </Button>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={handleAction}
          disabled={mode === "deposit" ? !canDeposit : !canWithdraw}
          variant={mode === "deposit" ? "success" : "primary"}
          className="w-full"
        >
          {mode === "deposit" ? `Deposit ₹${amount}` : `Withdraw ₹${amount}`}
        </Button>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center">
          💡 Savings give low but safe returns. Available next day!
        </p>
      </div>
    </Card>
  );
}
