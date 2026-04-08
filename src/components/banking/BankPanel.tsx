"use client";

import React, { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { SavingsAccount } from "./SavingsAccount";
import { FixedDeposit } from "./FixedDeposit";

type BankTab = "savings" | "invest";

export function BankPanel() {
  const { player, savings, fixedDeposits } = useGameStore();
  const [activeTab, setActiveTab] = useState<BankTab>("savings");

  const totalInvested = fixedDeposits.reduce((sum, fd) => sum + fd.principal, 0);

  return (
    <div className="space-y-4">
      {/* Account Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-yellow-50 p-3 border border-yellow-200">
          <div className="text-xs text-gray-600 font-medium">💵 Your Cash</div>
          <div className="text-2xl font-bold text-yellow-700">₹{player.wallet}</div>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
          <div className="text-xs text-gray-600 font-medium">🏦 Savings</div>
          <div className="text-2xl font-bold text-blue-700">₹{savings.balance}</div>
        </div>
        <div className="rounded-lg bg-purple-50 p-3 border border-purple-200 col-span-2">
          <div className="text-xs text-gray-600 font-medium">📈 Total Invested</div>
          <div className="text-2xl font-bold text-purple-700">₹{totalInvested}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "savings"
              ? "bg-blue-500 text-white"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("savings")}
        >
          🏦 Savings
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "invest"
              ? "bg-purple-500 text-white"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("invest")}
        >
          📈 Investing
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "savings" && <SavingsAccount />}
      {activeTab === "invest" && <FixedDeposit />}
    </div>
  );
}
