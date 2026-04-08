// Game configuration constants

import type { Event } from "@/types/game";

export const GAME_CONFIG = {
  // Starting values
  INITIAL_MONEY: 100,
  INITIAL_WATER: 5,

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
  MAX_EVENTS_PER_DAY: 3,
  TEMPTATION_SAVINGS_THRESHOLD: 300,
  MORNING_PHASE_DURATION_MS: 30000,
  LEVEL_EXP_PER_LEVEL: 200,
  INFLATION_RATE_MIN: 0.003,
  INFLATION_RATE_MAX: 0.008,
  DAILY_SUMMARY_STORAGE_KEY: "growtopia-daily-summaries",
} as const;

export const EVENT_TEMPLATES: Event[] = [
  {
    id: "asset-discount",
    title: "Asset Discount!",
    icon: "🏷️",
    type: "temptation",
    probability: 0.14,
    minDay: 2,
    choices: [
      {
        id: "buy-discount",
        label: "Buy now at 30% off",
        icon: "🔥",
        consequence: {
          walletDelta: -280,
          investmentDelta: 80,
          riskDelta: 10,
          scheduleEventId: "asset-maintenance-shock",
          scheduleAfterDays: 2,
        },
      },
      {
        id: "wait-plan",
        label: "Skip and keep buffer",
        icon: "🧠",
        consequence: { treeHealthDelta: 4, riskDelta: -4 },
      },
    ],
  },
  {
    id: "asset-maintenance-shock",
    title: "Maintenance Shock",
    icon: "🧾",
    type: "loss",
    probability: 0,
    choices: [
      {
        id: "pay-fee",
        label: "Pay maintenance fee",
        icon: "💸",
        consequence: { walletDelta: -210, treeHealthDelta: -10, riskDelta: 8 },
      },
    ],
  },
  {
    id: "quick-fd-bonus",
    title: "Quick FD Bonus",
    icon: "🔒",
    type: "temptation",
    probability: 0.11,
    minDay: 2,
    choices: [
      {
        id: "lock-cash",
        label: "Lock money for bonus",
        icon: "⚡",
        consequence: {
          walletDelta: -180,
          investmentDelta: 240,
          treeHealthDelta: 7,
          scheduleEventId: "liquidity-crunch",
          scheduleAfterDays: 3,
        },
      },
      {
        id: "keep-liquid",
        label: "Keep funds flexible",
        icon: "🪙",
        consequence: { riskDelta: -2, treeHealthDelta: 2 },
      },
    ],
  },
  {
    id: "liquidity-crunch",
    title: "Liquidity Crunch",
    icon: "🥶",
    type: "loss",
    probability: 0,
    choices: [
      {
        id: "cover-gap",
        label: "Cover urgent expense",
        icon: "🚨",
        consequence: { walletDelta: -170, savingsDelta: -50, treeHealthDelta: -8, riskDelta: 8 },
      },
    ],
  },
  {
    id: "delay-payment-offer",
    title: "Delay Payment Offer",
    icon: "🗓️",
    type: "temptation",
    probability: 0.13,
    minDay: 2,
    choices: [
      {
        id: "delay-bill",
        label: "Delay bill and keep cash now",
        icon: "😮",
        consequence: {
          walletDelta: 90,
          riskDelta: 16,
          scheduleEventId: "delayed-bill-penalty",
          scheduleAfterDays: 2,
        },
      },
      {
        id: "pay-now",
        label: "Pay now and stay safe",
        icon: "✅",
        consequence: { walletDelta: -90, riskDelta: -3, treeHealthDelta: 2 },
      },
    ],
  },
  {
    id: "delayed-bill-penalty",
    title: "Delayed Bill Penalty",
    icon: "📬",
    type: "loss",
    probability: 0,
    choices: [
      {
        id: "pay-with-penalty",
        label: "Pay delayed bill (+15%)",
        icon: "💸",
        consequence: { walletDelta: -104, treeHealthDelta: -6, riskDelta: 8 },
      },
    ],
  },
  {
    id: "risky-trade",
    title: "Risky Trade",
    icon: "📉",
    type: "temptation",
    probability: 0.1,
    minDay: 3,
    choices: [
      {
        id: "go-all-in",
        label: "Take high-risk trade",
        icon: "🎲",
        consequence: {
          walletDelta: -140,
          investmentDelta: 210,
          riskDelta: 18,
          scheduleEventId: "risky-trade-crash",
          scheduleAfterDays: 1,
        },
      },
      {
        id: "pass",
        label: "Skip risky trade",
        icon: "🛡️",
        consequence: { treeHealthDelta: 3, riskDelta: -4 },
      },
    ],
  },
  {
    id: "risky-trade-crash",
    title: "Trade Crash",
    icon: "💥",
    type: "loss",
    probability: 0,
    choices: [
      {
        id: "absorb-loss",
        label: "Absorb crash loss",
        icon: "📉",
        consequence: { walletDelta: -220, treeHealthDelta: -12, riskDelta: 12 },
      },
    ],
  },
  {
    id: "course-bundle",
    title: "Skill Course Bundle",
    icon: "🎓",
    type: "temptation",
    probability: 0.09,
    minDay: 2,
    choices: [
      {
        id: "buy-bundle",
        label: "Buy all courses now",
        icon: "📚",
        consequence: {
          walletDelta: -160,
          treeHealthDelta: 5,
          riskDelta: 6,
          scheduleEventId: "subscription-renewal",
          scheduleAfterDays: 3,
        },
      },
      {
        id: "buy-one",
        label: "Pick one affordable course",
        icon: "✅",
        consequence: { walletDelta: -60, treeHealthDelta: 3, riskDelta: -1 },
      },
    ],
  },
  {
    id: "subscription-renewal",
    title: "Auto-Renewal Charge",
    icon: "🔁",
    type: "loss",
    probability: 0,
    choices: [
      {
        id: "pay-renewal",
        label: "Pay renewal fee",
        icon: "💳",
        consequence: { walletDelta: -130, riskDelta: 6, treeHealthDelta: -4 },
      },
    ],
  },
  {
    id: "safe-sip-nudge",
    title: "Steady SIP Boost",
    icon: "📊",
    type: "invest",
    probability: 0.08,
    minDay: 2,
    choices: [
      {
        id: "start-steady",
        label: "Start a steady SIP",
        icon: "🌱",
        consequence: { walletDelta: -80, investmentDelta: 95, treeHealthDelta: 4, riskDelta: -2 },
      },
      {
        id: "later",
        label: "Later",
        icon: "⏳",
        consequence: { riskDelta: 2 },
      },
    ],
  },
  {
    id: "emergency-grant",
    title: "Emergency Grant",
    icon: "🎁",
    type: "reward",
    probability: 0.06,
    choices: [
      {
        id: "take-grant",
        label: "Take support grant",
        icon: "🧯",
        consequence: { walletDelta: 90, rewardWater: 2, riskDelta: -6, treeHealthDelta: 3 },
      },
    ],
  },
];

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
