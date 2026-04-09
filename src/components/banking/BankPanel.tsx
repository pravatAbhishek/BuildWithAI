"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGameStore } from "@/store/gameStore";
import { GAME_CONFIG } from "@/lib/constants";
import { SavingsAccount } from "./SavingsAccount";
import { FixedDeposit } from "./FixedDeposit";

type BankTab = "savings" | "invest" | "market";

export function BankPanel() {
  const {
    player,
    playerLevel,
    currentDay,
    savings,
    fixedDeposits,
    sips,
    stockItems,
    stockUnlocked,
    emergencyLoan,
    takeEmergencyLoan,
    repayEmergencyLoan,
    isFeatureUnlocked,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<BankTab>("savings");
  const [newsStockId, setNewsStockId] = useState<string | null>(null);

  const totalFDInvested = fixedDeposits.reduce((sum, fd) => sum + fd.principal, 0);
  const totalSIPValue = sips.reduce((sum, sip) => sum + sip.currentValue, 0);
  const totalInvested = totalFDInvested + totalSIPValue;
  const savingsUnlocked = isFeatureUnlocked("savings-account");
  const investmentsUnlocked = isFeatureUnlocked("investments");
  const loansUnlocked = isFeatureUnlocked("bank-loans");
  const marketVisible = isFeatureUnlocked("stock-market") && stockUnlocked;
  const netWorth = player.wallet + savings.balance;
  const canRequestLoan =
    loansUnlocked &&
    !emergencyLoan &&
    (player.wallet <= GAME_CONFIG.EMERGENCY_LOAN_DANGER_WALLET || netWorth <= 120);

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

  const selectedNewsStock = useMemo(
    () => stockItems.find((item) => item.id === newsStockId) || null,
    [newsStockId, stockItems],
  );

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

  const renderMarket = () => {
    if (!stockUnlocked) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-sm font-black text-amber-800">🔒 Market Locked</p>
          <p className="mt-1 text-sm text-amber-700">
            Reach Level 8 to unlock the stock market tab.
          </p>
          <p className="mt-2 text-xs font-semibold text-amber-700">
            Current Level: {playerLevel} | Required: 8
          </p>
        </motion.div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-600">
          4 sample stocks with daily news. No early stock events are injected.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {stockItems.map((stock) => (
            <motion.div
              key={stock.id}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">{stock.symbol}</p>
                  <p className="text-xs text-slate-600">{stock.name}</p>
                </div>
                <p className="text-sm font-bold text-sky-700">
                  ₹{stock.points[stock.points.length - 1]?.price ?? 0}
                </p>
              </div>
              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stock.points}>
                    <XAxis dataKey="day" hide />
                    <YAxis hide domain={["dataMin - 3", "dataMax + 3"]} />
                    <Tooltip />
                    <Line
                      dataKey="price"
                      stroke="#0284c7"
                      strokeWidth={2.2}
                      dot={false}
                      type="monotone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <button
                onClick={() => setNewsStockId(stock.id)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                📰 Daily News
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

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
              {!canRequestLoan && (
                <p className="mt-2 text-[11px] text-slate-500">Loan unlocks when your wallet is critically low.</p>
              )}
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
        {resolvedTab === "market" && marketVisible && renderMarket()}
      </motion.div>

      <AnimatePresence>
        {selectedNewsStock && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-slate-900">
                  📰 {selectedNewsStock.symbol} Daily News
                </h4>
                <button
                  onClick={() => setNewsStockId(null)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600"
                >
                  Close
                </button>
              </div>

              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                {selectedNewsStock.dailyNews.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
