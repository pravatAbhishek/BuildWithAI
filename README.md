# Growtopia

Growtopia is a visual, event-driven financial literacy game for 14-15 year olds built with Next.js 16, TypeScript, Zustand, and Framer Motion.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

Other commands:

```bash
npm run lint
npm run build
npm run start
```

## Fixed Gameplay Values

- Starting wallet: ₹100
- Starting water drops: 5
- Automatic per-second income: none
- Base tree earning: ₹120 per watering
- Savings interest: 1% daily
- FD rates:
  - 3 days: 5%
  - 7 days: 8%
  - 15 days: 12%
  - 30 days: 20%
- SIP growth: 2% per interval
- Inflation: 0.5% daily on cash only
- Mandatory night EXP: 25
- Gemini extra EXP: 0-75
- Level formula: floor(totalEXP / 250) + 1

## Strict Daily Flow

1. Morning
- Weather appears (Rain / Storm / Drought)
- Watering phase and visual auto-watering sequence

2. Event
- Exactly one event pop-up per day
- Big icon + clear advantage/disadvantage + 2 choices

3. Evening
- Banking panel for Savings, FD, SIP, Assets (and Market when unlocked)

4. Night
- Toggle: Generate AI Day Review? (default OFF)
- Base 25 EXP always granted
- If toggle ON, Gemini provides structured feedback and extra EXP

## Weather Rules

- Rain: no earning change
- Storm: immediate wallet loss of ₹80 and tree health stress for 2 days
- Drought: daily earnings reduced by 60%
- Investments remain available during all weather

## One-Event System

Simple events are defined in `src/lib/simpleEventSystem.ts` and templates in `src/lib/constants.ts`.

Exact 8 events:

1. Bike Offer
- Advantage: +25% earning for 3 days
- Disadvantage: Day+4 maintenance ₹120

2. Scooter Offer
- Advantage: +18% earning for 2 days
- Disadvantage: Day+3 repair ₹90

3. Festival Gift Offer
- Advantage: Spend ₹120 now, get ₹60 next day
- Disadvantage: If savings buffer is weak next day, tree health -10

4. Delay Bill Offer
- Advantage: +₹100 cash now
- Disadvantage: Day+5 pay ₹130

5. Emergency Friend Help
- Advantage: Lend ₹80, possible return ₹110 in 4 days
- Disadvantage: 40% chance return is only ₹40

6. Quick FD Bonus Event
- Advantage: Lock ₹150 for 7 days at 11% total return (8% + 3% bonus)
- Disadvantage: Money is locked

7. Appreciating Asset Discount
- Advantage: Buy Village Shop for ₹200 instead of ₹280 (+15% permanent earning)
- Disadvantage: none

8. Car Offer
- Advantage: +35% earning for 3 days
- Disadvantage: Day+4 heavy maintenance ₹250

## Asset Learning Descriptions

Depreciating assets (Bike / Scooter / Car):
- Gives quick boost to daily earnings for 2-3 days but will need costly repairs later.

Appreciating assets (Village Shop / Green Energy):
- Increases tree earnings permanently by 12-18% every day after purchase.

## Bankrupt Rule

If net worth goes below ₹0 (wallet + savings + FD value + SIP value + asset value), a full-screen Bankrupt state appears:

- Message: You went bankrupt! Money management is tough, but you can try again.
- Button: Restart from Beginning
- Action: full `resetGame()` and return to menu

## AI Review Contract

API route: `src/app/api/gemini/review/route.ts`

Review output structure:
- Part 1: Good Things Done (2-3 bullets)
- Part 2: Improvements (2-3 bullets)
- Part 3: EXP Earned Today (number, max 75)

Chat support:
- Follow-up questions are supported inside the night review modal
- Uses the same full game-aware system prompt context

Environment:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
```

## Stocks Feature

- Locked until Level 8
- After unlock: Market tab appears in BankPanel
- Includes 4 sample stocks with Recharts line charts and daily news modal

## Key Files

- `src/types/game.ts` - all models and state/action contracts
- `src/lib/constants.ts` - fixed rules, 8 event templates, assets, stock data
- `src/lib/simpleEventSystem.ts` - one event/day generation + pending consequence logic
- `src/store/gameStore.ts` - core game state, EXP/leveling, bankrupt checks, reset, flow state
- `src/components/game/GameCanvas.tsx` - strict morning->event->evening->night orchestration
- `src/components/lesson/AIDayReview.tsx` - night review toggle, structured AI feedback, chat UI
- `src/components/menu/GameMenu.tsx` - Start Journey, Reset Game, leaderboard
- `src/components/banking/BankPanel.tsx` - Savings/Invest/Market tabs with level lock

## Stack

- Next.js 16 (App Router)
- TypeScript
- Zustand + persist
- Framer Motion
- Tailwind CSS 4
- Recharts
