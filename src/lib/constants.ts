import type {
  AssetDescription,
  Event,
  MarketAsset,
  SimpleEvent,
  StockItem,
} from "@/types/game";

export const GAME_CONFIG = {
  INITIAL_MONEY: 100,
  INITIAL_WATER: 5,

  EMERGENCY_LOAN_OPTIONS: [500, 1000, 2000],
  EMERGENCY_LOAN_DAILY_INTEREST_RATE: 0.02,
  EMERGENCY_LOAN_DANGER_WALLET: 40,

  WATER_COST_SINGLE: 100,
  WATER_COST_5: 450,
  WATER_COST_10: 850,

  BASE_TREE_YIELD: 120,
  MAX_WATERING_PER_DAY: 3,
  TREE_HEALTH_DECAY: 5,
  TREE_HEALTH_GAIN: 10,
  WATERING_SESSIONS_PER_DAY: 3,

  SAVINGS_INTEREST_RATE: 0.01,
  FD_MINIMUM_AMOUNT: 100,
  FD_OPTIONS: [
    { days: 3, rate: 0.05, label: "3 Days - 5%" },
    { days: 7, rate: 0.08, label: "7 Days - 8%" },
    { days: 15, rate: 0.12, label: "15 Days - 12%" },
    { days: 30, rate: 0.20, label: "30 Days - 20%" },
  ],
  FD_EARLY_WITHDRAWAL_PENALTY: 0.15,

  SIP_MIN_AMOUNT: 50,
  SIP_INTERVALS: [
    { days: 1, label: "Daily" },
    { days: 3, label: "Every 3 Days" },
    { days: 7, label: "Weekly" },
  ],
  SIP_GROWTH_RATE: 0.02,

  WEATHER_RAIN_BONUS: 0,
  WEATHER_DROUGHT_PENALTY: 0.6,
  WEATHER_STORM_PENALTY: 0,
  WEATHER_STORM_EMERGENCY_LOSS: 80,
  WEATHER_STORM_TREE_HEALTH_LOSS: 15,
  WEATHER_STORM_TREE_HEALTH_DAYS: 2,
  BASE_STORM_CHANCE: 0,
  MAX_EVENTS_PER_DAY: 1,
  TEMPTATION_SAVINGS_THRESHOLD: 120,

  DEPRECIATING_EFFECT_DECAY_INTERVAL_DAYS: 2,
  DEPRECIATING_EFFECT_DECAY_PERCENT: 4,
  DEPRECIATING_EFFECT_MIN_MULTIPLIER: 0.7,
  DEPRECIATING_MAINTENANCE_INTERVAL_DAYS: 2,

  DAILY_CASH_INFLATION_RATE: 0.005,
  INFLATION_RATE_MIN: 0.005,
  INFLATION_RATE_MAX: 0.005,
  MORNING_PHASE_DURATION_MS: 12000,

  REVIEW_BASE_EXP: 25,
  REVIEW_MAX_EXTRA_EXP: 75,
  LEVEL_EXP_PER_LEVEL: 250,
  STOCK_UNLOCK_LEVEL: 8,

  DAILY_SUMMARY_STORAGE_KEY: "growtopia-daily-summaries",
} as const;

export const ASSET_DESCRIPTIONS: Record<string, AssetDescription> = {
  bike: {
    id: "bike",
    type: "depreciating",
    description:
      "Gives quick boost to daily earnings for 2-3 days but will need costly repairs later.",
  },
  scooter: {
    id: "scooter",
    type: "depreciating",
    description:
      "Gives quick boost to daily earnings for 2-3 days but will need costly repairs later.",
  },
  car: {
    id: "car",
    type: "depreciating",
    description:
      "Gives quick boost to daily earnings for 2-3 days but will need costly repairs later.",
  },
  "village-shop": {
    id: "village-shop",
    type: "appreciating",
    description:
      "Increases tree earnings permanently by 12-18% every day after purchase.",
  },
  "green-energy": {
    id: "green-energy",
    type: "appreciating",
    description:
      "Increases tree earnings permanently by 12-18% every day after purchase.",
  },
};

export const SIMPLE_EVENTS: SimpleEvent[] = [
  {
    id: "bike-offer",
    title: "Bike Offer",
    icon: "🚲",
    advantage: "+25% earning for next 3 days.",
    disadvantage: "On Day+4, ₹120 maintenance cost.",
    choices: [
      { id: "accept", label: "Accept Bike Offer", icon: "✅" },
      { id: "skip", label: "Skip for Safety", icon: "🛡️" },
    ],
  },
  {
    id: "scooter-offer",
    title: "Scooter Offer",
    icon: "🛵",
    advantage: "+18% earning for next 2 days.",
    disadvantage: "On Day+3, ₹90 repair cost.",
    choices: [
      { id: "accept", label: "Take Scooter Deal", icon: "🔥" },
      { id: "skip", label: "Avoid Repair Risk", icon: "🧠" },
    ],
  },
  {
    id: "festival-gift-offer",
    title: "Festival Gift Offer",
    icon: "🎁",
    advantage: "Spend ₹120 now and get ₹60 extra next day.",
    disadvantage: "If savings buffer is low tomorrow, tree health -10.",
    choices: [
      { id: "accept", label: "Buy Gift Pack", icon: "🎉", cost: 120 },
      { id: "skip", label: "Skip and Save", icon: "💰" },
    ],
  },
  {
    id: "delay-bill-offer",
    title: "Delay Bill Offer",
    icon: "📄",
    advantage: "Get instant ₹100 cash today.",
    disadvantage: "Day+5 bill becomes ₹130.",
    choices: [
      { id: "accept", label: "Delay the Bill", icon: "⏳" },
      { id: "skip", label: "Pay on Time", icon: "✅" },
    ],
  },
  {
    id: "emergency-friend-help",
    title: "Emergency Friend Help",
    icon: "🤝",
    advantage: "Lend ₹80 today and friend may return ₹110 in 4 days.",
    disadvantage: "40% chance friend returns only ₹40.",
    choices: [
      { id: "accept", label: "Help Friend", icon: "💛", cost: 80 },
      { id: "skip", label: "Keep Emergency Cash", icon: "🧯" },
    ],
  },
  {
    id: "quick-fd-bonus",
    title: "Quick FD Bonus Event",
    icon: "🔒",
    advantage: "Lock ₹150 for 7 days: 8% FD + extra 3% bonus.",
    disadvantage: "Money is locked and cannot be used early without penalty.",
    choices: [
      { id: "accept", label: "Create Bonus FD", icon: "📈", cost: 150 },
      { id: "skip", label: "Keep Wallet Liquid", icon: "🪙" },
    ],
  },
  {
    id: "appreciating-asset-discount",
    title: "Appreciating Asset Discount",
    icon: "🏪",
    advantage: "Buy Village Shop for ₹200 instead of ₹280 (+15% permanent earning).",
    disadvantage: "None. Great deal if you can afford it.",
    choices: [
      { id: "accept", label: "Buy Village Shop", icon: "✅", cost: 200 },
      { id: "skip", label: "Skip for Now", icon: "⏭️" },
    ],
  },
  {
    id: "car-offer",
    title: "Car Offer",
    icon: "🚗",
    advantage: "+35% earning for next 3 days.",
    disadvantage: "On Day+4, pay ₹250 heavy maintenance.",
    choices: [
      { id: "accept", label: "Take Car Deal", icon: "⚡" },
      { id: "skip", label: "Avoid Heavy Cost", icon: "🧠" },
    ],
  },
];

// Kept for compatibility with older modules.
export const EVENT_TEMPLATES: Event[] = [];

export const MARKET_ASSETS: MarketAsset[] = [
  {
    id: "bike",
    name: "🚲 Bike",
    type: "depreciating",
    description: ASSET_DESCRIPTIONS.bike.description,
    basePrice: 160,
    currentPrice: 160,
    boostMultiplier: 1.25,
    boostDuration: 3,
    depreciationRate: 0.1,
    maintenanceCost: 24,
    maintenanceInterval: 2,
  },
  {
    id: "scooter",
    name: "🛵 Scooter",
    type: "depreciating",
    description: ASSET_DESCRIPTIONS.scooter.description,
    basePrice: 210,
    currentPrice: 210,
    boostMultiplier: 1.18,
    boostDuration: 2,
    depreciationRate: 0.11,
    maintenanceCost: 32,
    maintenanceInterval: 2,
  },
  {
    id: "car",
    name: "🚗 Car",
    type: "depreciating",
    description: ASSET_DESCRIPTIONS.car.description,
    basePrice: 480,
    currentPrice: 480,
    boostMultiplier: 1.35,
    boostDuration: 3,
    depreciationRate: 0.12,
    maintenanceCost: 50,
    maintenanceInterval: 2,
  },
  {
    id: "village-shop",
    name: "🏪 Village Shop",
    type: "appreciating",
    description: ASSET_DESCRIPTIONS["village-shop"].description,
    basePrice: 280,
    currentPrice: 280,
    appreciationRate: 0.15,
    appreciationInterval: 1,
    peakDay: 365,
  },
  {
    id: "green-energy",
    name: "🔋 Green Energy",
    type: "appreciating",
    description: ASSET_DESCRIPTIONS["green-energy"].description,
    basePrice: 320,
    currentPrice: 320,
    appreciationRate: 0.12,
    appreciationInterval: 1,
    peakDay: 365,
  },
];

export const STOCK_ITEMS: StockItem[] = [
  {
    id: "agri-tech",
    symbol: "AGT",
    name: "AgriTech Co.",
    points: [
      { day: "D1", price: 92 },
      { day: "D2", price: 95 },
      { day: "D3", price: 93 },
      { day: "D4", price: 97 },
      { day: "D5", price: 101 },
    ],
    dailyNews: [
      "Crop sensor demand rose in rural markets.",
      "AgriTech signed a new school farm program.",
    ],
  },
  {
    id: "solar-grid",
    symbol: "SOL",
    name: "Solar Grid",
    points: [
      { day: "D1", price: 120 },
      { day: "D2", price: 118 },
      { day: "D3", price: 121 },
      { day: "D4", price: 125 },
      { day: "D5", price: 124 },
    ],
    dailyNews: [
      "New rooftop policy improved clean-energy demand.",
      "Solar Grid opened two micro-grid projects.",
    ],
  },
  {
    id: "fresh-mart",
    symbol: "FSM",
    name: "FreshMart",
    points: [
      { day: "D1", price: 76 },
      { day: "D2", price: 79 },
      { day: "D3", price: 77 },
      { day: "D4", price: 82 },
      { day: "D5", price: 84 },
    ],
    dailyNews: [
      "Festival sales increased FreshMart margins.",
      "Cold-chain expansion announced in two towns.",
    ],
  },
  {
    id: "water-systems",
    symbol: "WTR",
    name: "Water Systems",
    points: [
      { day: "D1", price: 64 },
      { day: "D2", price: 66 },
      { day: "D3", price: 69 },
      { day: "D4", price: 68 },
      { day: "D5", price: 72 },
    ],
    dailyNews: [
      "Water recycling contracts signed with local councils.",
      "Pump efficiency upgrade reduced production costs.",
    ],
  },
];

export const LESSON_TRIGGERS = {
  FIRST_WATERING: "first_watering",
  FIRST_SAVINGS: "first_savings",
  FIRST_FD: "first_fd",
  BOUGHT_DEPRECIATING: "bought_depreciating",
  BOUGHT_APPRECIATING: "bought_appreciating",
  MAINTENANCE_STARTED: "maintenance_started",
  FD_MATURED: "fd_matured",
  SOLD_PROFIT: "sold_profit",
  SOLD_LOSS: "sold_loss",
  LOW_MONEY: "low_money",
  HIGH_SAVINGS: "high_savings",
} as const;
