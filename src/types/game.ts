// Core game types for Growtopia Financial Education Game

export type TimeOfDay = "morning" | "noon" | "evening" | "night";
export type SaplingStage =
  | "seed"
  | "sprout"
  | "small"
  | "medium"
  | "large"
  | "full";
export type GameScreen = "menu" | "play" | "shop" | "end-day" | "bank" | "invest";
export type WeatherEvent = "none" | "rain" | "drought" | "storm";
export type EventOutcomeQuality = "weak" | "balanced" | "strong" | "neutral";
export type RiskLevel = "low" | "medium" | "high";
export type ReviewStatus = "idle" | "loading" | "ready" | "error";
export type UnlockFeature =
  | "tree-growth"
  | "water-usage"
  | "coin-earning"
  | "simple-scenarios"
  | "savings-account"
  | "extreme-weather"
  | "investments"
  | "risk-system"
  | "shop-assets"
  | "stock-market"
  | "management-mode"
  | "leaderboard"
  | "bank-loans"
  | "inventory";
export type PendingConsequenceType =
  | "wallet-delta"
  | "tree-health-check"
  | "friend-help-return"
  | "fd-bonus-credit";

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
  interestRate: number; // Daily interest rate (e.g., 0.01 = 1%)
}

export interface FixedDeposit {
  id: string;
  principal: number;
  interestRate: number; // Total interest rate for the period
  startDay: number;
  maturityDay: number; // When it can be withdrawn
  matured: boolean;
  durationDays: number; // Duration selected
}

// SIP - Systematic Investment Plan
export interface SIP {
  id: string;
  amount: number; // Amount to invest each interval
  intervalDays: number; // How often to invest (1 = daily, 7 = weekly)
  startDay: number;
  lastInvestmentDay: number; // Last day investment was made
  totalInvested: number; // Cumulative amount invested
  currentValue: number; // Current value with growth
  growthRate: number; // Growth rate per interval
  isActive: boolean;
}

export type AssetType = "appreciating" | "depreciating";

export interface AssetDescription {
  id: string;
  type: AssetType;
  description: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  description: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDay: number;

  // For appreciating assets
  appreciationRate?: number; // Growth rate per interval
  appreciationInterval?: number; // Days between appreciation (default 15)
  peakDay?: number; // Day when value peaks before potential decline

  // For depreciating assets
  boostMultiplier?: number; // Income multiplier while active
  boostDuration?: number; // Days the boost lasts
  depreciationRate?: number; // Daily depreciation rate
  maintenanceCost?: number; // Cost after boost period
  boostExpired?: boolean;

  // For high-risk gadget assets - storm mechanic
  stormChanceBoost?: number; // Increased storm chance
  stormTriggerDay?: number; // Days until storm chance increases
  hasTriggeredStorm?: boolean; // Whether storm boost is active

  // For car - water cost reduction
  waterCostReduction?: number; // Reduces water cost by this amount
  maintenanceInterval?: number; // Days between maintenance
  maintenanceBaseCost?: number; // Base cost, doubles each time
  maintenanceCount?: number; // Number of times maintained
  nextMaintenanceDay?: number; // Next day maintenance is due
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
  appreciationInterval?: number;
  peakDay?: number;
  boostMultiplier?: number;
  boostDuration?: number;
  depreciationRate?: number;
  maintenanceCost?: number;
  stormChanceBoost?: number;
  stormTriggerDay?: number;
  waterCostReduction?: number;
  maintenanceInterval?: number;
  maintenanceBaseCost?: number;
}

export interface DailyLesson {
  day: number;
  title: string;
  content: string;
  tip: string;
  basedOn: string[]; // What player actions triggered this lesson
  goodDecisions?: string[]; // What went well
  improvements?: string[]; // What could be better
}

export interface DailyDecision {
  id: string;
  day: number;
  eventId: string;
  eventTitle: string;
  choiceId: string;
  choiceLabel: string;
  walletDelta: number;
  savingsDelta: number;
  investmentDelta: number;
  treeHealthDelta: number;
  riskDelta: number;
  consequenceSummary: string;
  wasTemptationAccepted: boolean;
}

export interface SimpleEventChoice {
  id: string;
  label: string;
  icon: string;
  cost?: number;
}

export interface SimpleEvent {
  id: string;
  title: string;
  icon: string;
  advantage: string;
  disadvantage: string;
  choices: SimpleEventChoice[];
}

export interface StockPoint {
  day: string;
  price: number;
}

export interface StockItem {
  id: string;
  symbol: string;
  name: string;
  points: StockPoint[];
  dailyNews: string[];
}

export interface InflationRate {
  day: number;
  rate: number;
  cashPowerLoss: number;
}

export interface ActiveEffect {
  id: string;
  source: string;
  type: "buff" | "debuff" | "neutral";
  impactText: string;
  remainingDays: number | null;
  percentImpact?: number;
}

export interface EmergencyLoan {
  id: string;
  principal: number;
  startDay: number;
  dailyInterestRate: number;
  totalPaid: number;
  totalInterestPaid: number;
}

export interface LoanSnapshot {
  loanTakenToday: number;
  loanRepaidToday: number;
  loanInterestPaidToday: number;
  hasActiveLoan: boolean;
  principal: number;
  daysOutstanding: number;
  outstandingAmount: number;
}

export interface FinancialBreakdown {
  earningsToday: number;
  weatherLossToday: number;
  maintenancePaidToday: number;
  inflationLossToday: number;
  eventCashFlow: number;
  savedToday: number;
  investedToday: number;
  loanTakenToday: number;
  loanRepaidToday: number;
  loanInterestPaidToday: number;
  netCashFlow: number;
}

export interface PhaseUnlockModal {
  fromPhase: number;
  toPhase: number;
  learned: string[];
  unlockedFeatures: string[];
}

export interface DailySummary {
  id: string;
  currentDay: number;
  currentPhase: number;
  decisions: DailyDecision[];
  treeHealth: number;
  walletBalance: number;
  savingsBalance: number;
  bankBalance: number;
  investmentBalance: number;
  fixedDeposits: Array<{ id: string; principal: number; maturityDay: number; matured: boolean }>;
  sips: Array<{ id: string; amount: number; intervalDays: number; totalInvested: number; currentValue: number; isActive: boolean }>;
  assetsOwned: Array<{ id: string; name: string; type: AssetType; currentValue: number }>;
  inflation: InflationRate;
  pendingConsequences: PendingEvent[];
  temptationsAccepted: string[];
  savedToday: number;
  investedToday: number;
  spentToday: number;
  maintenancePaid: number;
  weather: WeatherEvent;
  riskLevel: RiskLevel;
  netWorth: number;
  activeEffects: ActiveEffect[];
  loanSnapshot: LoanSnapshot;
  financialBreakdown: FinancialBreakdown;
}

export interface GeminiReview {
  day: number;
  summary: string;
  goodThings?: string[];
  improvements?: string[];
  exp: number;
  suggestedQuestions: string[];
  model?: string;
}

export interface GeminiChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface PlayerLevel {
  level: number;
  totalEXP: number;
  expForNextLevel: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  level: number;
  score: number;
  trend: "up" | "down" | "steady";
}

export interface EventChoiceConsequence {
  walletDelta?: number;
  savingsDelta?: number;
  investmentDelta?: number;
  treeHealthDelta?: number;
  riskDelta?: number;
  rewardWater?: number;
  scheduleEventId?: string;
  scheduleAfterDays?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  icon: string;
  consequence: EventChoiceConsequence;
}

export interface Event {
  id: string;
  title: string;
  icon: string;
  type: "temptation" | "loss" | "reward" | "invest" | "market";
  probability: number;
  minDay?: number;
  maxDay?: number;
  choices: EventChoice[];
}

export interface PendingEvent {
  id: string;
  eventId: string;
  executeOnDay: number;
  reason?: string;
  type?: PendingConsequenceType;
  amount?: number;
  successAmount?: number;
  failureAmount?: number;
  successChance?: number;
}

export interface TreeHealth {
  value: number;
}

export interface SuddenEventOption {
  id: string;
  label: string;
  walletDelta: number;
  savingsDelta?: number;
  investmentDelta?: number;
  treeHealthDelta?: number;
  quality: EventOutcomeQuality;
  resultText: string;
}

export interface SuddenEvent {
  id: string;
  title: string;
  scenario: string;
  options: SuddenEventOption[];
}

export interface EventResolutionLog {
  day: number;
  eventTitle: string;
  optionLabel: string;
  quality: EventOutcomeQuality;
  resultText: string;
}

export interface MaintenanceCharge {
  assetId: string;
  assetName: string;
  cost: number;
  note: string;
}

export interface StormEmergency {
  title: string;
  description: string;
  cost: number;
  fromWallet: number;
  fromSavings: number;
  deficit: number;
}

export interface GameState {
  player: Player;
  playerLevel: number;
  totalEXP: number;
  tree: Tree;
  savings: SavingsAccount;
  fixedDeposits: FixedDeposit[];
  sips: SIP[]; // Active SIPs
  ownedAssets: Asset[];
  marketAssets: MarketAsset[];
  lessons: DailyLesson[];
  dailySummaries: DailySummary[];
  dailyDecisionLog: DailyDecision[];
  latestGeminiReview: GeminiReview | null;
  reviewChatMessages: GeminiChatMessage[];
  reviewStatus: ReviewStatus;
  reviewError: string | null;
  aiReviewEnabled: boolean;
  lastAwardedReviewDay: number;
  leaderboard: LeaderboardEntry[];
  hasPlayed: boolean;
  currentDay: number;
  treeHealth: TreeHealth;
  riskMeter: number;
  riskLevel: RiskLevel;
  currentPhase: number;
  completedScenarios: number;
  phaseUnlockModal: PhaseUnlockModal | null;
  emergencyLoan: EmergencyLoan | null;
  loanTakenToday: number;
  loanRepaidToday: number;
  loanInterestPaidToday: number;
  weatherLossToday: number;
  pendingEvents: PendingEvent[];
  currentSimpleEvent: SimpleEvent | null;
  activeDailyEvents: Event[];
  activeGameEvent: Event | null;
  eventConsequences: Array<{
    id: string;
    icon: string;
    title: string;
    summary: string;
  }>;
  investmentPreviewDays: number | null;

  // Visual state
  timeOfDay: TimeOfDay;
  currentScreen: GameScreen;
  showWaterEffect: boolean;
  showCoinEffect: boolean;
  lastCoinAmount: number;
  currentWeather: WeatherEvent;
  weatherIntensity: number;
  currentInflationRate: number;
  inflationImpactToday: number;
  activeStormEmergency: StormEmergency | null;
  showStormEmergency: boolean;
  dayStartTotalEarnings: number;
  todayInvested: number;
  todayBankSaved: number;
  todaySavingsDeposited: number;
  activeSuddenEvent: SuddenEvent | null;
  showSuddenEvent: boolean;
  lastSuddenEventDay: number;
  eventHistory: EventResolutionLog[];
  latestEventResolution: EventResolutionLog | null;
  maintenanceChargesToday: MaintenanceCharge[];
  showMaintenancePopup: boolean;
  isGameOver: boolean;
  gameOverReason: string | null;
  stockItems: StockItem[];
  stockUnlocked: boolean;
  stormPenaltyDaysRemaining: number;

  // Storm chance modifier (from high-risk assets)
  stormChanceModifier: number;

  // Game flow
  isPlaying: boolean;
  showEndOfDay: boolean;
  showLesson: boolean;
  currentLesson: DailyLesson | null;
  aiTip: string | null;

  // Bank modal access during day
  showBankModal: boolean;
}

export interface GameActions {
  startJourney: () => void;

  // Tree actions
  waterTree: () => void;
  buyWater: (units: number) => void;
  triggerWeatherEvent: (event: WeatherEvent) => void;
  clearWeatherEvent: () => void;
  payWeatherCharge: () => void;

  // Banking actions
  depositToSavings: (amount: number) => void;
  withdrawFromSavings: (amount: number) => void;
  takeEmergencyLoan: (amount: number) => boolean;
  repayEmergencyLoan: () => boolean;
  createFixedDeposit: (amount: number, durationDays: number) => void;
  withdrawFixedDeposit: (fdId: string) => void;

  // SIP actions
  createSIP: (amount: number, intervalDays: number) => void;
  cancelSIP: (sipId: string) => void;

  // New money management (end of day)
  saveToBank: (amount: number) => void;
  investMoney: (amount: number) => void;

  // Asset actions
  buyAsset: (assetId: string) => void;
  sellAsset: (assetId: string) => void;

  // Day progression
  endDay: () => void;
  startNewDay: () => void;
  advanceDay: () => void;
  handleEventChoice: (choiceId: string) => void;
  applyInvestmentPreview: (days: number | null) => void;
  buildDailySummary: () => DailySummary;
  setGeminiReview: (review: GeminiReview) => void;
  setReviewStatus: (status: ReviewStatus, error?: string | null) => void;
  setAiReviewEnabled: (enabled: boolean) => void;
  awardNightExp: (extraExp: number, day: number) => void;
  isFeatureUnlocked: (feature: UnlockFeature) => boolean;
  dismissPhaseUnlockModal: () => void;
  addReviewChatMessage: (message: GeminiChatMessage) => void;
  clearReviewChatMessages: () => void;
  setHasPlayed: (value: boolean) => void;
  refreshLeaderboard: () => void;

  // Screen navigation
  setScreen: (screen: GameScreen) => void;
  toggleBankModal: () => void;

  // Visual effects
  triggerWaterEffect: () => void;
  triggerCoinEffect: (amount: number) => void;
  setAITip: (tip: string | null) => void;

  // Lesson
  dismissLesson: () => void;
  dismissMaintenancePopup: () => void;
  dismissStormEmergency: () => void;
  resolveSuddenEvent: (optionId: string) => void;

  // Game management
  resetGame: () => void;
  loadGame: () => void;
}
