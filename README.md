# 🌱 Growtopia - Financial Literacy Game for Kids

An educational game that teaches village children about investment, saving, and money management through an engaging tree-watering mechanic.

## 🎯 Purpose

This game is designed for **village kids who don't have exposure to investment, saving, and money management**. Through simple gameplay, children learn:

- How to earn money (work → income)
- The importance of saving
- Difference between savings accounts and fixed deposits
- Appreciating vs depreciating assets
- The true cost of ownership (maintenance costs)
- Long-term thinking and patience in investments

---

## 🎮 Core Game Mechanics

### 1. Tree & Water System

- Players have a **money tree** that produces money when watered
- Each watering session earns money based on tree health and level
- Maximum 3 watering sessions per day
- Water must be purchased with earned money

### 2. Banking System (End of Day)

| Type                   | Interest Rate  | Availability      | Best For                    |
| ---------------------- | -------------- | ----------------- | --------------------------- |
| **Savings Account**    | 0.2% daily     | Immediate         | Emergency fund, daily needs |
| **Fixed Deposit (FD)** | 5% for 10 days | After lock period | Long-term growth            |

### 3. Asset System

#### Appreciating Assets 📈

- **Gold Coin** - 1% daily growth, peaks at day 30
- **Silver Set** - 1.5% daily growth, peaks at day 25
- **Land Plot** - 2.5% daily growth, peaks at day 40

_Lesson: Patient investments grow over time!_

#### Depreciating Assets 📉

- **Bicycle** - 30% income boost for 5 days, then ₹5/day maintenance
- **Scooter** - 50% income boost for 7 days, then ₹15/day maintenance
- **Car** - 100% income boost for 10 days, then ₹50/day maintenance

_Lesson: Vehicles give short-term boosts but become liabilities!_

### 4. Daily AI Lessons

- Personalized lessons at end of each day
- Based on player actions and decisions
- Teaches real-world financial concepts

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Main game page
│   ├── layout.tsx               # App layout
│   ├── globals.css              # Global styles
│   └── api/
│       ├── game/route.ts        # Game state API
│       ├── lesson/route.ts      # AI lesson generation
│       └── market/route.ts      # Asset market prices
├── components/
│   ├── game/
│   │   ├── Tree.tsx             # Tree watering interface
│   │   ├── WaterShop.tsx        # Buy water
│   │   ├── GameStats.tsx        # Stats display
│   │   └── EndOfDayModal.tsx    # Day transition
│   ├── banking/
│   │   ├── BankPanel.tsx        # Banking tab container
│   │   ├── SavingsAccount.tsx   # Deposit/withdraw savings
│   │   └── FixedDeposit.tsx     # FD management
│   ├── assets/
│   │   ├── AssetShop.tsx        # Buy assets
│   │   ├── AssetCard.tsx        # Asset display card
│   │   └── Portfolio.tsx        # Owned assets view
│   ├── lesson/
│   │   └── DailyLesson.tsx      # AI lesson modal
│   └── ui/
│       ├── Button.tsx           # Reusable button
│       ├── Modal.tsx            # Modal component
│       ├── Card.tsx             # Card component
│       └── ProgressBar.tsx      # Progress indicator
├── lib/
│   ├── gameEngine.ts            # Core game logic
│   ├── assetCalculator.ts       # Asset value calculations
│   ├── bankingLogic.ts          # Interest & FD calculations
│   └── constants.ts             # Game configuration
├── store/
│   └── gameStore.ts             # Zustand state management
└── types/
    └── game.ts                  # TypeScript interfaces
```

---

## 🔧 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand (with localStorage persistence)
- **UI**: Custom components with emoji-based icons

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to play!

---

## 📊 Game Configuration

All game values can be adjusted in `src/lib/constants.ts`:

```typescript
export const GAME_CONFIG = {
  INITIAL_MONEY: 100, // Starting wallet
  INITIAL_WATER: 5, // Starting water
  WATER_COST: 10, // Cost per water unit
  BASE_TREE_YIELD: 25, // Base money per watering
  MAX_WATERING_PER_DAY: 3, // Watering limit
  SAVINGS_INTEREST_RATE: 0.002, // 0.2% daily
  FD_INTEREST_RATE: 0.05, // 5% for 10 days
  FD_LOCK_DAYS: 10, // FD lock period
};
```

---

## 🎨 UI Customization

The current UI uses **placeholder components** designed for functionality.
Figma designs will be integrated later to replace:

- `src/components/ui/*` - All base UI components
- Component styles in each feature component

When updating UI:

1. Replace component internals
2. Keep the same props interface
3. State management will continue working

---

## 📚 Key Files to Understand

| File                         | Purpose                         |
| ---------------------------- | ------------------------------- |
| `src/store/gameStore.ts`     | Central game state, all actions |
| `src/lib/gameEngine.ts`      | Tree/watering calculations      |
| `src/lib/bankingLogic.ts`    | Savings/FD interest math        |
| `src/lib/assetCalculator.ts` | Asset appreciation/depreciation |
| `src/lib/constants.ts`       | All game balance values         |
| `src/types/game.ts`          | TypeScript interfaces           |

---

## 🔮 Future Enhancements

1. **AI Integration** - Replace static lessons with AI-generated content
2. **Database** - Persist game state to database for multi-device play
3. **Multiplayer** - Compare progress with friends
4. **Achievements** - Unlock badges for financial milestones
5. **More Assets** - Stocks, mutual funds, business investments
6. **Events** - Random market events, emergencies
7. **Localization** - Multiple Indian languages

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Run type checking
npx tsc --noEmit
```

---

## 📝 Development Notes

### State Persistence

Game state is automatically saved to `localStorage` via Zustand's persist middleware. Players can close and return without losing progress.

### Adding New Assets

1. Add to `MARKET_ASSETS` in `constants.ts`
2. Follow the existing structure for appreciating/depreciating types
3. Update `assetCalculator.ts` if new calculation logic needed

### Adding New Lessons

1. Add trigger keys to `LESSON_TRIGGERS` in `constants.ts`
2. Add lesson content to `src/app/api/lesson/route.ts`
3. Update game logic to trigger lessons at appropriate times

---

## 🤝 Contributing

This is an educational project. Contributions welcome for:

- UI/UX improvements
- New educational content
- Bug fixes
- Accessibility improvements
- Translations

---

## 📄 License

Educational use - Created for village children's financial literacy.

---

_Built with ❤️ for the next generation of smart money managers!_
