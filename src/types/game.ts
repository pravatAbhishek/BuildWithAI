// Core game types for Growtopia Financial Education Game

export type TimeOfDay = "morning" | "noon" | "evening" | "night";
export type SaplingStage =
  | "seed"
  | "sprout"
  | "small"
  | "medium"
  | "large"
  | "full";
export type GameScreen = "play" | "shop" | "end-day" | "bank" | "invest";
export type WeatherEvent = "none" | "rain" | "drought" | "storm";

export interface Player {
  id: string;
  name: string;
  wallet: number; // Current money in hand
  waterUnits: number; // Current water available
  currentDay: number; // Game day (starts at 1)
  totalEarnings: number; // Lifetime earnings for stats
  bankBalance: number; // Money saved in bank (available next day)
  investmentBalance: number; // Money invested (grows but locked)
}

export interface Tree {
  level: number; // Tree level affects yield
  health: number; // 0-100, affects money output
  timesWateredToday: number;
  maxWateringPerDay: number;
  stage: SaplingStage; // Visual growth stage
  totalWaterings: number; // Lifetime waterings for growth
}

export interface SavingsAccount {
  balance: number;
  interestRate: number; // Daily interest rate (e.g., 0.001 = 0.1%)
}

export interface FixedDeposit {
  id: string;
  principal: number;
  interestRate: number; // Total interest rate for the period
  startDay: number;
  maturityDay: number; // When it can be withdrawn
  matured: boolean;
}

export type AssetType = "appreciating" | "depreciating";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  description: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDay: number;

  // For appreciating assets
  appreciationRate?: number; // Daily appreciation rate
  peakDay?: number; // Day when value peaks before potential decline

  // For depreciating assets
  boostMultiplier?: number; // Income multiplier while active
  boostDuration?: number; // Days the boost lasts
  depreciationRate?: number; // Daily depreciation rate
  maintenanceCost?: number; // Daily cost after boost period
  boostExpired?: boolean;
}

export interface MarketAsset {
  id: string;
  name: string;
  type: AssetType;
  description: string;
  basePrice: number;
  currentPrice: number;

  // Config for when purchased
  appreciationRate?: number;
  peakDay?: number;
  boostMultiplier?: number;
  boostDuration?: number;
  depreciationRate?: number;
  maintenanceCost?: number;
}

export interface DailyLesson {
  day: number;
  title: string;
  content: string;
  tip: string;
  basedOn: string[]; // What player actions triggered this lesson
}

export interface GameState {
  player: Player;
  tree: Tree;
  savings: SavingsAccount;
  fixedDeposits: FixedDeposit[];
  ownedAssets: Asset[];
  marketAssets: MarketAsset[];
  lessons: DailyLesson[];

  // Visual state
  timeOfDay: TimeOfDay;
  currentScreen: GameScreen;
  showWaterEffect: boolean;
  showCoinEffect: boolean;
  lastCoinAmount: number;
  currentWeather: WeatherEvent;
  weatherIntensity: number;
  dayStartTotalEarnings: number;
  todayInvested: number;
  todayBankSaved: number;
  todaySavingsDeposited: number;

  // Game flow
  isPlaying: boolean;
  showEndOfDay: boolean;
  showLesson: boolean;
  currentLesson: DailyLesson | null;
  aiTip: string | null;
}

export interface GameActions {
  // Tree actions
  waterTree: () => void;
  buyWater: (units: number) => void;
  triggerWeatherEvent: (event: WeatherEvent) => void;
  clearWeatherEvent: () => void;
  payWeatherCharge: () => void;

  // Banking actions
  depositToSavings: (amount: number) => void;
  withdrawFromSavings: (amount: number) => void;
  createFixedDeposit: (amount: number, days?: number) => void;
  withdrawFixedDeposit: (fdId: string) => void;

  // New money management (end of day)
  saveToBank: (amount: number) => void;
  investMoney: (amount: number) => void;

  // Asset actions
  buyAsset: (assetId: string) => void;
  sellAsset: (assetId: string) => void;

  // Day progression
  endDay: () => void;
  startNewDay: () => void;

  // Screen navigation
  setScreen: (screen: GameScreen) => void;

  // Visual effects
  triggerWaterEffect: () => void;
  triggerCoinEffect: (amount: number) => void;
  setAITip: (tip: string | null) => void;

  // Lesson
  dismissLesson: () => void;

  // Game management
  resetGame: () => void;
  loadGame: () => void;
}
