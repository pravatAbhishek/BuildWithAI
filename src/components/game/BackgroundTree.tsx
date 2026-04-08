"use client";

import React from "react";

export function BackgroundTree() {
  return (
    <div
      className="absolute animate-sway origin-bottom"
      style={{
        left: "5%",
        bottom: "25%",
        zIndex: 5,
      }}
    >
      {/* Tree trunk */}
      <div
        className="relative"
        style={{
          width: "40px",
          height: "180px",
          background:
            "linear-gradient(90deg, #5d4037 0%, #8b6914 30%, #5d4037 100%)",
          borderRadius: "10px 10px 20px 20px",
        }}
      >
        {/* Tree bark texture lines */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-[#4a3728] rounded"
            style={{
              width: "3px",
              height: "15px",
              left: "50%",
              top: 20 + i * 25 + "px",
              transform: `translateX(${(i % 2 === 0 ? -1 : 1) * 8}px)`,
            }}
          />
        ))}

        {/* Branch left */}
        <div
          className="absolute bg-[#6d4c41]"
          style={{
            width: "50px",
            height: "12px",
            top: "30px",
            left: "-45px",
            borderRadius: "10px",
            transform: "rotate(-15deg)",
          }}
        />

        {/* Branch right */}
        <div
          className="absolute bg-[#6d4c41]"
          style={{
            width: "45px",
            height: "10px",
            top: "60px",
            right: "-40px",
            borderRadius: "10px",
            transform: "rotate(20deg)",
          }}
        />
      </div>

      {/* Tree foliage layers */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2">
        {/* Bottom layer */}
        <div
          className="absolute"
          style={{
            width: "160px",
            height: "80px",
            background:
              "radial-gradient(ellipse at center, #2d8b4e 0%, #1e6b3a 70%, #155d30 100%)",
            borderRadius: "50%",
            top: "60px",
            left: "-60px",
            boxShadow: "inset -10px -10px 20px rgba(0,0,0,0.2)",
          }}
        />

        {/* Middle layer */}
        <div
          className="absolute"
          style={{
            width: "140px",
            height: "70px",
            background:
              "radial-gradient(ellipse at center, #34a65f 0%, #2d8b4e 70%, #1e6b3a 100%)",
            borderRadius: "50%",
            top: "30px",
            left: "-50px",
            boxShadow: "inset -8px -8px 15px rgba(0,0,0,0.15)",
          }}
        />

        {/* Top layer */}
        <div
          className="absolute"
          style={{
            width: "100px",
            height: "60px",
            background:
              "radial-gradient(ellipse at center, #4ade80 0%, #34a65f 60%, #2d8b4e 100%)",
            borderRadius: "50%",
            top: "0px",
            left: "-30px",
            boxShadow: "inset -5px -5px 10px rgba(0,0,0,0.1)",
          }}
        />

        {/* Highlight spots */}
        <div
          className="absolute w-8 h-5 rounded-full bg-[#6ee7a7] opacity-40"
          style={{ top: "20px", left: "-10px" }}
        />
        <div
          className="absolute w-6 h-4 rounded-full bg-[#6ee7a7] opacity-30"
          style={{ top: "50px", left: "20px" }}
        />
      </div>

      {/* Falling leaves */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-leaf-fall"
          style={{
            left: -40 + i * 50 + "px",
            top: "-80px",
            animationDelay: i * 2 + "s",
            animationDuration: 5 + i + "s",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M6 0 Q8 3, 12 6 Q8 9, 6 12 Q4 9, 0 6 Q4 3, 6 0"
              fill="#4ade80"
              opacity="0.8"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
