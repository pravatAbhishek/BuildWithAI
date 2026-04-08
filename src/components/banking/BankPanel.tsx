"use client";

import React, { useState } from "react";
import { SavingsAccount } from "./SavingsAccount";
import { FixedDeposit } from "./FixedDeposit";

type BankTab = "savings" | "invest";

export function BankPanel() {
  const [activeTab, setActiveTab] = useState<BankTab>("savings");

  return (
    <div className="space-y-4">
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
