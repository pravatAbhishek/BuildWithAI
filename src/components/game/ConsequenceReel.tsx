"use client";

import { motion } from "framer-motion";

interface Consequence {
  id: string;
  icon: string;
  title: string;
  summary: string;
}

export function ConsequenceReel({ items }: { items: Consequence[] }) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="rounded-xl bg-white/70 p-3 text-center text-sm font-semibold text-slate-600">
          🌙 Calm day. Choices tomorrow shape growth.
        </p>
      ) : (
        items.slice(-4).map((item) => (
          <motion.div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white/90 p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm font-bold text-slate-800">
              {item.icon} {item.title}
            </p>
            <p className="text-xs text-slate-600">{item.summary}</p>
          </motion.div>
        ))
      )}
    </div>
  );
}
