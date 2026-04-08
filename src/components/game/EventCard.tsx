"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Event } from "@/types/game";

interface EventCardProps {
  event: Event | null;
  onChoice: (choiceId: string) => void;
}

export function EventCard({ event, onChoice }: EventCardProps) {
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
            <div className="mt-5 space-y-2">
              {event.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => onChoice(choice.id)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-lg font-bold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <span className="mr-2">{choice.icon}</span>
                  {choice.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
