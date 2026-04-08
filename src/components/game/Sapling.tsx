"use client";

import React from "react";
import { useGameStore } from "@/store/gameStore";
import type { SaplingStage } from "@/types/game";

interface SaplingProps {
  onTap?: () => void;
}

export function Sapling({ onTap }: SaplingProps) {
  const { tree, showWaterEffect, showCoinEffect, lastCoinAmount } =
    useGameStore();

  return (
    <div
      className="absolute cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
      style={{
        left: "50%",
        bottom: "28%",
        transform: "translateX(-50%)",
        zIndex: 15,
      }}
      onClick={onTap}
    >
      {/* Water effect */}
      {showWaterEffect && <WaterDrops />}

      {/* Coin effect */}
      {showCoinEffect && <CoinPopup amount={lastCoinAmount} />}

      {/* Sparkles around plant */}
      <Sparkles stage={tree.stage} />

      {/* The sapling based on stage */}
      <SaplingVisual stage={tree.stage} />

      {/* Pot */}
      <Pot stage={tree.stage} />

      {/* Tap hint for new players */}
      {tree.totalWaterings === 0 && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 animate-bounce-slow">
          <div className="bg-white/90 px-3 py-1 rounded-full text-sm font-bold text-green-600 shadow-lg whitespace-nowrap">
            👆 Tap to water!
          </div>
        </div>
      )}
    </div>
  );
}

function SaplingVisual({ stage }: { stage: SaplingStage }) {
  const stageConfig = {
    seed: { height: 0, leaves: 0, trunk: 0 },
    sprout: { height: 30, leaves: 2, trunk: 8 },
    small: { height: 60, leaves: 4, trunk: 15 },
    medium: { height: 100, leaves: 6, trunk: 25 },
    large: { height: 140, leaves: 8, trunk: 35 },
    full: { height: 180, leaves: 12, trunk: 45 },
  };

  const config = stageConfig[stage];

  if (stage === "seed") {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ height: "40px" }}
      >
        {/* Seed */}
        <div
          className="animate-pulse-glow"
          style={{
            width: "24px",
            height: "32px",
            background:
              "linear-gradient(135deg, #8B4513 0%, #654321 50%, #3d2914 100%)",
            borderRadius: "40% 40% 50% 50%",
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          }}
        >
          {/* Seed highlight */}
          <div
            className="absolute w-2 h-3 rounded-full bg-amber-600 opacity-50"
            style={{ top: "8px", left: "6px" }}
          />
        </div>
        {/* Soil mound */}
        <div
          className="absolute bottom-0 w-16 h-4 rounded-t-full"
          style={{
            background: "linear-gradient(180deg, #6b4423 0%, #4a3018 100%)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative animate-gentle-sway origin-bottom"
      style={{ height: config.height + "px" }}
    >
      {/* Main stem/trunk */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: Math.max(6, config.trunk / 3) + "px",
          height: config.trunk + 30 + "px",
          background:
            stage === "full"
              ? "linear-gradient(90deg, #5d4037 0%, #8B6914 50%, #5d4037 100%)"
              : "linear-gradient(90deg, #228B22 0%, #32CD32 50%, #228B22 100%)",
          borderRadius: "4px",
        }}
      />

      {/* Leaves */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        {[...Array(config.leaves)].map((_, i) => {
          const angle = i * (360 / config.leaves) - 90;
          const distance =
            10 +
            (stage === "full"
              ? 25
              : stage === "large"
                ? 18
                : stage === "medium"
                  ? 12
                  : 8);
          const size =
            stage === "full"
              ? 35
              : stage === "large"
                ? 28
                : stage === "medium"
                  ? 22
                  : stage === "small"
                    ? 16
                    : 12;

          return (
            <Leaf
              key={i}
              angle={angle}
              distance={distance}
              size={size}
              delay={i * 0.1}
            />
          );
        })}

        {/* Center bud/flower for mature stages */}
        {(stage === "large" || stage === "full") && (
          <div
            className="absolute animate-bloom"
            style={{
              width: stage === "full" ? "20px" : "14px",
              height: stage === "full" ? "20px" : "14px",
              background: "radial-gradient(circle, #ffd700 0%, #ff8c00 100%)",
              borderRadius: "50%",
              top: "-10px",
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: "0 0 15px rgba(255,215,0,0.6)",
            }}
          />
        )}
      </div>
    </div>
  );
}

function Leaf({
  angle,
  distance,
  size,
  delay,
}: {
  angle: number;
  distance: number;
  size: number;
  delay: number;
}) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * distance;
  const y = Math.sin(rad) * distance;

  return (
    <div
      className="absolute"
      style={{
        transform: `translate(${x - size / 2}px, ${y - size / 2}px) rotate(${angle + 45}deg)`,
        animationDelay: delay + "s",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 40 40">
        <defs>
          <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        <path
          d="M20 0 Q35 10, 40 20 Q35 30, 20 40 Q5 30, 0 20 Q5 10, 20 0"
          fill="url(#leafGradient)"
        />
        {/* Leaf vein */}
        <path
          d="M20 5 L20 35 M12 15 L20 20 L28 15 M12 25 L20 20 L28 25"
          stroke="#16a34a"
          strokeWidth="1"
          fill="none"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}

function Pot({ stage }: { stage: SaplingStage }) {
  const potSize =
    stage === "seed"
      ? 60
      : stage === "sprout"
        ? 70
        : stage === "small"
          ? 80
          : stage === "medium"
            ? 90
            : 100;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{ bottom: "-40px" }}
    >
      <svg width={potSize} height={potSize * 0.7} viewBox="0 0 100 70">
        {/* Pot rim */}
        <rect x="5" y="0" width="90" height="12" rx="3" fill="#d35400" />
        <rect x="8" y="2" width="84" height="8" rx="2" fill="#e67e22" />

        {/* Pot body */}
        <path
          d="M10 12 L20 65 Q50 70, 80 65 L90 12 Z"
          fill="url(#potGradient)"
        />

        {/* Pot decoration */}
        <ellipse cx="50" cy="40" rx="20" ry="8" fill="#c0392b" opacity="0.3" />

        {/* Soil */}
        <ellipse cx="50" cy="12" rx="38" ry="8" fill="#5d4037" />
        <ellipse cx="50" cy="11" rx="35" ry="6" fill="#6d4c41" />

        <defs>
          <linearGradient id="potGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c0392b" />
            <stop offset="50%" stopColor="#e74c3c" />
            <stop offset="100%" stopColor="#c0392b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function WaterDrops() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-water-drop"
          style={{
            left: 30 + Math.random() * 40 + "%",
            top: "-20px",
            animationDelay: i * 0.1 + "s",
          }}
        >
          <svg width="12" height="16" viewBox="0 0 12 16">
            <path
              d="M6 0 Q8 4, 10 8 Q10 14, 6 16 Q2 14, 2 8 Q4 4, 6 0"
              fill="#60a5fa"
              opacity="0.8"
            />
            <ellipse cx="4" cy="8" rx="2" ry="2" fill="white" opacity="0.5" />
          </svg>
        </div>
      ))}
    </div>
  );
}

function CoinPopup({ amount }: { amount: number }) {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 animate-coin-pop pointer-events-none z-50"
      style={{ top: "-60px" }}
    >
      <div className="flex items-center gap-1 bg-yellow-400 px-3 py-1 rounded-full shadow-lg">
        <span className="text-2xl">🪙</span>
        <span className="text-xl font-bold text-yellow-900">+₹{amount}</span>
      </div>
    </div>
  );
}

function Sparkles({ stage }: { stage: SaplingStage }) {
  if (stage === "seed" || stage === "sprout") return null;

  const sparkleCount = stage === "full" ? 6 : stage === "large" ? 4 : 2;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(sparkleCount)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-sparkle"
          style={{
            left: 20 + Math.random() * 60 + "%",
            top: Math.random() * 60 + "%",
            animationDelay: i * 0.3 + "s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M8 0 L9 7 L16 8 L9 9 L8 16 L7 9 L0 8 L7 7 Z"
              fill="#ffd700"
              opacity="0.8"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
