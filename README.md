# 🌱 Growtopia

Growtopia is a kid-friendly financial learning game built with Next.js, TypeScript, Zustand, and Framer Motion.  
Players earn by watering a tree, then learn saving/investing through Savings, FD, SIP, and asset choices.

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

## Current Gameplay Rules (Important)

These are the **actual configured values**:

- Initial wallet: `₹0`
- Initial water: `10 drops`
- Earning per watering: base `₹120` (further affected by health/level/assets)
- Water pricing:
  - `1` drop → `₹100`
  - `5` drops → `₹450`
  - `10` drops → `₹900`
- Savings interest: `1%` daily
- FD options:
  - 3 days: 5%
  - 7 days: 8%
  - 15 days: 12%
  - 30 days: 20%
- SIP:
  - min amount: `₹50`
  - intervals: daily / every 3 days / weekly
  - growth: `2%` per interval

---

## How the App Is Structured

### 1) App entry (`src/app`)

| File | Purpose |
|---|---|
| `src/app/page.tsx` | App home page; renders `GameCanvas` |
| `src/app/layout.tsx` | Root HTML/body wrapper and metadata |
| `src/app/globals.css` | Global styles + animation utilities |
| `src/app/api/game/route.ts` | Server API endpoint for game data |
| `src/app/api/lesson/route.ts` | Server API endpoint for lesson content |
| `src/app/api/market/route.ts` | Server API endpoint for market data |

### 2) Main game UI (`src/components/game`)

| File | Purpose |
|---|---|
| `GameCanvas.tsx` | **Primary game screen** and flow orchestration (morning → evening → night → sunrise) |
| `WeatherManager.tsx` | Weather state/event handling bridge |
| `WeatherOverlay.tsx` | Renders weather effects + compact weather notifications (storm charge summary appears here) |
| `RainEffect.tsx` / `StormEffect.tsx` / `DroughtEffect.tsx` | Individual weather visuals |
| `GameHUD.tsx` | Legacy HUD UI |
| `Tree.tsx` | Legacy tree interaction UI |
| `WaterShop.tsx` | Legacy standalone water purchase panel |
| `ShopOverlay.tsx` | Legacy shop modal flow |
| `EndDayScreen.tsx` / `EndOfDayModal.tsx` | Legacy end-of-day flows |
| `Sky.tsx` / `Ground.tsx` / `Sapling.tsx` / `BackgroundTree.tsx` | Legacy scene pieces and decorative visuals |
| `GameStats.tsx` | Legacy summary/stats panel |
| `AIAdvisor.tsx` | Legacy advisor tip bubble |
| `index.ts` | Re-exports game components |

> **Target this first for UI/flow work:** `src/components/game/GameCanvas.tsx`

### 3) Banking UI (`src/components/banking`)

| File | Purpose |
|---|---|
| `BankPanel.tsx` | Banking tabs container (Savings + Invest) |
| `SavingsAccount.tsx` | Deposit/withdraw savings interactions |
| `FixedDeposit.tsx` | FD + SIP creation and management UI |
| `index.ts` | Re-exports banking components |

> **Target this for financial product UI changes:** `src/components/banking/*`

### 4) Asset UI (`src/components/assets`)

| File | Purpose |
|---|---|
| `AssetShop.tsx` | Legacy asset buying panel |
| `AssetCard.tsx` | Shared card for market/owned assets |
| `Portfolio.tsx` | Owned-asset portfolio list |
| `index.ts` | Re-exports assets components |

### 5) Lessons UI (`src/components/lesson`)

| File | Purpose |
|---|---|
| `DailyLesson.tsx` | Daily review modal (good decisions + improvements + tip) |
| `index.ts` | Re-exports lesson components |

### 6) Shared UI primitives (`src/components/ui`)

| File | Purpose |
|---|---|
| `Button.tsx` | Reusable button variants |
| `Card.tsx` | Reusable card wrapper |
| `Modal.tsx` | Reusable modal container |
| `ProgressBar.tsx` | Reusable progress meter |
| `index.ts` | Re-exports UI primitives |

---

## Core Game Logic (Where Behavior Lives)

| File | Purpose |
|---|---|
| `src/store/gameStore.ts` | **Single source of truth** for game state/actions (Zustand + persist) |
| `src/lib/constants.ts` | All configuration values: pricing, rates, asset configs |
| `src/lib/gameEngine.ts` | Earnings, watering checks, water costs, weather modifiers |
| `src/lib/bankingLogic.ts` | Savings/FD/SIP calculations and helper logic |
| `src/lib/assetCalculator.ts` | Asset appreciation/depreciation/maintenance logic |
| `src/types/game.ts` | Strongly-typed interfaces for state, actions, assets, lessons |

> **Target these for logic changes:** `store/gameStore.ts` + files in `lib/`.

---

## UI Layering and Modal Priority (Current)

To avoid visual clashes, gameplay now follows strict display priority:

1. Morning utility panels are single-open only: Shop, Quick Bank, Missions, and Inventory never stay open together.
2. Morning auto-yield timer and automatic phase jump to events pause while blocking UI is open.
3. Day-start overlays render in priority order:
  - Daily lesson modal
  - Sudden event modal
  - Maintenance popup
4. Weather notifications:
  - Rain/Drought can use the active event card.
  - Storm no longer shows a large emergency dialog.
  - Storm emergency charges are auto-applied in state and summarized in the compact weather popup.

---

## Runtime Flow Snapshot

Use this when giving precise implementation instructions:

1. `src/app/page.tsx` renders `GameCanvas`.
2. `src/components/game/GameCanvas.tsx` controls phase flow, panel visibility rules, and modal gating.
3. `src/components/game/WeatherManager.tsx` decides daily weather and triggers store weather events.
4. `src/store/gameStore.ts` applies financial outcomes (storm emergency cost settlement, savings/FD/SIP updates, event outcomes).
5. `src/components/game/WeatherOverlay.tsx` handles weather effects and compact event notifications.
6. `src/components/lesson/DailyLesson.tsx` displays the day summary modal.

---

## “Which File Should I Edit?” Guide

| If you want to change... | Primary file(s) |
|---|---|
| Main gameplay flow/timers/phases | `src/components/game/GameCanvas.tsx` |
| Balancing numbers (rates, prices, defaults) | `src/lib/constants.ts` |
| How earning or watering is calculated | `src/lib/gameEngine.ts` |
| Savings/FD/SIP math | `src/lib/bankingLogic.ts` |
| Asset growth/decay/maintenance behavior | `src/lib/assetCalculator.ts` |
| Central game state transitions/actions | `src/store/gameStore.ts` |
| Daily lesson/review content format | `src/store/gameStore.ts` + `src/components/lesson/DailyLesson.tsx` |
| Banking panel UI | `src/components/banking/*` |
| Weather visuals | `src/components/game/*Effect.tsx` + `WeatherOverlay.tsx` |
| UI overlap / modal collision fixes | `src/components/game/GameCanvas.tsx` + `src/components/game/WeatherOverlay.tsx` |
| Global animations/theme classes | `src/app/globals.css` |

---

## Architecture Notes

1. UI components trigger actions from `useGameStore()`.
2. Store actions call pure logic helpers in `src/lib/*`.
3. Types in `src/types/game.ts` keep state/actions consistent.
4. Zustand persist stores progress in local storage.

This separation helps you change visuals without touching logic, or change logic without rewriting UI.

---

## Development Tips

1. Prefer updating `constants.ts` for balance tweaks instead of hardcoding values.
2. Keep heavy calculations in `lib/*` and use components only for rendering/interactions.
3. If adding a new feature, update in this order:
   1. `types/game.ts`
   2. `lib/*` logic
   3. `store/gameStore.ts` action wiring
   4. `components/*` UI

---

## Tech Stack

- Next.js 16 (App Router)
- TypeScript (strict mode)
- Zustand (state + persistence)
- Framer Motion (animations)
- Tailwind CSS 4 (styling)

---

Built for playful early-age financial learning. 🌟
