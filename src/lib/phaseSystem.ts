import type { SaplingStage, UnlockFeature } from "@/types/game";

export type PhaseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface PhaseDefinition {
  id: PhaseId;
  name: string;
  unlockedFeatures: UnlockFeature[];
  learned: string[];
  unlockSummary: string[];
}

export interface PhaseProgressSnapshot {
  currentPhase: number;
  currentDay: number;
  totalWaterings: number;
  completedScenarios: number;
  savingsBalance: number;
  hasAnyInvestment: boolean;
  treeStage: SaplingStage;
}

export const PHASE_CONFIG: Record<PhaseId, PhaseDefinition> = {
  1: {
    id: 1,
    name: "Introduction",
    unlockedFeatures: ["tree-growth", "water-usage", "coin-earning"],
    learned: [
      "Watering tree creates earnings.",
      "Cash in wallet is your daily working money.",
    ],
    unlockSummary: ["Tree growth", "Water usage", "Coin earning"],
  },
  2: {
    id: 2,
    name: "Basic Decisions",
    unlockedFeatures: [
      "tree-growth",
      "water-usage",
      "coin-earning",
      "simple-scenarios",
    ],
    learned: [
      "Short-term spending choices affect tomorrow.",
      "Every scenario has trade-offs.",
    ],
    unlockSummary: ["Simple scenarios"],
  },
  3: {
    id: 3,
    name: "Saving System",
    unlockedFeatures: [
      "tree-growth",
      "water-usage",
      "coin-earning",
      "simple-scenarios",
      "savings-account",
      "bank-loans",
    ],
    learned: [
      "Savings protects you from sudden cash shocks.",
      "Emergency loan is useful but costly.",
    ],
    unlockSummary: ["Savings account", "Emergency bank loan"],
  },
  4: {
    id: 4,
    name: "Needs vs Wants + Events",
    unlockedFeatures: [
      "tree-growth",
      "water-usage",
      "coin-earning",
      "simple-scenarios",
      "savings-account",
      "bank-loans",
      "extreme-weather",
    ],
    learned: [
      "Weather shocks can reduce income or force expenses.",
      "Prepared players survive volatility.",
    ],
    unlockSummary: ["Rain, drought, and storm events"],
  },
  5: {
    id: 5,
    name: "Investment System",
    unlockedFeatures: [
      "tree-growth",
      "water-usage",
      "coin-earning",
      "simple-scenarios",
      "savings-account",
      "bank-loans",
      "extreme-weather",
      "investments",
    ],
    learned: [
      "FD and SIP are long-term growth tools.",
      "Locked money can grow but reduces liquidity.",
    ],
    unlockSummary: ["FD", "SIP", "Investment tools"],
  },
  6: {
    id: 6,
    name: "Risk System",
    unlockedFeatures: [
      "tree-growth",
      "water-usage",
      "coin-earning",
      "simple-scenarios",
      "savings-account",
      "bank-loans",
      "extreme-weather",
      "investments",
      "risk-system",
    ],
    learned: [
      "Risk-reward balance matters more than one lucky day.",
      "Big upside can hide delayed losses.",
    ],
    unlockSummary: ["Risk meter and risk-based strategy"],
  },
  7: {
    id: 7,
    name: "Shop & Assets",
    unlockedFeatures: [
      "tree-growth",
      "water-usage",
      "coin-earning",
      "simple-scenarios",
      "savings-account",
      "bank-loans",
      "extreme-weather",
      "investments",
      "risk-system",
      "shop-assets",
      "inventory",
    ],
    learned: [
      "Depreciating assets may help now but hurt later.",
      "Appreciating assets support compounding growth.",
    ],
    unlockSummary: ["Shop", "Assets", "Inventory", "Activity monitor"],
  },
  8: {
    id: 8,
    name: "Tree Growth Complete",
    unlockedFeatures: [
      "tree-growth",
      "water-usage",
      "coin-earning",
      "simple-scenarios",
      "savings-account",
      "bank-loans",
      "extreme-weather",
      "investments",
      "risk-system",
      "shop-assets",
      "inventory",
      "stock-market",
      "leaderboard",
    ],
    learned: [
      "Your tree is fully grown. Strategy now matters more than growth speed.",
      "Use market signals for smarter capital allocation.",
    ],
    unlockSummary: ["Stock market", "Leaderboard"],
  },
  9: {
    id: 9,
    name: "Management Mode",
    unlockedFeatures: [
      "tree-growth",
      "water-usage",
      "coin-earning",
      "simple-scenarios",
      "savings-account",
      "bank-loans",
      "extreme-weather",
      "investments",
      "risk-system",
      "shop-assets",
      "inventory",
      "stock-market",
      "leaderboard",
      "management-mode",
    ],
    learned: [
      "You can now think like a manager, not just a player.",
      "Long-term goals and stable cash flow become your core strategy.",
    ],
    unlockSummary: ["Management mode", "Business and life goals"],
  },
};

export function getPhaseDefinition(phase: number): PhaseDefinition {
  const normalized = Math.max(1, Math.min(9, Math.floor(phase || 1))) as PhaseId;
  return PHASE_CONFIG[normalized];
}

export function getUnlockedFeatures(phase: number): UnlockFeature[] {
  return getPhaseDefinition(phase).unlockedFeatures;
}

export function isFeatureUnlocked(feature: UnlockFeature, phase: number): boolean {
  return getUnlockedFeatures(phase).includes(feature);
}

export function getNextPhase(snapshot: PhaseProgressSnapshot): PhaseId | null {
  const current = Math.max(1, Math.min(9, snapshot.currentPhase || 1)) as PhaseId;

  if (current === 1 && snapshot.totalWaterings >= 3) return 2;
  if (current === 2 && snapshot.completedScenarios >= 2) return 3;
  if (current === 3 && snapshot.savingsBalance >= 150) return 4;
  if (current === 4 && snapshot.currentDay >= 4) return 5;
  if (current === 5 && snapshot.hasAnyInvestment) return 6;
  if (current === 6 && snapshot.completedScenarios >= 6) return 7;
  if (current === 7 && snapshot.treeStage === "full") return 8;
  if (current === 8 && snapshot.currentDay >= 12) return 9;

  return null;
}

export function buildPhaseUnlockPayload(fromPhase: number, toPhase: PhaseId) {
  const from = getPhaseDefinition(fromPhase);
  const to = getPhaseDefinition(toPhase);

  const unlockedFeatures = to.unlockSummary.filter((item) => !from.unlockSummary.includes(item));

  return {
    fromPhase: from.id,
    toPhase: to.id,
    learned: to.learned,
    unlockedFeatures,
  };
}
