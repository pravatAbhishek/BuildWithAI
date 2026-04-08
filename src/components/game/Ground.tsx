"use client";

import React from "react";

export function Ground() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[35%]">
      {/* Background hills */}
      <svg
        className="absolute bottom-0 w-full h-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        {/* Far hill */}
        <ellipse cx="80" cy="45" rx="40" ry="20" fill="#86efac" />
        {/* Near hill */}
        <ellipse cx="20" cy="50" rx="35" ry="25" fill="#4ade80" />
      </svg>

      {/* Main ground */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[70%]"
        style={{
          background:
            "linear-gradient(180deg, #4ade80 0%, #22c55e 30%, #16a34a 100%)",
          borderTopLeftRadius: "50% 20px",
          borderTopRightRadius: "50% 20px",
        }}
      >
        {/* Grass blades */}
        <div className="absolute top-0 left-0 right-0 flex justify-around">
          {[...Array(20)].map((_, i) => (
            <GrassBlade
              key={i}
              style={{
                animationDelay: `${i * 0.1}s`,
                height: 15 + Math.random() * 15 + "px",
              }}
            />
          ))}
        </div>

        {/* Flowers */}
        <Flower color="#ff69b4" style={{ left: "10%", bottom: "60%" }} />
        <Flower color="#ffd700" style={{ left: "25%", bottom: "50%" }} />
        <Flower color="#ff6b6b" style={{ left: "70%", bottom: "55%" }} />
        <Flower color="#9b59b6" style={{ left: "85%", bottom: "65%" }} />
        <Flower color="#ff69b4" style={{ left: "45%", bottom: "45%" }} />

        {/* Small mushrooms */}
        <Mushroom style={{ left: "15%", bottom: "20%" }} />
        <Mushroom style={{ left: "80%", bottom: "25%" }} color="#e74c3c" />

        {/* Butterflies */}
        <Butterfly style={{ left: "30%", bottom: "70%" }} />
        <Butterfly style={{ left: "60%", bottom: "80%" }} color="#9b59b6" />
      </div>

      {/* Dirt layer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[15%]"
        style={{
          background:
            "linear-gradient(180deg, #8B4513 0%, #654321 50%, #3d2914 100%)",
        }}
      >
        {/* Small rocks */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 5 + Math.random() * 10 + "px",
              height: 5 + Math.random() * 8 + "px",
              left: 10 + i * 12 + "%",
              top: Math.random() * 50 + "%",
              background: `linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function GrassBlade({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      className="animate-grass-wave origin-bottom"
      style={{
        width: "3px",
        background: "linear-gradient(to top, #16a34a, #4ade80)",
        borderRadius: "2px 2px 50% 50%",
        ...style,
      }}
    />
  );
}

function Flower({
  color,
  style,
}: {
  color: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="absolute animate-bloom" style={{ ...style }}>
      {/* Stem */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-6 bg-green-600"
        style={{ borderRadius: "2px" }}
      />
      {/* Petals */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="relative -top-2"
      >
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <ellipse
            key={i}
            cx="10"
            cy="10"
            rx="4"
            ry="7"
            fill={color}
            transform={`rotate(${angle} 10 10) translate(0 -4)`}
          />
        ))}
        {/* Center */}
        <circle cx="10" cy="10" r="3" fill="#ffd700" />
      </svg>
    </div>
  );
}

function Mushroom({
  style,
  color = "#ff6b6b",
}: {
  style?: React.CSSProperties;
  color?: string;
}) {
  return (
    <div className="absolute" style={{ ...style }}>
      {/* Stem */}
      <div
        className="w-3 h-4 bg-[#f5f5dc] mx-auto"
        style={{ borderRadius: "0 0 40% 40%" }}
      />
      {/* Cap */}
      <div
        className="w-8 h-4 -mt-1"
        style={{
          background: color,
          borderRadius: "50% 50% 0 0",
        }}
      >
        {/* Spots */}
        <div className="absolute w-1.5 h-1.5 rounded-full bg-white top-1 left-1" />
        <div className="absolute w-1 h-1 rounded-full bg-white top-2 right-2" />
      </div>
    </div>
  );
}

function Butterfly({
  style,
  color = "#ff69b4",
}: {
  style?: React.CSSProperties;
  color?: string;
}) {
  return (
    <div className="absolute animate-flutter" style={{ ...style }}>
      <svg width="24" height="16" viewBox="0 0 24 16">
        {/* Left wing */}
        <ellipse cx="6" cy="8" rx="5" ry="7" fill={color} opacity="0.8">
          <animate
            attributeName="rx"
            values="5;3;5"
            dur="0.3s"
            repeatCount="indefinite"
          />
        </ellipse>
        {/* Right wing */}
        <ellipse cx="18" cy="8" rx="5" ry="7" fill={color} opacity="0.8">
          <animate
            attributeName="rx"
            values="5;3;5"
            dur="0.3s"
            repeatCount="indefinite"
          />
        </ellipse>
        {/* Body */}
        <ellipse cx="12" cy="8" rx="2" ry="6" fill="#333" />
        {/* Antenna */}
        <line x1="11" y1="2" x2="9" y2="0" stroke="#333" strokeWidth="1" />
        <line x1="13" y1="2" x2="15" y2="0" stroke="#333" strokeWidth="1" />
      </svg>
    </div>
  );
}
