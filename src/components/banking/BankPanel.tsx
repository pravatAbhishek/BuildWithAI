"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { GAME_CONFIG } from "@/lib/constants";
import { SavingsAccount } from "./SavingsAccount";
import { FixedDeposit } from "./FixedDeposit";
import { StockInvestment } from "./StockInvestment";

type BankTab = "savings" | "invest" | "market";

export function BankPanel() {
  const {
    player,
    currentDay,
    savings,
    fixedDeposits,
    sips,
    emergencyLoan,
    takeEmergencyLoan,
    repayEmergencyLoan,
    isFeatureUnlocked,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<BankTab>("savings");

  const totalFDInvested = fixedDeposits.reduce((sum, fd) => sum + fd.principal, 0);
  const totalSIPValue = sips.reduce((sum, sip) => sum + sip.currentValue, 0);
  const totalInvested = totalFDInvested + totalSIPValue;
  const savingsUnlocked = isFeatureUnlocked("savings-account");
  const investmentsUnlocked = isFeatureUnlocked("investments");
  const loansUnlocked = isFeatureUnlocked("bank-loans");
  const marketVisible = isFeatureUnlocked("stock-market");
  const canRequestLoan = loansUnlocked && !emergencyLoan;

  const loanDays = emergencyLoan ? Math.max(0, currentDay - emergencyLoan.startDay) : 0;
  const loanOutstanding = emergencyLoan
    ? Math.max(
        0,
        Math.floor(
          emergencyLoan.principal * (1 + emergencyLoan.dailyInterestRate * loanDays) -
            emergencyLoan.totalPaid,
        ),
      )
    : 0;

  const resolvedTab: BankTab =
    activeTab === "invest" && !investmentsUnlocked
      ? "savings"
      : activeTab === "market" && !marketVisible
        ? "savings"
        : activeTab;

  if (!savingsUnlocked) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-black text-slate-900">🔒 Banking Unlocks In Phase 3</p>
        <p className="mt-1 text-sm text-slate-600">
          Keep progressing through decisions and tree growth. Savings and loan tools unlock soon.
        </p>
        <p className="mt-2 text-sm font-semibold text-amber-700">Current Wallet: ₹{player.wallet}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          className="rounded-xl bg-gradient-to-br from-yellow-50 to-amber-100 p-3 border border-yellow-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-xs text-gray-600 font-medium">💵 Wallet</div>
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
          <div className="mt-1 flex gap-4 text-xs text-purple-600">
            <span>🔒 FD: ₹{totalFDInvested}</span>
            <span>📊 SIP: ₹{totalSIPValue}</span>
          </div>
        </motion.div>
      </div>

      {loansUnlocked && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Emergency Loan Desk</p>

          {!emergencyLoan && (
            <>
              <p className="mt-1 text-xs text-amber-700">
                Take a high-value loan only in emergency. New loan is blocked until old one is fully repaid.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {GAME_CONFIG.EMERGENCY_LOAN_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => takeEmergencyLoan(option)}
                    disabled={!canRequestLoan}
                    className={`rounded-xl px-2 py-2 text-xs font-black transition ${
                      canRequestLoan
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "cursor-not-allowed bg-slate-200 text-slate-500"
                    }`}
                  >
                    ₹{option}
                  </button>
                ))}
              </div>
              {!canRequestLoan && <p className="mt-2 text-[11px] text-slate-500">Repay active loan to take a new one.</p>}
            </>
          )}

          {emergencyLoan && (
            <>
              <p className="mt-1 text-xs text-amber-700">
                Active Loan ₹{emergencyLoan.principal} | Days: {loanDays} | Due: ₹{loanOutstanding}
              </p>
              <button
                onClick={repayEmergencyLoan}
                disabled={player.wallet < loanOutstanding}
                className={`mt-2 w-full rounded-xl px-3 py-2 text-sm font-black transition ${
                  player.wallet >= loanOutstanding
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "cursor-not-allowed bg-slate-200 text-slate-500"
                }`}
              >
                {player.wallet >= loanOutstanding
                  ? `Repay Full Loan ₹${loanOutstanding}`
                  : `Need ₹${loanOutstanding} to repay`}
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
        <motion.button
          whileHover={{ scale: resolvedTab !== "savings" ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            resolvedTab === "savings"
              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("savings")}
        >
          🏦 Savings
        </motion.button>
        {investmentsUnlocked && (
          <motion.button
            whileHover={{ scale: resolvedTab !== "invest" ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              resolvedTab === "invest"
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("invest")}
          >
            📈 Invest
          </motion.button>
        )}
        {marketVisible && (
          <motion.button
            whileHover={{ scale: resolvedTab !== "market" ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              resolvedTab === "market"
                ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("market")}
          >
            📉 Market
          </motion.button>
        )}
      </div>

      <motion.div
        key={resolvedTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {resolvedTab === "savings" && <SavingsAccount />}
        {resolvedTab === "invest" && investmentsUnlocked && <FixedDeposit />}
        {resolvedTab === "market" && marketVisible && <StockInvestment />}
      </motion.div>
    </div>
  );
}
