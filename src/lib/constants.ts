// Game configuration constants

export const GAME_CONFIG = {
  // Starting values
  INITIAL_MONEY: 0, // Start with zero balance
  INITIAL_WATER: 10, // Start with 10 water drops

  // Water mechanics - updated pricing
  WATER_COST_SINGLE: 100, // Cost for 1 water drop
  WATER_COST_5: 450, // Cost for 5 water drops (10% discount)
  WATER_COST_10: 850, // Standard cost for 10 water drops

  // Tree mechanics
  BASE_TREE_YIELD: 120, // ₹120 per watering (per drop)
  MAX_WATERING_PER_DAY: 3, // Maximum times tree can be watered per day
  TREE_HEALTH_DECAY: 5, // Health lost if not watered
  TREE_HEALTH_GAIN: 10, // Health gained per watering

  // Banking - Savings Account
  SAVINGS_INTEREST_RATE: 0.01, // 1% daily interest

  // Banking - Fixed Deposit options
  FD_MINIMUM_AMOUNT: 100,
  FD_OPTIONS: [
    { days: 3, rate: 0.05, label: "3 Days - 5%" },
    { days: 7, rate: 0.08, label: "7 Days - 8%" },
    { days: 15, rate: 0.12, label: "15 Days - 12%" },
    { days: 30, rate: 0.20, label: "30 Days - 20%" },
  ],
  FD_EARLY_WITHDRAWAL_PENALTY: 0.15, // 15% penalty for early withdrawal

  // Banking - SIP (Systematic Investment Plan)
  SIP_MIN_AMOUNT: 50,
  SIP_INTERVALS: [
    { days: 30, label: "1 Month (30 days)" },
    { days: 60, label: "2 Months (60 days)" },
  ],
  SIP_GROWTH_RATE: 0.02, // 2% growth per interval

  // Days
  WATERING_SESSIONS_PER_DAY: 3, // After this many waterings, day can end

  // Weather Events
  WEATHER_RAIN_BONUS: 0.01, // 1% earnings bonus during rain
  WEATHER_DROUGHT_PENALTY: 0.25, // 25% earnings penalty during drought
  WEATHER_STORM_PENALTY: 0.3, // 30% earnings penalty during storm
  WEATHER_EVENT_DURATION: 1, // Weather events last for the current day
  WEATHER_RAIN_CLEAR_COST: 50,
  WEATHER_DROUGHT_CLEAR_COST: 100,
  WEATHER_STORM_CLEAR_COST: 150,
  WEATHER_DAILY_WATER_BONUS: 10,
  BASE_STORM_CHANCE: 0.05, // 5% base chance of storm each day

  // Asset maintenance intervals
  CAR_MAINTENANCE_INTERVAL: 15, // Every 15 days
  CAR_MAINTENANCE_BASE_COST: 2, // Starting maintenance cost (doubles each time)
  SMARTPHONE_MAINTENANCE_COST: 400, // One-time repair after storm
} as const;

export const MARKET_ASSETS = [
  // Depreciating Assets
  {
    id: "smartphone",
    name: "📱 Smartphone",
    type: "depreciating" as const,
    description: "High earnings for 2 days, then repairs and maintenance rise quickly.",
    basePrice: 1000,
    currentPrice: 1000,
    boostMultiplier: 4.0, // 300% more = 4x income
    boostDuration: 2, // For 2 days only
    depreciationRate: 0.15, // Loses 15% value daily after boost
    maintenanceCost: 120, // Base daily maintenance after boost
    stormChanceBoost: 0.35, // +35% storm chance after 3-4 days until storm
    stormTriggerDay: 3, // Days after purchase when storm chance increases
  },
  {
    id: "car",
    name: "🚗 Car",
    type: "depreciating" as const,
    description: "Water costs less, but maintenance starts after day 15 and rises fast.",
    basePrice: 2000,
    currentPrice: 2000,
    waterCostReduction: 12, // Reduces water cost by ₹12 each
    boostMultiplier: 1.0, // No direct income boost
    boostDuration: 15, // Grace period before daily maintenance starts
    depreciationRate: 0.05, // Loses 5% value daily
    maintenanceInterval: 15, // Every 15 days
    maintenanceBaseCost: 60, // Base maintenance before exponential increase
  },
  {
    id: "bicycle",
    name: "🚲 Bicycle",
    type: "depreciating" as const,
    description: "A starter vehicle! Small boost, low maintenance.",
    basePrice: 300,
    currentPrice: 300,
    boostMultiplier: 1.3, // 30% more income
    boostDuration: 7, // For 7 days
    depreciationRate: 0.08, // Loses 8% value daily after boost
    maintenanceCost: 20, // Costs ₹20 per day after boost
  },

  // Appreciating Assets
  {
    id: "gold",
    name: "🪙 Gold",
    type: "appreciating" as const,
    description: "No immediate benefit. Value grows 10% every 15 days! Long-term wealth.",
    basePrice: 500,
    currentPrice: 500,
    appreciationRate: 0.10, // 10% growth
    appreciationInterval: 15, // Every 15 days
    peakDay: 90, // Peaks at day 90 from purchase
  },
  {
    id: "silver",
    name: "🥈 Silver",
    type: "appreciating" as const,
    description: "Affordable precious metal. Value grows 8% every 15 days.",
    basePrice: 200,
    currentPrice: 200,
    appreciationRate: 0.08, // 8% growth every interval
    appreciationInterval: 15, // Every 15 days
    peakDay: 75, // Peaks at day 75 from purchase
  },
  {
    id: "land_plot",
    name: "🏞️ Land",
    type: "appreciating" as const,
    description: "Real estate! Grows 15% every 15 days. The best long-term investment.",
    basePrice: 1500,
    currentPrice: 1500,
    appreciationRate: 0.15, // 15% growth every interval
    appreciationInterval: 15, // Every 15 days
    peakDay: 120, // Peaks at day 120 from purchase
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
