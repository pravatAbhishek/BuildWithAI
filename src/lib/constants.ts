// Game configuration constants

export const GAME_CONFIG = {
  // Starting values
  INITIAL_MONEY: 100,
  INITIAL_WATER: 10,

  // Water mechanics
  WATER_COST: 10, // Cost per water unit
  WATER_BUNDLE_SIZE: 5, // Units per purchase

  // Tree mechanics
  BASE_TREE_YIELD: 25, // Base money per watering
  MAX_WATERING_PER_DAY: 3, // Maximum times tree can be watered per day
  TREE_HEALTH_DECAY: 5, // Health lost if not watered
  TREE_HEALTH_GAIN: 10, // Health gained per watering

  // Banking - Savings Account
  SAVINGS_INTEREST_RATE: 0.002, // 0.2% daily (low but safe)

  // Banking - Investing Account
  FD_MINIMUM_AMOUNT: 50,
  FD_LOCK_DAYS: 3,
  FD_INTEREST_RATE: 0.06, // 6% after 3 days

  // Days
  WATERING_SESSIONS_PER_DAY: 3, // After this many waterings, day can end
} as const;

export const MARKET_ASSETS = [
  // Depreciating Assets
  {
    id: "bicycle",
    name: "🚲 Bicycle",
    type: "depreciating" as const,
    description: "A fancy bicycle! Gives you a boost but needs maintenance.",
    basePrice: 200,
    currentPrice: 200,
    boostMultiplier: 1.3, // 30% more income
    boostDuration: 5, // For 5 days
    depreciationRate: 0.1, // Loses 10% value daily after boost
    maintenanceCost: 5, // Costs 5 per day after boost
  },
  {
    id: "scooter",
    name: "🛵 Scooter",
    type: "depreciating" as const,
    description: "A motorized scooter! Great boost but expensive to maintain.",
    basePrice: 500,
    currentPrice: 500,
    boostMultiplier: 1.5, // 50% more income
    boostDuration: 7, // For 7 days
    depreciationRate: 0.08, // Loses 8% value daily after boost
    maintenanceCost: 15, // Costs 15 per day after boost
  },
  {
    id: "car",
    name: "🚗 Car",
    type: "depreciating" as const,
    description: "A car! Amazing boost but very expensive maintenance.",
    basePrice: 1500,
    currentPrice: 1500,
    boostMultiplier: 2.0, // 100% more income
    boostDuration: 10, // For 10 days
    depreciationRate: 0.05, // Loses 5% value daily after boost
    maintenanceCost: 50, // Costs 50 per day after boost
  },

  // Appreciating Assets
  {
    id: "gold_coin",
    name: "🪙 Gold Coin",
    type: "appreciating" as const,
    description: "A small gold investment. Safe and steady growth.",
    basePrice: 100,
    currentPrice: 100,
    appreciationRate: 0.01, // 1% daily growth
    peakDay: 30, // Peaks at day 30 from purchase
  },
  {
    id: "silver_set",
    name: "🥈 Silver Set",
    type: "appreciating" as const,
    description: "A set of silver items. Good appreciation over time.",
    basePrice: 300,
    currentPrice: 300,
    appreciationRate: 0.015, // 1.5% daily growth
    peakDay: 25, // Peaks at day 25 from purchase
  },
  {
    id: "land_plot",
    name: "🏞️ Land Plot",
    type: "appreciating" as const,
    description: "A small piece of land. Excellent long-term investment!",
    basePrice: 1000,
    currentPrice: 1000,
    appreciationRate: 0.025, // 2.5% daily growth
    peakDay: 40, // Peaks at day 40 from purchase
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
