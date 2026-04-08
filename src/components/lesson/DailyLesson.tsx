"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { Modal, Button } from "@/components/ui";

export function DailyLesson() {
  const { showLesson, currentLesson, dismissLesson } = useGameStore();

  if (!currentLesson) return null;

  const hasGoodDecisions = currentLesson.goodDecisions && currentLesson.goodDecisions.length > 0;
  const hasImprovements = currentLesson.improvements && currentLesson.improvements.length > 0;

  return (
    <Modal
      isOpen={showLesson}
      onClose={dismissLesson}
      title={`📚 ${currentLesson.title}`}
      showCloseButton={false}
    >
      <div className="space-y-4">
        {/* Lesson Content */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
          <p className="text-gray-700 leading-relaxed">
            {currentLesson.content}
          </p>
        </div>

        {/* Good Decisions Section */}
        <AnimatePresence>
          {hasGoodDecisions && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✅</span>
                <h4 className="font-bold text-green-800">What You Did Well</h4>
              </div>
              <ul className="space-y-1">
                {currentLesson.goodDecisions!.map((decision, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-green-700"
                  >
                    <span className="text-green-500">•</span>
                    {decision}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Improvements Section */}
        <AnimatePresence>
          {hasImprovements && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💡</span>
                <h4 className="font-bold text-amber-800">Tips for Tomorrow</h4>
              </div>
              <ul className="space-y-1">
                {currentLesson.improvements!.map((improvement, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-amber-700"
                  >
                    <span className="text-amber-500">→</span>
                    {improvement}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tip Box */}
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
          <div className="flex items-start gap-2">
            <span className="text-xl">🌟</span>
            <div>
              <h4 className="font-bold text-yellow-800">
                Today&apos;s Key Learning
              </h4>
              <p className="text-sm text-yellow-700">{currentLesson.tip}</p>
            </div>
          </div>
        </div>

        {/* Encouragement */}
        <motion.div 
          className="text-center py-2"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-5xl">🏆</span>
          <p className="text-gray-600 font-medium mt-1">
            Great job completing Day {currentLesson.day}!
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
              <span>Start Day {currentLesson.day + 1}</span>
              <span>→</span>
            </span>
          </Button>
        </motion.div>
      </div>
    </Modal>
  );
}
