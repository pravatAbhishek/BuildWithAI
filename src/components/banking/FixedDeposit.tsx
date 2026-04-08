"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { GAME_CONFIG } from "@/lib/constants";
import {
  calculateFDMaturityValue,
  getDaysUntilMaturity,
  getFDOptions,
} from "@/lib/bankingLogic";

export function FixedDeposit() {
  const { player, fixedDeposits, sips, createFixedDeposit, withdrawFixedDeposit, createSIP, cancelSIP, applyInvestmentPreview, investmentPreviewDays } =
    useGameStore();
  const [amount, setAmount] = useState<number>(GAME_CONFIG.FD_MINIMUM_AMOUNT);
  const [selectedDuration, setSelectedDuration] = useState(3);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<"fd" | "sip">("fd");
  const [sipAmount, setSipAmount] = useState(50);
  const [sipInterval, setSipInterval] = useState(1);
  const [showCreateSIP, setShowCreateSIP] = useState(false);

  const fdOptions = getFDOptions();
  const selectedOption = fdOptions.find(opt => opt.days === selectedDuration);
  const interestRate = selectedOption?.rate || 0.05;

  const canCreateFD = player.wallet >= amount && amount >= GAME_CONFIG.FD_MINIMUM_AMOUNT;
  const maturityValue = Math.floor(amount * (1 + interestRate));

  const canCreateSIP = player.wallet >= sipAmount && sipAmount >= GAME_CONFIG.SIP_MIN_AMOUNT;

  const handleCreateFD = () => {
    if (canCreateFD) {
      createFixedDeposit(amount, selectedDuration);
      applyInvestmentPreview(selectedDuration);
      setShowCreate(false);
      setAmount(GAME_CONFIG.FD_MINIMUM_AMOUNT);
    }
  };

  const handleCreateSIP = () => {
    if (canCreateSIP) {
      createSIP(sipAmount, sipInterval);
      applyInvestmentPreview(Math.max(3, sipInterval));
      setShowCreateSIP(false);
      setSipAmount(50);
    }
  };

  const totalFDInvested = fixedDeposits.reduce((sum, fd) => sum + fd.principal, 0);
  const totalSIPValue = sips.reduce((sum, sip) => sum + sip.currentValue, 0);

  return (
    <div className="space-y-4">
      {/* Investment Summary */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div 
          className="rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 p-3 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-xs text-gray-600 font-medium">🔒 In FDs</div>
          <div className="text-xl font-bold text-purple-700">₹{totalFDInvested}</div>
        </motion.div>
        <motion.div 
          className="rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 p-3 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-xs text-gray-600 font-medium">📊 In SIPs</div>
          <div className="text-xl font-bold text-emerald-700">₹{totalSIPValue}</div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
        <button
          className={`flex-1 py-3 text-sm font-bold transition-all ${
            activeTab === "fd"
              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("fd")}
        >
          🔒 Fixed Deposits
        </button>
        <button
          className={`flex-1 py-3 text-sm font-bold transition-all ${
            activeTab === "sip"
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveTab("sip")}
        >
          📊 SIP
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "fd" ? (
          <motion.div
            key="fd-content"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* FD Info */}
            <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
              <div className="text-center text-sm font-bold text-purple-800 mb-2">
                💡 FD = Fixed Deposit - Lock money for guaranteed returns!
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {fdOptions.map(opt => (
                  <div key={opt.days} className="text-purple-700">
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Active FDs */}
            {fixedDeposits.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-700">Your FDs</h4>
                {fixedDeposits.map((fd) => {
                  const daysLeft = getDaysUntilMaturity(fd, player.currentDay);
                  const maturityAmount = calculateFDMaturityValue(fd);
                  const isMatured = fd.matured;

                  return (
                    <motion.div
                      key={fd.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border-2 ${
                        isMatured
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-lg">₹{fd.principal}</div>
                          <div className="text-sm text-gray-600">
                            {isMatured ? (
                              <span className="text-green-600 font-bold">
                                ✅ Matured! Get ₹{maturityAmount}
                              </span>
                            ) : (
                              <span>
                                {daysLeft} days left • +{(fd.interestRate * 100).toFixed(0)}% return
                              </span>
                            )}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => withdrawFixedDeposit(fd.id)}
                          className={`px-4 py-2 rounded-xl font-bold text-white text-sm ${
                            isMatured
                              ? "bg-gradient-to-r from-green-500 to-emerald-600"
                              : "bg-gradient-to-r from-red-500 to-orange-500"
                          }`}
                        >
                          {isMatured ? "💰 Collect" : "⚠️ Break"}
                        </motion.button>
                      </div>
                      {!isMatured && (
                        <p className="text-xs text-red-500 mt-1">
                          ⚠️ Early withdrawal: {GAME_CONFIG.FD_EARLY_WITHDRAWAL_PENALTY * 100}% penalty
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Create New FD */}
            {showCreate ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl space-y-3"
              >
                <h4 className="font-bold text-purple-800">Start New FD</h4>

                {/* Duration Selection */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Select Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    {fdOptions.map(opt => (
                      <motion.button
                        key={opt.days}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedDuration(opt.days)}
                        className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                          selectedDuration === opt.days
                            ? "bg-purple-500 text-white"
                            : "bg-white text-purple-700 border border-purple-200"
                        }`}
                      >
                        {opt.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min={GAME_CONFIG.FD_MINIMUM_AMOUNT}
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>

                {amount >= GAME_CONFIG.FD_MINIMUM_AMOUNT && (
                  <div className="text-center p-2 bg-green-100 rounded-lg">
                    <span className="text-sm text-gray-600">After {selectedDuration} days: </span>
                    <span className="font-bold text-green-700 text-lg">₹{maturityValue}</span>
                    <span className="text-xs text-green-600 ml-1">(+₹{maturityValue - amount})</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={canCreateFD ? { scale: 1.02 } : {}}
                    whileTap={canCreateFD ? { scale: 0.98 } : {}}
                    onClick={handleCreateFD}
                    disabled={!canCreateFD}
                    className={`flex-1 py-3 rounded-xl font-bold text-white ${
                      canCreateFD
                        ? "bg-gradient-to-r from-purple-500 to-indigo-600"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    🔒 Lock Money
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreate(true)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-lg hover:shadow-purple-500/30 transition-shadow"
              >
                + Start New FD
              </motion.button>
            )}
          </motion.div>
        ) : (
          // SIP Tab
          <motion.div
            key="sip-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* SIP Info */}
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
              <div className="text-center text-sm font-bold text-emerald-800 mb-2">
                💡 SIP = Systematic Investment Plan - Auto-invest regularly!
              </div>
              <div className="text-xs text-emerald-700 text-center">
                Set amount & interval, money auto-invests and grows {GAME_CONFIG.SIP_GROWTH_RATE * 100}% each interval
              </div>
            </div>

            {/* Active SIPs */}
            {sips.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-700">Your SIPs</h4>
                {sips.map((sip) => {
                  const intervalLabel = GAME_CONFIG.SIP_INTERVALS.find(i => i.days === sip.intervalDays)?.label || `${sip.intervalDays} days`;
                  const profit = sip.currentValue - sip.totalInvested;

                  return (
                    <motion.div
                      key={sip.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-lg text-emerald-800">
                            ₹{sip.amount} / {intervalLabel}
                          </div>
                          <div className="text-sm text-gray-600">
                            Invested: ₹{sip.totalInvested} → 
                            <span className="text-emerald-600 font-bold ml-1">₹{sip.currentValue}</span>
                            {profit > 0 && (
                              <span className="text-green-600 text-xs ml-1">(+₹{profit})</span>
                            )}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => cancelSIP(sip.id)}
                          className="px-4 py-2 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-orange-500 to-red-500"
                        >
                          💰 Cash Out
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Create New SIP */}
            {showCreateSIP ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl space-y-3"
              >
                <h4 className="font-bold text-emerald-800">Start New SIP</h4>

                {/* Interval Selection */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Investment Frequency</label>
                  <div className="grid grid-cols-2 gap-2">
                    {GAME_CONFIG.SIP_INTERVALS.map(opt => (
                      <motion.button
                        key={opt.days}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSipInterval(opt.days)}
                        className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                          sipInterval === opt.days
                            ? "bg-emerald-500 text-white"
                            : "bg-white text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {opt.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount per interval (₹)</label>
                  <input
                    type="number"
                    min={GAME_CONFIG.SIP_MIN_AMOUNT}
                    value={sipAmount}
                    onChange={(e) => setSipAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border-2 border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div className="text-center p-2 bg-emerald-100 rounded-lg text-sm">
                  <span className="text-emerald-700">
                    💰 First ₹{sipAmount} deducted now, then auto-invests regularly
                  </span>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateSIP(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={canCreateSIP ? { scale: 1.02 } : {}}
                    whileTap={canCreateSIP ? { scale: 0.98 } : {}}
                    onClick={handleCreateSIP}
                    disabled={!canCreateSIP}
                    className={`flex-1 py-3 rounded-xl font-bold text-white ${
                      canCreateSIP
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    📊 Start SIP
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateSIP(true)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-emerald-500/30 transition-shadow"
              >
                + Start New SIP
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      {investmentPreviewDays !== null && (
        <motion.div
          className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-lime-50 p-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-xs font-semibold text-emerald-700">Future Tree Preview</p>
          <motion.div
            className="text-4xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 0.8 }}
          >
            🌱 → 🌳
          </motion.div>
          <p className="text-sm font-bold text-emerald-900">Growth in {investmentPreviewDays} days</p>
        </motion.div>
      )}
      <p className="text-xs text-gray-500 text-center">
        💡 FDs lock money for fixed returns. SIPs auto-invest regularly for compound growth!
      </p>
    </div>
  );
}
