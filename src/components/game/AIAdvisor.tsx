"use client";

import { useGameStore } from "@/store/gameStore";

export function AIAdvisor() {
  const { aiTip } = useGameStore();

  if (!aiTip) return null;

  return (
    <div
      className="absolute bottom-4 left-4 right-4 z-30 animate-slide-up"
      style={{ maxWidth: "400px", margin: "0 auto" }}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-xl border-2 border-green-200 flex items-start gap-3">
        {/* Mascot */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-2xl shadow-lg animate-bounce-slow">
            🌱
          </div>
        </div>

        {/* Tip text */}
        <div className="flex-1">
          <div className="text-xs font-bold text-green-600 mb-1">
            Sprout says:
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{aiTip}</p>
        </div>
      </div>
    </div>
  );
}
