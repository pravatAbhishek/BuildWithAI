"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { Modal, Button } from "@/components/ui";
import { ConsequenceReel } from "@/components/game/ConsequenceReel";

export function DailyLesson() {
  const { showLesson, currentLesson, dismissLesson, eventConsequences, treeHealth, riskLevel } =
    useGameStore();

  if (!currentLesson) return null;

  return (
    <Modal
      isOpen={showLesson}
      onClose={dismissLesson}
      title={`🌙 Day ${currentLesson.day} Reel`}
      showCloseButton={false}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-100 p-3 text-center">
            <p className="text-xs font-semibold text-emerald-700">Tree Health</p>
            <p className="text-2xl font-black text-emerald-900">{treeHealth.value}%</p>
          </div>
          <div className="rounded-xl bg-amber-100 p-3 text-center">
            <p className="text-xs font-semibold text-amber-700">Risk</p>
            <p className="text-2xl font-black text-amber-900">{riskLevel.toUpperCase()}</p>
          </div>
        </div>

        <ConsequenceReel items={eventConsequences} />

        {/* Encouragement */}
        <motion.div 
          className="text-center py-2"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-5xl">🏆</span>
          <p className="text-gray-600 font-medium mt-1">
            Day {currentLesson.day} complete!
          </p>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button onClick={dismissLesson} className="w-full" size="lg">
            <span className="flex items-center justify-center gap-2">
              <span>☀️</span>
              <span>Next Day</span>
              <span>→</span>
            </span>
          </Button>
        </motion.div>
      </div>
    </Modal>
  );
}
