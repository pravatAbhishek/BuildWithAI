"use client";

import React, { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { Button, Card } from "@/components/ui";
import { GAME_CONFIG } from "@/lib/constants";
import {
  calculateFDMaturityValue,
  getDaysUntilMaturity,
} from "@/lib/bankingLogic";

export function FixedDeposit() {
  const { player, fixedDeposits, createFixedDeposit, withdrawFixedDeposit } =
    useGameStore();
  const [amount, setAmount] = useState(GAME_CONFIG.FD_MINIMUM_AMOUNT);
  const [showCreate, setShowCreate] = useState(false);

  const canCreate =
    player.wallet >= amount && amount >= GAME_CONFIG.FD_MINIMUM_AMOUNT;
  const maturityValue = Math.floor(amount * (1 + GAME_CONFIG.FD_INTEREST_RATE));

  const handleCreate = () => {
    if (canCreate) {
      createFixedDeposit(amount);
      setShowCreate(false);
      setAmount(GAME_CONFIG.FD_MINIMUM_AMOUNT);
    }
  };

  return (
    <Card title="Fixed Deposits" icon="📜">
      <div className="space-y-4">
        {/* FD Info */}
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Interest Rate:</span>
            <span className="font-bold text-purple-700">
              {GAME_CONFIG.FD_INTEREST_RATE * 100}% for{" "}
              {GAME_CONFIG.FD_LOCK_DAYS} days
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Minimum:</span>
            <span className="font-medium">
              ₹{GAME_CONFIG.FD_MINIMUM_AMOUNT}
            </span>
          </div>
        </div>

        {/* Active FDs */}
        {fixedDeposits.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Your Fixed Deposits
            </h4>
            {fixedDeposits.map((fd) => {
              const daysLeft = getDaysUntilMaturity(fd, player.currentDay);
              const maturityAmount = calculateFDMaturityValue(fd);
              const isMatured = fd.matured;

              return (
                <div
                  key={fd.id}
                  className={`p-3 rounded-lg border ${
                    isMatured
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">₹{fd.principal}</div>
                      <div className="text-sm text-gray-500">
                        {isMatured ? (
                          <span className="text-green-600">
                            ✓ Matured! Get ₹{maturityAmount}
                          </span>
                        ) : (
                          <span>{daysLeft} days left</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isMatured ? "success" : "danger"}
                      onClick={() => withdrawFixedDeposit(fd.id)}
                    >
                      {isMatured ? "Collect" : "Break"}
                    </Button>
                  </div>
                  {!isMatured && (
                    <p className="text-xs text-red-500 mt-1">
                      ⚠️ Early withdrawal: 10% penalty
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create New FD */}
        {showCreate ? (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="font-medium">Create New FD</h4>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                min={GAME_CONFIG.FD_MINIMUM_AMOUNT}
                value={amount}
                onChange={(e) =>
                  setAmount(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {amount >= GAME_CONFIG.FD_MINIMUM_AMOUNT && (
              <div className="text-sm text-gray-600">
                After {GAME_CONFIG.FD_LOCK_DAYS} days:{" "}
                <span className="font-bold text-green-600">
                  ₹{maturityValue}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowCreate(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!canCreate}
                className="flex-1"
              >
                Create FD
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowCreate(true)}
            variant="primary"
            className="w-full"
          >
            + Create New FD
          </Button>
        )}

        {/* Info */}
        <p className="text-xs text-gray-500 text-center">
          💡 FDs grow more but you can&apos;t use the money for{" "}
          {GAME_CONFIG.FD_LOCK_DAYS} days!
        </p>
      </div>
    </Card>
  );
}
