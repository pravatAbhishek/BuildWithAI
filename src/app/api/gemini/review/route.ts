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
  return Math.max(0, Math.min(100, Math.floor(parsed)));
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

function createReviewPrompt(summary: DailySummary): string {
  return [
    "You are the AI coach for Growtopia, an event-driven financial literacy game for teenagers (14-15).",
    "Return ONLY valid JSON with this exact shape:",
    '{"summary":"string", "exp": number, "suggestedQuestions": ["string", "string", "string"]}',
    "Rules:",
    "1) Keep summary short, friendly, visual, and emoji-rich.",
    "2) Mention inflation and whether player choices were protected by FD/SIP/assets.",
    "3) Mention risk vs reward from decisions and pending consequences.",
    "4) EXP must be 0 to 100, based on smart financial behavior.",
    "5) suggestedQuestions should be 2-3 tappable short prompts.",
    "6) If mistakes happened, be encouraging but honest.",
    "Game context:",
    "- Players earn by watering a prosperity tree.",
    "- Daily flow: Morning -> Events -> Evening Banking -> Night Review.",
    "- Temptations can schedule future losses.",
    "- Inflation reduces purchasing power of cash.",
    "- FD/SIP/assets can protect long-term growth.",
    "Daily summary JSON:",
    JSON.stringify(summary),
  ].join("\n");
}

function createChatPrompt(summary: DailySummary, question: string, history: ChatTurn[]): string {
  return [
    "You are Growtopia AI Coach.",
    "Give concise, kid-friendly financial advice for age 14-15 using icons/emojis.",
    "Answer in plain text only (no JSON).",
    "Reference today summary and user question.",
    "If user asks for risky action, explain consequence clearly.",
    "Summary:",
    JSON.stringify(summary),
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

    const review = {
      day: body.summary.currentDay,
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim().length > 0
          ? parsed.summary
          : "🌙 Solid effort today. Watch inflation, protect cash with saving/investing, and avoid rushed temptations.",
      exp: clampExp(parsed.exp),
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions)
        ? parsed.suggestedQuestions
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .slice(0, 3)
        : [
            "How can I beat inflation tomorrow?",
            "Should I prioritize FD or SIP next?",
            "Which temptation hurt me most today?",
          ],
      model: DEFAULT_MODEL,
    };

    return NextResponse.json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate Gemini review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
