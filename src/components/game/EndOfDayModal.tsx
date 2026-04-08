"use client";

import { useGameStore } from "@/store/gameStore";
import { Modal, Button } from "@/components/ui";
import { calculateSavingsInterest } from "@/lib/bankingLogic";
import { calculateMaintenanceCosts } from "@/lib/assetCalculator";

export function EndOfDayModal() {
  const {
    player,
    savings,
    fixedDeposits,
    ownedAssets,
    showEndOfDay,
    startNewDay,
  } = useGameStore();

  // Calculate what will happen at end of day
  const savingsInterest = calculateSavingsInterest(savings);
  const maintenanceCosts = calculateMaintenanceCosts(
    ownedAssets,
    player.currentDay + 1,
  );
  const maturingFDs = fixedDeposits.filter(
    (fd) => fd.maturityDay === player.currentDay + 1,
  );

  return (
    <Modal
      isOpen={showEndOfDay}
      onClose={() => {}}
      title={`🌙 End of Day ${player.currentDay}`}
      showCloseButton={false}
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="text-center py-2">
          <span className="text-4xl">🌅</span>
          <p className="text-gray-600 mt-2">
            Great work today! Here&apos;s what will happen overnight:
          </p>
        </div>

        {/* Overnight changes */}
        <div className="space-y-2">
          {/* Savings Interest */}
          {savings.balance > 0 && (
            <div className="flex justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">🏦 Savings Interest</span>
              <span className="font-medium text-green-600">
                +₹{savingsInterest}
              </span>
            </div>
          )}

          {/* Maintenance Costs */}
          {maintenanceCosts > 0 && (
            <div className="flex justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-gray-700">🔧 Maintenance Costs</span>
              <span className="font-medium text-red-600">
                -₹{maintenanceCosts}
              </span>
            </div>
          )}

          {/* Maturing FDs */}
          {maturingFDs.length > 0 && (
            <div className="p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-700">📜 FD Maturing Tomorrow:</span>
              <div className="mt-1">
                {maturingFDs.map((fd) => (
                  <div key={fd.id} className="text-sm text-purple-700">
                    ₹{fd.principal} → ₹
                    {Math.floor(fd.principal * (1 + fd.interestRate))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No changes */}
          {savings.balance === 0 &&
            maintenanceCosts === 0 &&
            maturingFDs.length === 0 && (
              <div className="p-3 bg-gray-50 rounded-lg text-center text-gray-500">
                No overnight changes. Consider saving some money!
              </div>
            )}
        </div>

        {/* Net change */}
        <div className="p-4 bg-gray-100 rounded-lg text-center">
          <span className="text-sm text-gray-600">Net overnight change:</span>
          <div
            className={`text-xl font-bold ${
              savingsInterest - maintenanceCosts >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {savingsInterest - maintenanceCosts >= 0 ? "+" : ""}₹
            {savingsInterest - maintenanceCosts}
          </div>
        </div>

        {/* Action Button */}
        <Button onClick={startNewDay} className="w-full" size="lg">
          Sleep & Start Day {player.currentDay + 1} 🌙
        </Button>
      </div>
    </Modal>
  );
}
