"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SimpleEvent } from "@/types/game";

interface EventCardProps {
  event: SimpleEvent | null;
  wallet: number;
  onChoice: (choiceId: string) => void;
}

export function EventCard({ event, wallet, onChoice }: EventCardProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="absolute inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
            initial={{ x: 120, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -120, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
          >
            <p className="text-6xl text-center">{event.icon}</p>
            <h2 className="mt-3 text-center text-2xl font-black text-slate-900">{event.title}</h2>
            <p className="mt-2 text-center text-sm font-bold text-amber-700">Wallet: ₹{wallet}</p>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">✅ Advantage</p>
                <p className="mt-1 text-sm font-semibold text-emerald-900">{event.advantage}</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs font-black uppercase tracking-wider text-rose-700">⚠️ Disadvantage</p>
                <p className="mt-1 text-sm font-semibold text-rose-900">{event.disadvantage}</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {event.choices.map((choice) => {
                const required = choice.cost || 0;
                const canAfford = required <= wallet;

                return (
                <button
                  key={choice.id}
                  onClick={() => onChoice(choice.id)}
                  disabled={!canAfford}
                  className={`w-full rounded-2xl border p-4 text-left text-lg font-bold transition ${
                    canAfford
                      ? "border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"
                      : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="mr-2">{choice.icon}</span>
                      {choice.label}
                    </div>
                    {required > 0 && (
                      <span className={`text-xs font-black ${canAfford ? "text-amber-700" : "text-red-500"}`}>
                        {canAfford ? `Spend ₹${required}` : `Need ₹${required}`}
                      </span>
                    )}
                  </div>
                </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
