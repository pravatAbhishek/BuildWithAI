import { NextResponse } from "next/server";
import type { DailySummary } from "@/types/game";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

type ChatTurn = {
  role: "user" | "assistant";
  text: string;
};

type GeminiReviewRequest = {
  summary: DailySummary;
  question?: string;
  history?: ChatTurn[];
};

function clampExp(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(75, Math.floor(parsed)));
}

function extractGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const candidates = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    .candidates;
  const text = candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" ? text : "";
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch?.[1] || text;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function buildSystemPrompt(): string {
  return [
    "You are the AI financial coach for Growtopia, a visual event-driven money game for students age 14-15.",
    "Game rules (always respect these):",
    "1) Tree = money machine. Watering = earning.",
    "2) Savings account gives 1% daily.",
    "3) FD options: 3/7/15/30 days with 5%/8%/12%/20%.",
    "4) SIP grows 2% per interval.",
    "5) Inflation is 0.5% daily on cash only.",
    "6) Weather effects: Rain no change, Storm wallet -80 and tree health stress, Drought cuts earnings by 60%.",
    "7) Depreciating assets boost short-term income but can cause later repair losses.",
    "8) Appreciating assets improve long-term earnings.",
    "9) Emergency loans are one-at-a-time and interest grows daily until full repayment.",
    "10) Explain active buffs/debuffs clearly with source items and money impact.",
    "11) Use the phase progression lens: advise only currently unlocked strategy depth.",
    "12) Explain risk vs reward clearly using very simple language.",
    "13) Keep feedback short, practical, and encouraging.",
  ].join("\n");
}

function buildFinancialContext(summary: DailySummary): string {
  const effects = (summary.activeEffects || [])
    .map((effect) => `${effect.source}: ${effect.impactText}`)
    .join(" | ");

  return JSON.stringify(
    {
      day: summary.currentDay,
      phase: summary.currentPhase,
      netWorth: summary.netWorth,
      weather: summary.weather,
      riskLevel: summary.riskLevel,
      wallet: summary.walletBalance,
      savings: summary.savingsBalance,
      loanSnapshot: summary.loanSnapshot,
      financialBreakdown: summary.financialBreakdown,
      activeEffects: effects,
      maintenancePaid: summary.maintenancePaid,
      spentToday: summary.spentToday,
      investedToday: summary.investedToday,
      savedToday: summary.savedToday,
      decisions: summary.decisions.map((item) => ({
        event: item.eventTitle,
        choice: item.choiceLabel,
        walletDelta: item.walletDelta,
        consequenceSummary: item.consequenceSummary,
      })),
    },
    null,
    2,
  );
}

function createReviewPrompt(summary: DailySummary): string {
  return [
    buildSystemPrompt(),
    "Return ONLY valid JSON with this exact shape:",
    '{"goodThings":["...","..."],"improvements":["...","..."],"exp":number,"suggestedQuestions":["...","..."]}',
    "Formatting requirements:",
    "- goodThings: 2-3 short bullet-ready points",
    "- improvements: 2-3 short bullet-ready points with direct advice",
    "- exp: number only, 0 to 75",
    "- suggestedQuestions: 2-3 short student-friendly follow-up questions",
    "- explicitly mention losses/profits/spendings and whether emergency loan is active",
    "- mention at least one active buff or debuff source if present",
    "Player day context JSON:",
    buildFinancialContext(summary),
  ].join("\n");
}

function createChatPrompt(summary: DailySummary, question: string, history: ChatTurn[]): string {
  return [
    buildSystemPrompt(),
    "You are Growtopia AI Coach.",
    "Give concise, kid-friendly financial advice for age 14-15 using icons/emojis.",
    "Answer in plain text only (no JSON).",
    "Reference today summary and user question.",
    "If user asks for risky action, explain consequence clearly.",
    "Summary:",
    buildFinancialContext(summary),
    "Conversation so far:",
    JSON.stringify(history),
    `Player question: ${question}`,
  ].join("\n");
}

async function callGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const failureText = await response.text();
    throw new Error(`Gemini API failed: ${response.status} ${failureText}`);
  }

  return response.json();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GeminiReviewRequest;
    if (!body?.summary) {
      return NextResponse.json({ error: "summary is required" }, { status: 400 });
    }

    if (body.question && body.question.trim().length > 0) {
      const prompt = createChatPrompt(
        body.summary,
        body.question.trim(),
        Array.isArray(body.history) ? body.history : [],
      );
      const payload = await callGemini(prompt);
      const reply = extractGeminiText(payload);
      return NextResponse.json({
        reply: reply || "Keep building savings, balance risk, and avoid panic choices.",
        model: DEFAULT_MODEL,
      });
    }

    const prompt = createReviewPrompt(body.summary);
    const payload = await callGemini(prompt);
    const rawText = extractGeminiText(payload);
    const parsed = extractJsonObject(rawText) || {};

    const goodThings = Array.isArray(parsed.goodThings)
      ? parsed.goodThings
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .slice(0, 3)
      : [];

    const improvements = Array.isArray(parsed.improvements)
      ? parsed.improvements
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .slice(0, 3)
      : [];

    const review = {
      day: body.summary.currentDay,
      summary: "Review generated",
      goodThings:
        goodThings.length > 0
          ? goodThings
          : [
              "You finished the day and reviewed your choices.",
              "You tracked weather and event impacts instead of guessing.",
            ],
      improvements:
        improvements.length > 0
          ? improvements
          : [
              "Keep a bigger emergency buffer before accepting risky offers.",
              "Use FD/SIP more consistently to fight inflation on idle cash.",
            ],
      exp: clampExp(parsed.exp),
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
        ? parsed.suggestedQuestions
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .slice(0, 3)
        : [
            "How can I beat inflation tomorrow?",
            "Should I prioritize FD or SIP next?",
            "What should I avoid if I see a delay-bill offer again?",
          ],
      model: DEFAULT_MODEL,
    };

    return NextResponse.json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate Gemini review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
