# 🌱 Growtopia

Growtopia is an event-driven financial literacy game for teens, built with Next.js 16, TypeScript, Zustand, and Framer Motion.

Core loop:
1. Water the Prosperity Tree to earn.
2. Face realistic temptations/events with consequences.
3. Manage savings/FD/SIP/assets.
4. End day with AI review + EXP + level progression.

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Other scripts:

```bash
npm run lint
npm run build
npm run start
```

---

## Current Gameplay Rules (Configured)

- Initial wallet: `₹100`
- Initial water: `5 drops`
- Earning: only when watering the tree (no passive auto-income)
- Base watering yield: `₹120` (modifiers from health/risk/assets/weather)
- Water pricing:
  - `1` drop → `₹100`
  - `5` drops → `₹450`
  - `10` drops → `₹850`
- Savings interest: `1%` daily
- FD options:
  - 3 days: 5%
  - 7 days: 8%
  - 15 days: 12%
  - 30 days: 20%
- SIP:
  - min amount: `₹50`
  - intervals: 30 or 60 days
  - growth: `2%` per interval
- Daily inflation: random `0.3%` to `0.8%` drag on liquid cash
- EXP curve: `level = floor(totalEXP / 200) + 1`

---

## New Core Systems

### 1) Menu-first flow
- First screen is now a full menu (`GameMenu`) after load/reset.
- Start button launches gameplay.
- Reset button is disabled until at least one run has started.

### 2) Full reset behavior
- `resetGame()` clears:
  - Zustand persisted storage
  - localStorage entries containing `growtopia`
  - daily summaries, events, assets, FD/SIP, leaderboard progress, review/chat state
- Returns to menu screen with fresh starter values.

### 3) AI-powered Night Review (Gemini)
- End of each day builds and stores a `DailySummary` object.
- Summary is saved in Zustand + localStorage (`growtopia-daily-summaries`).
- Server route `/api/gemini/review` calls Gemini with full game context.
- Review includes:
  - short friendly summary
  - EXP (`0-100`)
  - 2-3 suggested follow-up questions
- In-modal chat allows follow-up questions to Gemini.

### 4) Event-driven consequence system
- Realistic temptation events (Asset Discount, Quick FD Bonus, Delay Payment, Risky Trade, etc.)
- Accepted temptations schedule future consequence events via `pendingEvents`.
- Life-skewed risk teaches delayed costs and resilience.

### 5) Inflation teaching
- Daily inflation loss applied to wallet.
- FD/SIP/assets remain the long-term defense path.
- Inflation effect is included in daily summaries and AI review context.

---

## Project Structure

### App + APIs (`src/app`)

| File | Purpose |
|---|---|
| `src/app/page.tsx` | Renders `GameCanvas` |
| `src/app/layout.tsx` | Root layout + metadata |
| `src/app/globals.css` | Global animation/style utilities |
| `src/app/api/gemini/review/route.ts` | Secure server Gemini review + chat proxy |
| `src/app/api/game/route.ts` | Placeholder game API |
| `src/app/api/lesson/route.ts` | Legacy lesson API |
| `src/app/api/market/route.ts` | Market API |

### Gameplay UI (`src/components/game`)

| File | Purpose |
|---|---|
| `src/components/game/GameCanvas.tsx` | Main orchestrator (menu handoff, phase flow, events, night review trigger) |
| `src/components/game/WeatherManager.tsx` | Daily weather trigger logic |
| `src/components/game/WeatherOverlay.tsx` | Weather effects + compact notifications |
| `src/components/game/EventCard.tsx` | Event decision modal |
| `src/components/game/Tree.tsx` | Legacy tree visual with upgraded animations |

### Menu + Review UI

| File | Purpose |
|---|---|
| `src/components/menu/GameMenu.tsx` | Full-screen menu with Start, Reset, level badge, dummy leaderboard |
| `src/components/lesson/AIDayReview.tsx` | Night AI review modal + suggested questions + chat |
| `src/components/lesson/DailyLesson.tsx` | Compatibility re-export to `AIDayReview` |

### Logic + State

| File | Purpose |
|---|---|
| `src/store/gameStore.ts` | Zustand source of truth (menu state, summaries, AI review, EXP/level, reset, inflation flow) |
| `src/lib/constants.ts` | Config + event templates + inflation bounds |
| `src/lib/eventSystem.ts` | Daily event generation, pending-event resolution, temptation helper, inflation-rate pick |
| `src/lib/gameEngine.ts` | Tree yield/watering + inflation cash helpers |
| `src/lib/bankingLogic.ts` | Savings/FD/SIP + inflation-adjusted helper utilities |
| `src/lib/assetCalculator.ts` | Asset valuation and maintenance scaling |
| `src/types/game.ts` | Extended types (`DailySummary`, `GeminiReview`, `PlayerLevel`, `InflationRate`, etc.) |

---

## Runtime Flow (Now)

1. Load app → menu screen.
2. Tap Start Journey → morning gameplay.
3. Morning → Events (1-3 event cards) → Evening Banking.
4. Night:
   - build daily summary JSON
   - apply daily inflation impact
   - request Gemini review
   - display EXP + chat review modal
5. Next Day button advances to new morning.

---

## Environment

Create `.env.local` with:

```bash
GEMINI_API_KEY=your_key_here
# optional
GEMINI_MODEL=gemini-1.5-flash
```

Gemini key is server-only and never exposed to the client.

---

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Zustand + persist
- Framer Motion
- Tailwind CSS 4

---

Built for visual, consequence-driven money learning. 🌟
