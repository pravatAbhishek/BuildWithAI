"use client";

import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: string;
}

export function Card({ children, className = "", title, icon }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-4 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          {icon && <span className="text-xl">{icon}</span>}
          {title && <h3 className="font-semibold text-gray-800">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
}
