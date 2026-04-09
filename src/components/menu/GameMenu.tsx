"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGameStore } from "@/store/gameStore";

export function GameMenu() {
  const { startJourney, resetGame, hasPlayed, playerLevel, totalEXP, leaderboard } = useGameStore();

  const ranked = useMemo(
    () => [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 5),
    [leaderboard],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_20%,#fef3c7_0%,transparent_45%),radial-gradient(circle_at_85%_15%,#bae6fd_0%,transparent_40%),linear-gradient(135deg,#d9f99d_0%,#67e8f9_45%,#a7f3d0_100%)] px-4 py-6">
      <div className="mx-auto flex min-h-[92vh] w-full max-w-6xl flex-col justify-between gap-6 md:gap-8">
        <header className="flex items-center justify-between rounded-3xl border border-white/50 bg-white/70 px-4 py-3 shadow-xl backdrop-blur-xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Growtopia</p>
            <h1 className="text-3xl font-black text-emerald-950 md:text-4xl">Prosperity Tree Quest</h1>
          </div>
          <motion.div
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-right"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Level</p>
            <p className="text-2xl font-black text-emerald-900">{playerLevel}</p>
            <p className="text-xs font-semibold text-emerald-700">EXP {totalEXP}</p>
          </motion.div>
        </header>

        <main className="grid flex-1 gap-5 md:grid-cols-[1.2fr_0.8fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-2xl backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/70 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 left-0 h-36 w-36 rounded-full bg-cyan-200/70 blur-2xl" />

            <motion.div
              className="mx-auto mt-2 w-fit text-center"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative">
                <motion.span
                  className="block text-[7rem] leading-none md:text-[9rem]"
                  animate={{ rotate: [0, -2, 2, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  🌳
                </motion.span>
                {["🍃", "🍀", "✨"].map((leaf, idx) => (
                  <motion.span
                    key={leaf + idx}
                    className="absolute text-2xl"
                    style={{ left: `${20 + idx * 30}%`, top: `${8 + idx * 14}%` }}
                    animate={{ y: [0, 20 + idx * 4, 50 + idx * 8], opacity: [0, 1, 0], x: [0, idx % 2 === 0 ? 8 : -8, 0] }}
                    transition={{ duration: 2.8 + idx * 0.4, repeat: Infinity, delay: idx * 0.6 }}
                  >
                    {leaf}
                  </motion.span>
                ))}
              </div>
              <p className="mt-2 text-lg font-bold text-emerald-900">Water, Decide, Grow.</p>
              <p className="text-sm text-emerald-700">
                Short daily runs. Real money habits. Consequences that teach fast.
              </p>
            </motion.div>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={startJourney}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500 px-5 py-4 text-lg font-black text-white shadow-xl"
              >
                🚀 Start Journey
              </motion.button>

              <motion.button
                whileHover={hasPlayed ? { scale: 1.02, y: -2 } : {}}
                whileTap={hasPlayed ? { scale: 0.98 } : {}}
                onClick={resetGame}
                disabled={!hasPlayed}
                className={`rounded-2xl px-5 py-4 text-lg font-black shadow-xl ${
                  hasPlayed
                    ? "bg-gradient-to-r from-rose-500 to-red-600 text-white"
                    : "cursor-not-allowed bg-slate-200 text-slate-500"
                }`}
              >
                ♻️ Reset Game
              </motion.button>
            </div>

            {!hasPlayed && (
              <p className="mt-3 text-xs font-semibold text-slate-600">
                Reset unlocks once you start a run.
              </p>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-2xl backdrop-blur-xl">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">Leaderboard</h2>
            <p className="mt-1 text-xs text-slate-600">Friendly race to keep motivation high.</p>

            <div className="mt-4 space-y-2">
              {ranked.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      #{index + 1} {entry.name}
                    </p>
                    <p className="text-xs font-semibold text-slate-600">Level {entry.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-sky-700">{entry.score}</p>
                    <p className="text-xs text-slate-500">
                      {entry.trend === "up" ? "⬆ Rising" : entry.trend === "down" ? "⬇ Sliding" : "➡ Stable"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
