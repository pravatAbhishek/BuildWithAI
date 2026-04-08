"use client";

import React, { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { Tree, WaterShop, GameStats, EndOfDayModal } from "@/components/game";
import { BankPanel } from "@/components/banking";
import { AssetShop, Portfolio } from "@/components/assets";
import { DailyLesson } from "@/components/lesson";
import { Button } from "@/components/ui";
import { shouldEndDay } from "@/lib/gameEngine";

type Tab = "play" | "bank" | "assets";

export default function Home() {
  const { tree, endDay, resetGame } = useGameStore();
  const [activeTab, setActiveTab] = useState<Tab>("play");
  const canEndDay = shouldEndDay(tree);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-green-700">🌱 Growtopia</h1>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to reset the game?")) {
                  resetGame();
                }
              }}
            >
              🔄 Reset
            </Button>
          </div>
          <p className="text-sm text-gray-600">Learn to grow your money!</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="mb-6">
          <GameStats />
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl overflow-hidden bg-white shadow-md mb-6">
          {[
            { id: "play" as Tab, label: "🌳 Play", color: "green" },
            { id: "bank" as Tab, label: "🏦 Bank", color: "blue" },
            { id: "assets" as Tab, label: "📊 Assets", color: "purple" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? `bg-${tab.color}-500 text-white`
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              style={{
                backgroundColor:
                  activeTab === tab.id
                    ? tab.color === "green"
                      ? "#22c55e"
                      : tab.color === "blue"
                        ? "#3b82f6"
                        : "#8b5cf6"
                    : undefined,
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "play" && (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                <Tree />
                <WaterShop />
              </div>

              {/* End Day Button */}
              {canEndDay && (
                <div className="text-center mt-6">
                  <Button onClick={endDay} size="lg" className="px-8">
                    🌙 End Day & Sleep
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    You&apos;ve watered enough today. Time to rest!
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "bank" && <BankPanel />}

          {activeTab === "assets" && (
            <div className="grid md:grid-cols-2 gap-6">
              <AssetShop />
              <Portfolio />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-500">
        <p>🌱 Growtopia - Teaching financial literacy through play</p>
      </footer>

      {/* Modals */}
      <EndOfDayModal />
      <DailyLesson />
    </div>
  );
}
