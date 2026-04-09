// Game state management with Zustand

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GameState,
  GameActions,
  DailyLesson,
  DailySummary,
  DailyDecision,
  GeminiReview,
  GeminiChatMessage,
  LeaderboardEntry,
  MarketAsset,
  GameScreen,
  WeatherEvent,
  SuddenEvent,
  EventResolutionLog,
  StormEmergency,
  Event,
  PendingEvent,
} from "@/types/game";
import { GAME_CONFIG, MARKET_ASSETS } from "@/lib/constants";
import {
  calculateTreeYield,
  applyWeatherModifier,
  canWaterTree,
  updateTreeAfterWatering,
  resetTreeForNewDay,
  createInitialPlayer,
  createInitialTree,
  calculateWaterCost,
  applyInflationToCash,
} from "@/lib/gameEngine";
import {
  createInitialSavings,
  applySavingsInterest,
  depositToSavings as depositSavings,
  withdrawFromSavings as withdrawSavings,
  createFixedDeposit as createFD,
  updateFDMaturityStatus,
  withdrawFD,
  createSIP as createNewSIP,
  applySIPGrowth,
  cancelSIP as cancelSIPFn,
  processSIPForDay,
} from "@/lib/bankingLogic";
import {
  updateAssetValues,
  calculateAssetValue,
  purchaseAsset,
  calculateDailyMaintenanceBreakdown,
} from "@/lib/assetCalculator";
import {
  generateDailyEvents,
  resolvePendingEvents,
  getRiskLevel,
  buildPendingEvent,
  isTemptationAccepted,
  pickDailyInflationRate,
} from "@/lib/eventSystem";

const ENABLE_LEGACY_SUDDEN_EVENTS = false;
const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// AI Tips based on player actions
const AI_TIPS = {
  lowMoney: "💡 Tip: Try saving some money in the bank for tomorrow!",
  noWater: "💧 Tip: Buy water from the shop to water your plant!",
  goodSaver: "🌟 Great job saving! Your money will grow with interest!",
  investor: "📈 Smart! Investments grow over time but need patience.",
  wateringDone: "🌙 Great work today! End the day to see what happens next.",
  firstDay: "👋 Welcome! Tap your plant to water it and earn coins!",
  bankTip: "🏦 Bank savings are safe and earn 1% daily interest.",
  investTip: "🌱 Investments grow faster but you can't use them right away.",
  shopTip: "🛒 Assets can boost your earnings! Check the shop.",
  balanced: "⚖️ Great balance of saving and spending! Keep it up!",
  sipTip: "📊 SIPs help you invest regularly - small amounts add up!",
  fdTip: "🔒 FDs lock your money but give great returns when mature.",
};

const SUDDEN_EVENTS: SuddenEvent[] = [
  {
    id: "legacy-budget-choice",
    title: "📦 Budget Choice",
    scenario: "A non-essential purchase appears. Choose discipline or instant reward.",
    options: [
      {
        id: "buy-now",
        label: "Buy now",
        walletDelta: -90,
        quality: "weak",
        treeHealthDelta: -3,
        resultText: "Impulse spending lowered your safety margin.",
      },
      {
        id: "plan-first",
        label: "Plan first and skip",
        walletDelta: 0,
        savingsDelta: 70,
        quality: "strong",
        treeHealthDelta: 3,
        resultText: "Good control protected your long-term progress.",
      },
    ],
  },
];

function pickSuddenEvent(day: number): SuddenEvent {
  const index = (day * 7 + 3) % SUDDEN_EVENTS.length;
  return SUDDEN_EVENTS[index];
}

const LEADERBOARD_NAMES = ["Rahul", "Priya", "Aarav", "Ananya", "Kabir"];

function calculateLevelFromExp(totalEXP: number): number {
  return Math.floor(totalEXP / GAME_CONFIG.LEVEL_EXP_PER_LEVEL) + 1;
}

function createLeaderboard(playerLevel: number, totalEXP: number): LeaderboardEntry[] {
  return LEADERBOARD_NAMES.map((name, index) => {
    const levelShift = (index % 3) - 1;
    const randomScoreNoise = Math.floor(Math.random() * 80);
    const level = Math.max(1, playerLevel + levelShift + (index === 0 ? 1 : 0));
    const score = Math.max(120, totalEXP + level * 90 + randomScoreNoise);
    const trend: LeaderboardEntry["trend"] =
      index % 3 === 0 ? "up" : index % 3 === 1 ? "steady" : "down";

    return {
      id: name.toLowerCase(),
      name,
      level,
      score,
      trend,
    };
  });
}

function appendDailySummaryToLocalStorage(summary: DailySummary) {
  if (typeof window === "undefined") return;
  try {
    const key = GAME_CONFIG.DAILY_SUMMARY_STORAGE_KEY;
    const current = window.localStorage.getItem(key);
    const parsed = current ? (JSON.parse(current) as DailySummary[]) : [];
    window.localStorage.setItem(key, JSON.stringify([...parsed, summary]));
  } catch {
    // Ignore localStorage write errors and keep game playable.
  }
}

function calculateNetWorth(
  state: GameState,
  wallet: number = state.player.wallet,
  savingsBalance: number = state.savings.balance,
  assets = state.ownedAssets,
): number {
  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  return wallet + savingsBalance + totalAssetValue;
}

function getGameOverPatch(
  state: GameState,
  wallet: number,
  savingsBalance: number,
  assets = state.ownedAssets,
): Pick<GameState, "isPlaying" | "isGameOver" | "gameOverReason"> {
  const netWorth = calculateNetWorth(state, wallet, savingsBalance, assets);
  if (netWorth >= 0) {
    return {
      isPlaying: true,
      isGameOver: false,
      gameOverReason: null,
    };
  }

  return {
    isPlaying: false,
    isGameOver: true,
    gameOverReason:
      "Your wallet + savings + assets fell below ₹0. Build an emergency fund and avoid unchecked liabilities.",
  };
}

function settleEmergencyCost(
  wallet: number,
  savingsBalance: number,
  cost: number,
): {
  wallet: number;
  savingsBalance: number;
  fromWallet: number;
  fromSavings: number;
  deficit: number;
} {
  const usableWallet = Math.max(0, wallet);
  const usableSavings = Math.max(0, savingsBalance);
  const fromWallet = Math.min(usableWallet, cost);
  const remainingAfterWallet = cost - fromWallet;
  const fromSavings = Math.min(usableSavings, remainingAfterWallet);
  const deficit = remainingAfterWallet - fromSavings;

  return {
    wallet: wallet - fromWallet - deficit,
    savingsBalance: savingsBalance - fromSavings,
    fromWallet,
    fromSavings,
    deficit,
  };
}

function getAITip(state: GameState): string {
  if (state.player.currentDay === 1 && state.tree.timesWateredToday === 0) {
    return AI_TIPS.firstDay;
  }
  if (state.player.wallet < 20 && state.player.waterUnits === 0) {
    return AI_TIPS.lowMoney;
  }
  if (state.player.waterUnits === 0) {
    return AI_TIPS.noWater;
  }
  if (state.tree.timesWateredToday >= 3) {
    return AI_TIPS.wateringDone;
  }
  if (state.sips.length > 0) {
    return AI_TIPS.sipTip;
  }
  if (state.savings.balance > 100) {
    return AI_TIPS.goodSaver;
  }
  if (state.player.investmentBalance > 100) {
    return AI_TIPS.investor;
  }
  if (state.ownedAssets.length > 0) {
    return AI_TIPS.shopTip;
  }
  return AI_TIPS.balanced;
}

function buildDailySummaryFromState(
  state: GameState,
  inflationRate: number,
  inflationLoss: number,
): DailySummary {
  const decisions = state.dailyDecisionLog.filter(
    (entry) => entry.day === state.player.currentDay,
  );
  const temptationsAccepted = decisions
    .filter((entry) => entry.wasTemptationAccepted)
    .map((entry) => entry.eventTitle);
  const maintenancePaid = state.maintenanceChargesToday.reduce(
    (sum, charge) => sum + charge.cost,
    0,
  );
  const spentFromChoices = decisions.reduce((sum, entry) => {
    const outgoing = Math.max(0, -entry.walletDelta) + Math.max(0, -entry.savingsDelta);
    return sum + outgoing;
  }, 0);

  return {
    id: createId(),
    currentDay: state.player.currentDay,
    decisions,
    treeHealth: state.tree.health,
    walletBalance: state.player.wallet,
    savingsBalance: state.savings.balance,
    bankBalance: state.player.bankBalance,
    investmentBalance: state.player.investmentBalance,
    fixedDeposits: state.fixedDeposits.map((fd) => ({
      id: fd.id,
      principal: fd.principal,
      maturityDay: fd.maturityDay,
      matured: fd.matured,
    })),
    sips: state.sips.map((sip) => ({
      id: sip.id,
      amount: sip.amount,
      intervalDays: sip.intervalDays,
      totalInvested: sip.totalInvested,
      currentValue: sip.currentValue,
      isActive: sip.isActive,
    })),
    assetsOwned: state.ownedAssets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      currentValue: asset.currentValue,
    })),
    inflation: {
      day: state.player.currentDay,
      rate: inflationRate,
      cashPowerLoss: inflationLoss,
    },
    pendingConsequences: state.pendingEvents,
    temptationsAccepted,
    savedToday: state.todayBankSaved + state.todaySavingsDeposited,
    investedToday: state.todayInvested,
    spentToday: spentFromChoices + maintenancePaid + inflationLoss,
    maintenancePaid,
    weather: state.currentWeather,
    riskLevel: state.riskLevel,
  };
}

function createInitialState(): GameState {
  return {
    player: createInitialPlayer(),
    playerLevel: 1,
    totalEXP: 0,
    tree: createInitialTree(),
    savings: createInitialSavings(),
    fixedDeposits: [],
    sips: [],
    ownedAssets: [],
    marketAssets: MARKET_ASSETS as MarketAsset[],
    lessons: [],
    dailySummaries: [],
    dailyDecisionLog: [],
    latestGeminiReview: null,
    reviewChatMessages: [],
    reviewStatus: "idle",
    reviewError: null,
    lastAwardedReviewDay: 0,
    leaderboard: createLeaderboard(1, 0),
    hasPlayed: false,
    currentDay: 1,
    treeHealth: { value: 100 },
    riskMeter: 0,
    riskLevel: "low",
    pendingEvents: [],
    activeDailyEvents: [],
    activeGameEvent: null,
    eventConsequences: [],
    investmentPreviewDays: null,
    timeOfDay: "morning",
    currentScreen: "menu",
    showWaterEffect: false,
    showCoinEffect: false,
    lastCoinAmount: 0,
    currentWeather: "none",
    weatherIntensity: 0,
    currentInflationRate: 0,
    inflationImpactToday: 0,
    activeStormEmergency: null,
    showStormEmergency: false,
    dayStartTotalEarnings: 0,
    todayInvested: 0,
    todayBankSaved: 0,
    todaySavingsDeposited: 0,
    activeSuddenEvent: null,
    showSuddenEvent: false,
    lastSuddenEventDay: 0,
    eventHistory: [],
    latestEventResolution: null,
    maintenanceChargesToday: [],
    showMaintenancePopup: false,
    isGameOver: false,
    gameOverReason: null,
    stormChanceModifier: 0,
    isPlaying: false,
    showEndOfDay: false,
    showLesson: false,
    currentLesson: null,
    aiTip: AI_TIPS.firstDay,
    showBankModal: false,
  };
}

const initialState: GameState = createInitialState();

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      startJourney: () => {
        const state = get();
        if (state.currentScreen === "play") return;

        set({
          currentScreen: "play",
          isPlaying: true,
          hasPlayed: true,
          reviewStatus: "idle",
          reviewError: null,
          latestGeminiReview: null,
          reviewChatMessages: [],
          aiTip: AI_TIPS.firstDay,
        });
        get().refreshLeaderboard();
      },

      buildDailySummary: () => {
        const state = get();
        const lastSummary = state.dailySummaries[state.dailySummaries.length - 1];
        if (lastSummary && lastSummary.currentDay === state.player.currentDay) {
          return lastSummary;
        }

        const inflationRate = pickDailyInflationRate();
        const inflationResult = applyInflationToCash(state.player.wallet, inflationRate);
        const inflationLoss = inflationResult.loss;
        const walletAfterInflation = inflationResult.adjustedWallet;
        const summary = buildDailySummaryFromState(state, inflationRate, inflationLoss);

        set({
          player: {
            ...state.player,
            wallet: walletAfterInflation,
          },
          dailySummaries: [...state.dailySummaries, summary],
          currentInflationRate: inflationRate,
          inflationImpactToday: inflationLoss,
          reviewStatus: "loading",
          reviewError: null,
          latestGeminiReview: null,
          reviewChatMessages: [],
          ...getGameOverPatch(state, walletAfterInflation, state.savings.balance),
        });

        appendDailySummaryToLocalStorage(summary);
        return summary;
      },

      setGeminiReview: (review: GeminiReview) => {
        const state = get();
        const clampedExp = Math.max(0, Math.min(100, Math.floor(review.exp)));
        const shouldAward = state.lastAwardedReviewDay !== review.day;
        const nextTotalEXP = shouldAward ? state.totalEXP + clampedExp : state.totalEXP;
        const nextLevel = calculateLevelFromExp(nextTotalEXP);

        set({
          latestGeminiReview: {
            ...review,
            exp: clampedExp,
          },
          totalEXP: nextTotalEXP,
          playerLevel: nextLevel,
          lastAwardedReviewDay: shouldAward ? review.day : state.lastAwardedReviewDay,
          reviewStatus: "ready",
          reviewError: null,
        });
        get().refreshLeaderboard();
      },

      setReviewStatus: (status, error = null) => {
        set({ reviewStatus: status, reviewError: error });
      },

      addReviewChatMessage: (message: GeminiChatMessage) => {
        const state = get();
        set({ reviewChatMessages: [...state.reviewChatMessages, message] });
      },

      clearReviewChatMessages: () => {
        set({ reviewChatMessages: [] });
      },

      setHasPlayed: (value: boolean) => {
        set({ hasPlayed: value });
      },

      refreshLeaderboard: () => {
        const state = get();
        set({
          leaderboard: createLeaderboard(state.playerLevel, state.totalEXP),
        });
      },

      // Water the tree
      waterTree: () => {
        const state = get();
        if (!state.isPlaying) return;
        if (!canWaterTree(state.tree, state.player.waterUnits)) return;

        const baseEarnings = calculateTreeYield(
          state.tree,
          state.ownedAssets,
          state.player.currentDay,
          state.player.investmentBalance,
          state.riskMeter,
        );
        const earnings = applyWeatherModifier(baseEarnings, state.currentWeather);
        const nextTree = updateTreeAfterWatering(state.tree);
        const nextWallet = state.player.wallet + earnings;

        set({
          tree: nextTree,
          treeHealth: { value: nextTree.health },
          player: {
            ...state.player,
            wallet: nextWallet,
            waterUnits: state.player.waterUnits - 1,
            totalEarnings: state.player.totalEarnings + earnings,
          },
          ...getGameOverPatch(state, nextWallet, state.savings.balance),
          showWaterEffect: true,
          showCoinEffect: true,
          lastCoinAmount: earnings,
          hasPlayed: true,
        });

        // Update AI tip after watering
        const newState = get();
        set({ aiTip: getAITip(newState) });

        // Auto-hide effects
        setTimeout(
          () => set({ showWaterEffect: false, showCoinEffect: false }),
          1500,
        );
      },

      // Buy water
      buyWater: (units: number) => {
        const state = get();
        if (!state.isPlaying) return;
        const cost = calculateWaterCost(units, state.ownedAssets);
        if (state.player.wallet < cost) return;

        const nextWallet = state.player.wallet - cost;

        set({
          player: {
            ...state.player,
            wallet: nextWallet,
            waterUnits: state.player.waterUnits + units,
          },
          ...getGameOverPatch(state, nextWallet, state.savings.balance),
        });
      },

      // Deposit to savings
      depositToSavings: (amount: number) => {
        const state = get();
        if (!state.isPlaying) return;
        if (amount <= 0 || state.player.wallet < amount) return;

        const nextWallet = state.player.wallet - amount;
        const nextSavings = state.savings.balance + amount;

        set({
          savings: depositSavings(state.savings, amount),
          player: {
            ...state.player,
            wallet: nextWallet,
          },
          todaySavingsDeposited: state.todaySavingsDeposited + amount,
          ...getGameOverPatch(state, nextWallet, nextSavings),
        });
      },

      // Withdraw from savings
      withdrawFromSavings: (amount: number) => {
        const state = get();
        if (!state.isPlaying) return;
        const result = withdrawSavings(state.savings, amount);

        const nextWallet = state.player.wallet + result.withdrawn;

        set({
          savings: result.savings,
          player: {
            ...state.player,
            wallet: nextWallet,
          },
          ...getGameOverPatch(state, nextWallet, result.savings.balance),
        });
      },

      // Create fixed deposit
      createFixedDeposit: (
        amount: number,
        durationDays: number = 3,
      ) => {
        const state = get();
        if (!state.isPlaying) return;
        if (amount <= 0 || state.player.wallet < amount) return;

        const fd = createFD(amount, state.player.currentDay, durationDays);
        if (!fd) return;

        set({
          fixedDeposits: [...state.fixedDeposits, fd],
          tree: {
            ...state.tree,
            health: Math.min(100, state.tree.health + 2),
          },
          treeHealth: { value: Math.min(100, state.tree.health + 2) },
          player: {
            ...state.player,
            wallet: state.player.wallet - amount,
          },
          ...getGameOverPatch(
            state,
            state.player.wallet - amount,
            state.savings.balance,
          ),
        });
      },

      // Withdraw fixed deposit
      withdrawFixedDeposit: (fdId: string) => {
        const state = get();
        if (!state.isPlaying) return;
        const fd = state.fixedDeposits.find((f) => f.id === fdId);
        if (!fd) return;

        const result = withdrawFD(fd, state.player.currentDay);

        set({
          fixedDeposits: state.fixedDeposits.filter((f) => f.id !== fdId),
          player: {
            ...state.player,
            wallet: state.player.wallet + result.amount,
          },
          ...getGameOverPatch(
            state,
            state.player.wallet + result.amount,
            state.savings.balance,
          ),
        });
      },

      // Create SIP
      createSIP: (amount: number, intervalDays: number) => {
        const state = get();
        if (!state.isPlaying) return;
        if (amount <= 0 || state.player.wallet < amount) return;

        const sip = createNewSIP(amount, intervalDays, state.player.currentDay);
        if (!sip) return;

        set({
          sips: [...state.sips, sip],
          tree: {
            ...state.tree,
            health: Math.min(100, state.tree.health + 2),
          },
          treeHealth: { value: Math.min(100, state.tree.health + 2) },
          player: {
            ...state.player,
            wallet: state.player.wallet - amount, // First installment
          },
          ...getGameOverPatch(
            state,
            state.player.wallet - amount,
            state.savings.balance,
          ),
        });
      },

      // Cancel SIP
      cancelSIP: (sipId: string) => {
        const state = get();
        if (!state.isPlaying) return;
        const sip = state.sips.find((s) => s.id === sipId);
        if (!sip) return;

        const result = cancelSIPFn(sip);

        set({
          sips: state.sips.filter((s) => s.id !== sipId),
          player: {
            ...state.player,
            wallet: state.player.wallet + result.returnAmount,
          },
          ...getGameOverPatch(
            state,
            state.player.wallet + result.returnAmount,
            state.savings.balance,
          ),
        });
      },

      // Buy asset
      buyAsset: (assetId: string) => {
        const state = get();
        if (!state.isPlaying) return;
        const marketAsset = state.marketAssets.find((a) => a.id === assetId);
        if (!marketAsset) return;
        if (state.player.wallet < marketAsset.currentPrice) return;

        const newAsset = purchaseAsset(marketAsset, state.player.currentDay);

        set({
          ownedAssets: [...state.ownedAssets, newAsset],
          player: {
            ...state.player,
            wallet: state.player.wallet - marketAsset.currentPrice,
          },
          ...getGameOverPatch(
            state,
            state.player.wallet - marketAsset.currentPrice,
            state.savings.balance,
            [...state.ownedAssets, newAsset],
          ),
        });
      },

      // Sell asset
      sellAsset: (assetId: string) => {
        const state = get();
        if (!state.isPlaying) return;
        const asset = state.ownedAssets.find((a) => a.id === assetId);
        if (!asset) return;

        const saleValue = calculateAssetValue(asset, state.player.currentDay);

        set({
          ownedAssets: state.ownedAssets.filter((a) => a.id !== assetId),
          player: {
            ...state.player,
            wallet: state.player.wallet + saleValue,
          },
          ...getGameOverPatch(
            state,
            state.player.wallet + saleValue,
            state.savings.balance,
            state.ownedAssets.filter((a) => a.id !== assetId),
          ),
        });
      },

      // End day
      endDay: () => {
        const state = get();
        if (!state.isPlaying || state.showSuddenEvent) return;
        set({ showEndOfDay: true, currentScreen: "end-day" });
      },

      // Start new day
      startNewDay: () => {
        const preState = get();
        if (!preState.isPlaying) return;

        get().buildDailySummary();
        const state = get();
        const nextDay = state.currentDay + 1;

        // Apply daily changes
        const newSavings = applySavingsInterest(state.savings);
        const newFDs = updateFDMaturityStatus(state.fixedDeposits, nextDay);
        const newAssets = updateAssetValues(state.ownedAssets, nextDay);
        const maintenanceCharges = calculateDailyMaintenanceBreakdown(newAssets, nextDay);
        const maintenanceTotal = maintenanceCharges.reduce((sum, item) => sum + item.cost, 0);
        
        // Apply SIP growth
        const newSips = applySIPGrowth(state.sips, nextDay);
        
        // Investment growth (5% daily)
        const investmentGrowth = Math.floor(state.player.investmentBalance * 0.05);
        
        // Bank interest (1% daily) - applied to wallet when bank balance transfers
        const bankInterest = Math.floor(state.player.bankBalance * 0.01);

        // Calculate new wallet (bank balance + interest transfers to wallet, then maintenance is charged)
        const newWallet =
          state.player.wallet + state.player.bankBalance + bankInterest - maintenanceTotal;

        // Process SIP installments for the new day
        let sipDeductions = 0;
        let updatedSips = newSips;
        for (let i = 0; i < updatedSips.length; i++) {
          const sip = updatedSips[i];
          const result = processSIPForDay(sip, nextDay, newWallet - sipDeductions);
          if (result.invested) {
            updatedSips = updatedSips.map((s) => s.id === sip.id ? result.sip : s);
            sipDeductions += result.amountDeducted;
          }
        }

        const walletAfterSIP = newWallet - sipDeductions;
        const gameOverPatch = getGameOverPatch(
          state,
          walletAfterSIP,
          newSavings.balance,
          newAssets,
        );
        const shouldTriggerSuddenEvent =
          ENABLE_LEGACY_SUDDEN_EVENTS && nextDay >= 4 && !gameOverPatch.isGameOver;
        const suddenEvent = shouldTriggerSuddenEvent ? pickSuddenEvent(nextDay) : null;
        const pendingResolution = resolvePendingEvents(nextDay, state.pendingEvents);
        const rolledEvents = generateDailyEvents({
          currentDay: nextDay,
          riskMeter: state.riskMeter,
          savings: newSavings,
        });
        const dailyEvents: Event[] = [...pendingResolution.dueEvents, ...rolledEvents].slice(
          0,
          GAME_CONFIG.MAX_EVENTS_PER_DAY,
        );
        const nextTree = resetTreeForNewDay(state.tree);
        const nextRiskMeter = Math.max(0, state.riskMeter - 3);

        set({
          tree: nextTree,
          treeHealth: { value: nextTree.health },
          savings: newSavings,
          fixedDeposits: newFDs,
          sips: updatedSips,
          ownedAssets: newAssets,
          player: {
            ...state.player,
            currentDay: nextDay,
            wallet: walletAfterSIP,
            bankBalance: 0,
            investmentBalance: state.player.investmentBalance + investmentGrowth,
            waterUnits: state.player.waterUnits,
          },
          currentDay: nextDay,
          riskMeter: nextRiskMeter,
          riskLevel: getRiskLevel(nextRiskMeter),
          pendingEvents: pendingResolution.remaining,
          activeDailyEvents: dailyEvents,
          activeGameEvent: dailyEvents[0] || null,
          showEndOfDay: false,
          showLesson: false,
          currentLesson: null,
          currentScreen: "play",
          timeOfDay: "morning",
          dayStartTotalEarnings: state.player.totalEarnings,
          todayInvested: 0,
          todayBankSaved: 0,
          todaySavingsDeposited: 0,
          dailyDecisionLog: [],
          currentWeather: "none",
          weatherIntensity: 0,
          activeStormEmergency: null,
          showStormEmergency: false,
          maintenanceChargesToday: maintenanceCharges,
          showMaintenancePopup: maintenanceCharges.length > 0,
          activeSuddenEvent: suddenEvent,
          showSuddenEvent: suddenEvent !== null,
          lastSuddenEventDay: suddenEvent ? nextDay : state.lastSuddenEventDay,
          latestEventResolution: null,
          investmentPreviewDays: null,
          reviewStatus: "idle",
          reviewError: null,
          reviewChatMessages: [],
          hasPlayed: true,
          ...gameOverPatch,
        });

        // Update AI tip
        const newState = get();
        set({ aiTip: getAITip(newState) });
        get().refreshLeaderboard();
      },

      advanceDay: () => {
        const state = get();
        if (!state.isPlaying) return;
        if (state.showSuddenEvent || state.activeGameEvent) return;
        get().startNewDay();
      },

      handleEventChoice: (choiceId: string) => {
        const state = get();
        const activeEvent = state.activeGameEvent;
        if (!activeEvent) return;

        const choice = activeEvent.choices.find((item) => item.id === choiceId);
        if (!choice) return;

        const consequence = choice.consequence;
        const nextWallet = state.player.wallet + (consequence.walletDelta || 0);
        const nextSavings = Math.max(0, state.savings.balance + (consequence.savingsDelta || 0));
        const nextInvestment = Math.max(
          0,
          state.player.investmentBalance + (consequence.investmentDelta || 0),
        );
        const nextTreeHealth = Math.max(
          0,
          Math.min(100, state.tree.health + (consequence.treeHealthDelta || 0)),
        );
        const nextRisk = Math.max(0, Math.min(100, state.riskMeter + (consequence.riskDelta || 0)));
        const nextPending: PendingEvent[] = [...state.pendingEvents];
        const wasTemptationAccepted = isTemptationAccepted(activeEvent, choiceId);

        if (consequence.scheduleEventId && consequence.scheduleAfterDays) {
          nextPending.push(
            buildPendingEvent(
              consequence.scheduleEventId,
              state.currentDay + consequence.scheduleAfterDays,
              `Triggered by ${activeEvent.title}`,
            ),
          );
        }

        const remainingEvents = state.activeDailyEvents.filter((event) => event.id !== activeEvent.id);
        const summary = `${choice.icon} ${choice.label}`;
        const decision: DailyDecision = {
          id: createId(),
          day: state.currentDay,
          eventId: activeEvent.id,
          eventTitle: activeEvent.title,
          choiceId: choice.id,
          choiceLabel: choice.label,
          walletDelta: consequence.walletDelta || 0,
          savingsDelta: consequence.savingsDelta || 0,
          investmentDelta: consequence.investmentDelta || 0,
          treeHealthDelta: consequence.treeHealthDelta || 0,
          riskDelta: consequence.riskDelta || 0,
          consequenceSummary: summary,
          wasTemptationAccepted,
        };

        set({
          player: {
            ...state.player,
            wallet: nextWallet,
            investmentBalance: nextInvestment,
            waterUnits: state.player.waterUnits + (consequence.rewardWater || 0),
          },
          savings: {
            ...state.savings,
            balance: nextSavings,
          },
          tree: {
            ...state.tree,
            health: nextTreeHealth,
          },
          treeHealth: { value: nextTreeHealth },
          riskMeter: nextRisk,
          riskLevel: getRiskLevel(nextRisk),
          pendingEvents: nextPending,
          activeDailyEvents: remainingEvents,
          activeGameEvent: remainingEvents[0] || null,
          dailyDecisionLog: [...state.dailyDecisionLog, decision],
          eventConsequences: [
            ...state.eventConsequences,
            { id: createId(), icon: activeEvent.icon, title: activeEvent.title, summary },
          ].slice(-8),
          hasPlayed: true,
          ...getGameOverPatch(state, nextWallet, nextSavings),
        });
      },

      applyInvestmentPreview: (days: number | null) => {
        set({ investmentPreviewDays: days });
      },

      // Screen navigation
      setScreen: (screen: GameScreen) => {
        set({ currentScreen: screen });
      },

      // Toggle bank modal (for anytime access)
      toggleBankModal: () => {
        const state = get();
        set({ showBankModal: !state.showBankModal });
      },

      // Save to bank (end of day)
      saveToBank: (amount: number) => {
        const state = get();
        if (!state.isPlaying) return;
        if (amount <= 0 || state.player.wallet < amount) return;

        const nextWallet = state.player.wallet - amount;

        set({
          player: {
            ...state.player,
            wallet: nextWallet,
            bankBalance: state.player.bankBalance + amount,
          },
          todayBankSaved: state.todayBankSaved + amount,
          ...getGameOverPatch(state, nextWallet, state.savings.balance),
        });
      },

      // Invest money (end of day)
      investMoney: (amount: number) => {
        const state = get();
        if (!state.isPlaying) return;
        if (amount <= 0 || state.player.wallet < amount) return;

        const nextWallet = state.player.wallet - amount;

        set({
          player: {
            ...state.player,
            wallet: nextWallet,
            investmentBalance: state.player.investmentBalance + amount,
          },
          todayInvested: state.todayInvested + amount,
          ...getGameOverPatch(state, nextWallet, state.savings.balance),
        });
      },

      // Visual effects
      triggerWaterEffect: () => {
        set({ showWaterEffect: true });
        setTimeout(() => set({ showWaterEffect: false }), 1500);
      },

      triggerCoinEffect: (amount: number) => {
        set({ showCoinEffect: true, lastCoinAmount: amount });
        setTimeout(() => set({ showCoinEffect: false }), 1500);
      },

      setAITip: (tip: string | null) => {
        set({ aiTip: tip });
      },

      // Dismiss lesson
      dismissLesson: () => {
        set({
          showLesson: false,
          currentLesson: null,
        });
      },

      dismissMaintenancePopup: () => {
        set({ showMaintenancePopup: false });
      },

      dismissStormEmergency: () => {
        set({ showStormEmergency: false });
      },

      resolveSuddenEvent: (optionId: string) => {
        const state = get();
        if (!state.activeSuddenEvent || !state.showSuddenEvent) return;

        const option = state.activeSuddenEvent.options.find((item) => item.id === optionId);
        if (!option) return;

        const nextWallet = state.player.wallet + option.walletDelta;
        const nextSavingsBalance = Math.max(0, state.savings.balance + (option.savingsDelta || 0));
        const nextTreeHealth = Math.max(
          0,
          Math.min(100, state.tree.health + (option.treeHealthDelta || 0)),
        );
        const nextInvestment = Math.max(
          0,
          state.player.investmentBalance + (option.investmentDelta || 0),
        );

        const resolution: EventResolutionLog = {
          day: state.player.currentDay,
          eventTitle: state.activeSuddenEvent.title,
          optionLabel: option.label,
          quality: option.quality,
          resultText: option.resultText,
        };

        set({
          player: {
            ...state.player,
            wallet: nextWallet,
            investmentBalance: nextInvestment,
          },
          savings: {
            ...state.savings,
            balance: nextSavingsBalance,
          },
          tree: {
            ...state.tree,
            health: nextTreeHealth,
          },
          activeSuddenEvent: null,
          showSuddenEvent: false,
          latestEventResolution: resolution,
          eventHistory: [...state.eventHistory, resolution],
          ...getGameOverPatch(state, nextWallet, nextSavingsBalance),
        });
      },

      // Reset game
      resetGame: () => {
        if (typeof window !== "undefined") {
          const keys = Object.keys(window.localStorage);
          for (const key of keys) {
            if (key.toLowerCase().includes("growtopia")) {
              window.localStorage.removeItem(key);
            }
          }
        }

        useGameStore.persist.clearStorage();
        set(createInitialState());
      },

      // Load game (called on mount)
      loadGame: () => {
        // Persistence is handled by zustand/persist middleware
        // This is here for manual reload if needed
      },

      // Trigger weather event
      triggerWeatherEvent: (event: WeatherEvent) => {
        const state = get();

        if (event !== "storm") {
          set({
            currentWeather: event,
            weatherIntensity: event === "none" ? 0 : 100,
            activeStormEmergency: null,
            showStormEmergency: false,
          });
          return;
        }

        const emergencyScenarios: Array<{ title: string; description: string; cost: number }> = [
          {
            title: "🚑 Medical Emergency",
            description:
              "A family medical issue needs immediate payment. Emergency funds are tested in real life exactly like this.",
            cost: 260,
          },
          {
            title: "🛠️ Essential Service Repair",
            description:
              "Urgent home service repair was needed today. Sudden bills can break weak budgets.",
            cost: 220,
          },
          {
            title: "⚠️ Safety Repair Expense",
            description:
              "A safety-related repair had to be paid now. Delaying could cause bigger losses.",
            cost: 320,
          },
        ];

        const scenarioIndex = state.player.currentDay % emergencyScenarios.length;
        const scenario = emergencyScenarios[scenarioIndex];
        const settlement = settleEmergencyCost(
          state.player.wallet,
          state.savings.balance,
          scenario.cost,
        );

        const emergency: StormEmergency = {
          title: scenario.title,
          description: scenario.description,
          cost: scenario.cost,
          fromWallet: settlement.fromWallet,
          fromSavings: settlement.fromSavings,
          deficit: settlement.deficit,
        };

        set({
          currentWeather: event,
          weatherIntensity: 100,
          activeStormEmergency: emergency,
          showStormEmergency: true,
          player: {
            ...state.player,
            wallet: settlement.wallet,
          },
          savings: {
            ...state.savings,
            balance: settlement.savingsBalance,
          },
          ...getGameOverPatch(state, settlement.wallet, settlement.savingsBalance),
        });
      },

      // Clear weather event
      clearWeatherEvent: () => {
        set({
          currentWeather: "none",
          weatherIntensity: 0,
          activeStormEmergency: null,
          showStormEmergency: false,
        });
      },

      // Pay weather event charge to end weather early
      payWeatherCharge: () => {
        const state = get();
        if (state.currentWeather === "none") return;
        if (state.currentWeather !== "rain") return;

        const weatherChargeMap: Record<WeatherEvent, number> = {
          rain: GAME_CONFIG.WEATHER_RAIN_CLEAR_COST,
          drought: GAME_CONFIG.WEATHER_DROUGHT_CLEAR_COST,
          storm: GAME_CONFIG.WEATHER_STORM_CLEAR_COST,
          none: 0,
        };

        const charge = weatherChargeMap[state.currentWeather];
        const newWallet = state.player.wallet - charge;

        const lesson: DailyLesson = {
          day: state.player.currentDay,
          title: `Weather cleared for ₹${charge}`,
          content: `You paid ₹${charge} to clear rain early. Keep enough cash and savings so small shocks don't affect your progress.`,
          tip: `Use savings and emergency planning before spending on non-essentials.`,
          basedOn: ["weather_event"],
        };

        set({
          player: {
            ...state.player,
            wallet: newWallet,
          },
          currentWeather: "none",
          weatherIntensity: 0,
          activeStormEmergency: null,
          showStormEmergency: false,
          lessons: [...state.lessons, lesson],
          showLesson: false,
          currentLesson: null,
          ...getGameOverPatch(state, newWallet, state.savings.balance),
        });
      },
    }),
    {
      name: "growtopia-game-storage",
    },
  ),
);
