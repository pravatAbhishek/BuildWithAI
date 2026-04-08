"use client";

import React from "react";
import { useGameStore } from "@/store/gameStore";
import { Modal, Button } from "@/components/ui";

export function DailyLesson() {
  const { showLesson, currentLesson, dismissLesson } = useGameStore();

  if (!currentLesson) return null;

  return (
    <Modal
      isOpen={showLesson}
      onClose={dismissLesson}
      title={`📚 ${currentLesson.title}`}
      showCloseButton={false}
    >
      <div className="space-y-4">
        {/* Lesson Content */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-gray-700 leading-relaxed">
            {currentLesson.content}
          </p>
        </div>

        {/* Tip Box */}
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-2">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-semibold text-yellow-800">
                Today&apos;s Tip
              </h4>
              <p className="text-sm text-yellow-700">{currentLesson.tip}</p>
            </div>
          </div>
        </div>

        {/* Fun fact or encouragement */}
        <div className="text-center py-2">
          <span className="text-4xl">🌟</span>
          <p className="text-gray-600 text-sm mt-1">
            Great job completing Day {currentLesson.day}!
          </p>
        </div>

        {/* Continue Button */}
        <Button onClick={dismissLesson} className="w-full" size="lg">
          Continue to Day {currentLesson.day + 1} →
        </Button>
      </div>
    </Modal>
  );
}
