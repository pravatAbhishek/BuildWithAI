"use client";

import React from "react";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  color?: "green" | "blue" | "yellow" | "red";
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  max,
  label,
  showValue = true,
  color = "green",
  size = "md",
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  const sizes = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-gray-700">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}
      >
        <div
          className={`${colors[color]} ${sizes[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
