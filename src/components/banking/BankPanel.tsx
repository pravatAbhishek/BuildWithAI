"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { SavingsAccount } from "./SavingsAccount";
import { FixedDeposit } from "./FixedDeposit";

type BankTab = "savings" | "invest";

export function BankPanel() {
  const { player, savings, fixedDeposits, sips } = useGameStore();
  const [activeTab, setActiveTab] = useState<BankTab>("savings");

  const totalFDInvested = fixedDeposits.reduce((sum, fd) => sum + fd.principal, 0);
  const totalSIPValue = sips.reduce((sum, sip) => sum + sip.currentValue, 0);
  const totalInvested = totalFDInvested + totalSIPValue;

  return (
    <div className="space-y-4">
      {/* Account Summary */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div 
          className="rounded-xl bg-gradient-to-br from-yellow-50 to-amber-100 p-3 border border-yellow-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-xs text-gray-600 font-medium">💵 Your Cash</div>
          <div className="text-2xl font-bold text-yellow-700">₹{player.wallet}</div>
        </motion.div>
        <motion.div 
          className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-3 border border-blue-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-xs text-gray-600 font-medium">🏦 Savings</div>
          <div className="text-2xl font-bold text-blue-700">₹{savings.balance}</div>
          <div className="text-xs text-green-600">+1% daily</div>
        </motion.div>
        <motion.div 
          className="rounded-xl bg-gradient-to-br from-purple-50 to-indigo-100 p-3 border border-purple-200 col-span-2"
          whileHover={{ scale: 1.01 }}
        >
          <div className="text-xs text-gray-600 font-medium">📈 Total Invested</div>
          <div className="text-2xl font-bold text-purple-700">₹{totalInvested}</div>
          <div className="flex gap-4 text-xs text-purple-600 mt-1">
            <span>🔒 FD: ₹{totalFDInvested}</span>
            <span>📊 SIP: ₹{totalSIPValue}</span>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
        <motion.button
          whileHover={{ scale: activeTab !== "savings" ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            activeTab === "savings"
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("savings")}
        >
          🏦 Savings
        </motion.button>
        <motion.button
          whileHover={{ scale: activeTab !== "invest" ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            activeTab === "invest"
              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("invest")}
        >
          📈 Invest (FD & SIP)
        </motion.button>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "savings" && <SavingsAccount />}
        {activeTab === "invest" && <FixedDeposit />}
      </motion.div>
    </div>
  );
}
