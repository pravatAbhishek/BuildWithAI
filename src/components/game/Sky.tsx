"use client";

import type { CSSProperties } from "react";
import { useGameStore } from "@/store/gameStore";

export function Sky() {
  const { tree } = useGameStore();

  // Time of day based on watering progress
  const wateringProgress = tree.timesWateredToday / tree.maxWateringPerDay;
  const isEvening = wateringProgress >= 0.66;
  const isNoon = wateringProgress >= 0.33 && wateringProgress < 0.66;

  // Sky gradient based on time
  const getSkyGradient = () => {
    if (isEvening) {
      return "linear-gradient(180deg, #1a1a2e 0%, #16213e 30%, #e94560 60%, #ff7f50 100%)";
    }
    if (isNoon) {
      return "linear-gradient(180deg, #4a90d9 0%, #87ceeb 50%, #b0e2ff 100%)";
    }
    return "linear-gradient(180deg, #87ceeb 0%, #b0e2ff 50%, #e0f4ff 100%)";
  };

  return (
    <div
      className="absolute inset-0 transition-all duration-1000"
      style={{ background: getSkyGradient() }}
    >
      {/* Sun */}
      {!isEvening && (
        <div
          className="absolute animate-float transition-all duration-1000"
          style={{
            top: isNoon ? "10%" : "15%",
            right: isNoon ? "20%" : "15%",
          }}
        >
          <div className="relative">
            {/* Sun glow */}
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                width: "120px",
                height: "120px",
                background:
                  "radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%)",
                transform: "translate(-20%, -20%)",
              }}
            />
            {/* Sun body */}
            <div
              className="w-20 h-20 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #fff7d4 0%, #ffd700 40%, #ffa500 100%)",
                boxShadow: "0 0 60px rgba(255,215,0,0.8)",
              }}
            />
            {/* Sun rays */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-yellow-400 rounded-full"
                style={{
                  width: "4px",
                  height: "30px",
                  left: "50%",
                  top: "50%",
                  transformOrigin: "center -20px",
                  transform: `translateX(-50%) rotate(${i * 45}deg) translateY(-50px)`,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Moon (evening only) */}
      {isEvening && (
        <div
          className="absolute animate-float"
          style={{ top: "10%", right: "15%" }}
        >
          <div className="relative">
            {/* Moon glow */}
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                width: "100px",
                height: "100px",
                background:
                  "radial-gradient(circle, rgba(245,245,220,0.4) 0%, transparent 70%)",
                transform: "translate(-15%, -15%)",
              }}
            />
            {/* Moon body */}
            <div
              className="w-16 h-16 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #fffff0 0%, #f5f5dc 50%, #daa520 100%)",
                boxShadow: "0 0 40px rgba(245,245,220,0.6)",
              }}
            />
            {/* Moon craters */}
            <div
              className="absolute w-3 h-3 rounded-full bg-gray-300 opacity-30"
              style={{ top: "20%", left: "30%" }}
            />
            <div
              className="absolute w-2 h-2 rounded-full bg-gray-300 opacity-20"
              style={{ top: "50%", left: "60%" }}
            />
          </div>
        </div>
      )}

      {/* Stars (evening only) */}
      {isEvening && (
        <>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-twinkle rounded-full bg-white"
              style={{
                width: Math.random() * 3 + 1 + "px",
                height: Math.random() * 3 + 1 + "px",
                top: Math.random() * 40 + "%",
                left: Math.random() * 100 + "%",
                animationDelay: Math.random() * 2 + "s",
              }}
            />
          ))}
        </>
      )}

      {/* Clouds */}
      <Cloud style={{ top: "8%", animationDuration: "35s" }} />
      <Cloud
        style={{ top: "15%", animationDuration: "45s", animationDelay: "-10s" }}
      />
      <Cloud
        style={{ top: "5%", animationDuration: "55s", animationDelay: "-25s" }}
        size="small"
      />

      {/* Birds (morning/noon only) */}
      {!isEvening && (
        <>
          <Bird style={{ top: "12%", animationDelay: "0s" }} />
          <Bird style={{ top: "20%", animationDelay: "-8s" }} />
        </>
      )}
    </div>
  );
}

function Cloud({
  style,
  size = "normal",
}: {
  style?: CSSProperties;
  size?: "small" | "normal";
}) {
  const scale = size === "small" ? 0.6 : 1;

  return (
    <div className="absolute cloud-slow" style={{ ...style }}>
      <svg
        width={100 * scale}
        height={60 * scale}
        viewBox="0 0 100 60"
        className="drop-shadow-lg"
      >
        <ellipse cx="30" cy="35" rx="25" ry="20" fill="white" opacity="0.9" />
        <ellipse cx="50" cy="30" rx="30" ry="25" fill="white" opacity="0.95" />
        <ellipse cx="75" cy="35" rx="22" ry="18" fill="white" opacity="0.9" />
        <ellipse cx="45" cy="40" rx="35" ry="15" fill="white" opacity="0.85" />
      </svg>
    </div>
  );
}

function Bird({ style }: { style?: CSSProperties }) {
  return (
    <div className="absolute animate-bird-fly" style={{ ...style }}>
      <svg width="24" height="12" viewBox="0 0 24 12">
        <path
          d="M0 6 Q6 0, 12 6 Q18 0, 24 6"
          fill="none"
          stroke="#333"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
