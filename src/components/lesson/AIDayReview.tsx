"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DailySummary } from "@/types/game";
import { useGameStore } from "@/store/gameStore";

interface AIDayReviewProps {
  isOpen: boolean;
  summary: DailySummary | null;
  onContinue: () => void;
}

export function AIDayReview({ isOpen, summary, onContinue }: AIDayReviewProps) {
  const {
    latestGeminiReview,
    reviewStatus,
    reviewError,
    reviewChatMessages,
    addReviewChatMessage,
    setReviewStatus,
  } = useGameStore();
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);

  const expPercent = useMemo(
    () => Math.max(0, Math.min(100, latestGeminiReview?.exp || 0)),
    [latestGeminiReview?.exp],
  );

  const askCoach = async (value: string) => {
    if (!summary) return;
    const trimmed = value.trim();
    if (!trimmed || sending) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      role: "user" as const,
      text: trimmed,
    };

    addReviewChatMessage(userMessage);
    setQuestion("");
    setSending(true);

    try {
      const response = await fetch("/api/gemini/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary,
          question: trimmed,
          history: [...reviewChatMessages, userMessage],
        }),
      });
      const payload = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || "Coach reply failed");
      }

      addReviewChatMessage({
        id: `a-${Date.now()}`,
        role: "assistant",
        text: payload.reply,
      });
    } catch (error) {
      setReviewStatus(
        "error",
        error instanceof Error ? error.message : "Coach is unavailable right now",
      );
    } finally {
      setSending(false);
    }
  };

  if (!summary) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-[75] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/30 bg-[linear-gradient(155deg,#ffffff_0%,#f0f9ff_35%,#dcfce7_100%)] shadow-2xl"
            initial={{ y: 32, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, scale: 0.96, opacity: 0 }}
          >
            <div className="border-b border-emerald-100 px-6 py-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">AI Day Review</p>
              <h2 className="mt-1 text-2xl font-black text-emerald-950">Day {summary.currentDay} Money Story</h2>
              <p className="mt-1 text-sm text-emerald-800">
                Decisions made: {summary.decisions.length} | Inflation: {(summary.inflation.rate * 100).toFixed(2)}%
              </p>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_0.95fr]">
              <div className="space-y-3">
                {reviewStatus === "loading" ? (
                  <div className="rounded-2xl border border-sky-100 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-700">🤖 Coach is analyzing your day...</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-sky-100 bg-white p-4">
                    <p className="text-sm leading-relaxed text-slate-700">
                      {latestGeminiReview?.summary ||
                        "🌙 Review loading completed. Keep balancing spending, savings, and investment discipline."}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-emerald-800">EXP Gain</p>
                    <p className="text-lg font-black text-emerald-900">+{latestGeminiReview?.exp || 0}</p>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-emerald-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${expPercent}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Quick Ask</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(latestGeminiReview?.suggestedQuestions || []).map((item) => (
                      <button
                        key={item}
                        onClick={() => askCoach(item)}
                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Coach Chat</p>
                <div className="mt-2 h-52 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-2">
                  {reviewChatMessages.length === 0 && (
                    <p className="px-2 py-3 text-xs text-slate-500">Ask follow-up questions or tap Skip to continue.</p>
                  )}
                  {reviewChatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        message.role === "user"
                          ? "ml-auto bg-emerald-500 text-white"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      {message.text}
                    </div>
                  ))}
                </div>

                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void askCoach(question);
                  }}
                >
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask the coach..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    disabled={sending || reviewStatus === "loading"}
                    className={`rounded-xl px-3 py-2 text-sm font-bold ${
                      sending || reviewStatus === "loading"
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>

            {reviewError && (
              <p className="px-6 pb-2 text-xs font-semibold text-red-600">{reviewError}</p>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-emerald-100 px-6 py-4">
              <button
                onClick={onContinue}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Skip
              </button>
              <button
                onClick={onContinue}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-2 text-sm font-black text-white"
              >
                Next Day
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
