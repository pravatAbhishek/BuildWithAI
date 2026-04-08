// Core game types for Growtopia Financial Education Game

export interface Player {
  id: string;
  name: string;
  wallet: number; // Current money in hand
  waterUnits: number; // Current water available
  currentDay: number; // Game day (starts at 1)
  totalEarnings: number; // Lifetime earnings for stats
}

export interface Tree {
  level: number; // Tree level affects yield
  health: number; // 0-100, affects money output
  timesWateredToday: number;
  maxWateringPerDay: number;
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

  // Game flow
  isPlaying: boolean;
  showEndOfDay: boolean;
  showLesson: boolean;
  currentLesson: DailyLesson | null;
}

export interface GameActions {
  // Tree actions
  waterTree: () => void;
  buyWater: (units: number) => void;

  // Banking actions
  depositToSavings: (amount: number) => void;
  withdrawFromSavings: (amount: number) => void;
  createFixedDeposit: (amount: number, days: number) => void;
  withdrawFixedDeposit: (fdId: string) => void;

  // Asset actions
  buyAsset: (assetId: string) => void;
  sellAsset: (assetId: string) => void;

  // Day progression
  endDay: () => void;
  startNewDay: () => void;

  // Lesson
  dismissLesson: () => void;

  // Game management
  resetGame: () => void;
  loadGame: () => void;
}
