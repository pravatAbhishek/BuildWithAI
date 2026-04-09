import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ActiveEffect,
  DailyDecision,
  DailySummary,
  EmergencyLoan,
  GameActions,
  GameScreen,
  GameState,
  GeminiChatMessage,
  GeminiReview,
  LeaderboardEntry,
  MarketAsset,
  PendingEvent,
  RiskLevel,
  SimpleEvent,
  StormEmergency,
  UnlockFeature,
  WeatherEvent,
} from "@/types/game";
import { GAME_CONFIG, MARKET_ASSETS, SIMPLE_EVENTS, STOCK_ITEMS } from "@/lib/constants";
import {
  applyInflationToCash,
  applyWeatherModifier,
  calculateTreeYield,
  calculateWaterCost,
  canWaterTree,
  createInitialPlayer,
  createInitialTree,
  resetTreeForNewDay,
  updateTreeAfterWatering,
} from "@/lib/gameEngine";
import {
  applySIPGrowth,
  applySavingsInterest,
  cancelSIP as cancelSIPFn,
  createFixedDeposit as createFD,
  createInitialSavings,
  createSIP as createNewSIP,
  depositToSavings as depositSavings,
  processSIPForDay,
  updateFDMaturityStatus,
  withdrawFD,
  withdrawFromSavings as withdrawSavings,
} from "@/lib/bankingLogic";
import {
  calculateAssetValue,
  calculateDailyMaintenanceBreakdown,
  purchaseAsset,
  updateAssetValues,
} from "@/lib/assetCalculator";
import {
  getSimpleEventForDay,
  queueEventConsequences,
  resolvePendingConsequences,
} from "@/lib/simpleEventSystem";
import {
  buildPhaseUnlockPayload,
  getNextPhase,
  isFeatureUnlocked,
  type PhaseProgressSnapshot,
} from "@/lib/phaseSystem";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const AI_TIPS = {
  firstDay: "👋 Welcome! Water your tree, handle one event, bank smartly, and review at night.",
  lowMoney: "🧯 Keep some emergency cash. Delays and repairs can hurt later.",
  healthy: "🌱 Strong day. Balance spending with savings and long-term investing.",
};

const LEADERBOARD_NAMES = ["Rahul", "Priya", "Aarav", "Ananya", "Kabir"];

function calculateLevelFromExp(totalEXP: number): number {
  return Math.floor(totalEXP / GAME_CONFIG.LEVEL_EXP_PER_LEVEL) + 1;
}

function createLeaderboard(playerLevel: number, totalEXP: number): LeaderboardEntry[] {
  return LEADERBOARD_NAMES.map((name, index) => {
    const level = Math.max(1, playerLevel + ((index % 3) - 1));
    const score = Math.max(80, totalEXP + level * 110 + Math.floor(Math.random() * 45));
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
    // Ignore localStorage write failures to keep gameplay responsive.
  }
}

function calculateNetWorth(
  state: GameState,
  wallet: number = state.player.wallet,
  savingsBalance: number = state.savings.balance,
  fixedDeposits = state.fixedDeposits,
  sips = state.sips,
  assets = state.ownedAssets,
): number {
  const fdValue = fixedDeposits.reduce((sum, fd) => {
    if (fd.matured || state.currentDay >= fd.maturityDay) {
      return sum + Math.floor(fd.principal * (1 + fd.interestRate));
    }
    return sum + fd.principal;
  }, 0);
  const sipValue = sips.reduce((sum, sip) => sum + sip.currentValue, 0);
  const assetValue = assets.reduce((sum, asset) => sum + calculateAssetValue(asset, state.currentDay), 0);

  return wallet + savingsBalance + fdValue + sipValue + assetValue;
}

function getGameOverPatch(
  state: GameState,
  wallet: number,
  savingsBalance: number,
  fixedDeposits = state.fixedDeposits,
  sips = state.sips,
  assets = state.ownedAssets,
): Pick<GameState, "isPlaying" | "isGameOver" | "gameOverReason"> {
  const netWorth = calculateNetWorth(state, wallet, savingsBalance, fixedDeposits, sips, assets);
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
    gameOverReason: "You went bankrupt! Money management is tough, but you can try again.",
  };
}

function toLegacyWeatherIntensity(event: WeatherEvent): number {
  return event === "none" ? 0 : 100;
}

function createLegacyStormEmergency(): StormEmergency {
  return {
    title: "⛈️ Storm Emergency",
    description: "Storm caused emergency spending and temporary health stress for your tree.",
    cost: GAME_CONFIG.WEATHER_STORM_EMERGENCY_LOSS,
    fromWallet: GAME_CONFIG.WEATHER_STORM_EMERGENCY_LOSS,
    fromSavings: 0,
    deficit: 0,
  };
}

function getRiskLevel(riskMeter: number): RiskLevel {
  if (riskMeter >= 70) return "high";
  if (riskMeter >= 35) return "medium";
  return "low";
}

function buildPhaseSnapshot(state: GameState, currentPhase: number): PhaseProgressSnapshot {
  return {
    currentPhase,
    currentDay: state.currentDay,
    totalWaterings: state.tree.totalWaterings,
    completedScenarios: state.completedScenarios,
    savingsBalance: state.savings.balance,
    hasAnyInvestment: state.fixedDeposits.length > 0 || state.sips.length > 0,
    treeStage: state.tree.stage,
  };
}

function getPhaseProgressPatch(state: GameState): Partial<GameState> {
  if (state.phaseUnlockModal) {
    return {};
  }

  const nextPhase = getNextPhase(buildPhaseSnapshot(state, state.currentPhase));
  if (!nextPhase) {
    return {};
  }

  return {
    currentPhase: nextPhase,
    phaseUnlockModal: buildPhaseUnlockPayload(state.currentPhase, nextPhase),
  };
}

function getLoanOutstanding(
  loan: EmergencyLoan | null,
  currentDay: number,
): { outstandingAmount: number; daysOutstanding: number } {
  if (!loan) {
    return { outstandingAmount: 0, daysOutstanding: 0 };
  }

  const daysOutstanding = Math.max(0, currentDay - loan.startDay);
  const gross = Math.floor(loan.principal * (1 + loan.dailyInterestRate * daysOutstanding));
  const outstandingAmount = Math.max(0, gross - loan.totalPaid);

  return { outstandingAmount, daysOutstanding };
}

function buildActiveEffects(state: GameState): ActiveEffect[] {
  const effects: ActiveEffect[] = [];

  if (state.currentWeather === "drought") {
    effects.push({
      id: "weather-drought",
      source: "Drought",
      type: "debuff",
      impactText: "Watering earnings reduced by 60%.",
      remainingDays: 1,
      percentImpact: -60,
    });
  }

  if (state.currentWeather === "storm") {
    effects.push({
      id: "weather-storm",
      source: "Storm",
      type: "debuff",
      impactText: `Emergency loss of ₹${GAME_CONFIG.WEATHER_STORM_EMERGENCY_LOSS} and tree stress.`,
      remainingDays: Math.max(0, state.stormPenaltyDaysRemaining),
    });
  }

  if (state.currentWeather === "rain") {
    effects.push({
      id: "weather-rain",
      source: "Rain",
      type: "neutral",
      impactText: "Rain day has no earnings bonus or penalty.",
      remainingDays: 1,
      percentImpact: 0,
    });
  }

  if (state.emergencyLoan) {
    const loan = getLoanOutstanding(state.emergencyLoan, state.currentDay);
    effects.push({
      id: "loan-active",
      source: "Emergency Loan",
      type: "debuff",
      impactText: `Outstanding ₹${loan.outstandingAmount} at ${Math.round(
        state.emergencyLoan.dailyInterestRate * 100,
      )}% daily interest.`,
      remainingDays: null,
    });
  }

  for (const asset of state.ownedAssets) {
    if (asset.type === "appreciating") {
      const boost = Math.round((asset.appreciationRate || 0) * 100);
      effects.push({
        id: `asset-${asset.id}`,
        source: asset.name,
        type: boost > 0 ? "buff" : "neutral",
        impactText: `Long-term earning support around +${boost}%.`,
        remainingDays: null,
        percentImpact: boost,
      });
      continue;
    }

    const maintenanceInterval =
      asset.maintenanceInterval || GAME_CONFIG.DEPRECIATING_MAINTENANCE_INTERVAL_DAYS;
    const daysOwned = Math.max(0, state.currentDay - asset.purchaseDay);
    const cycles = Math.floor(daysOwned / Math.max(1, maintenanceInterval));
    const baseBoostPercent = Math.round(((asset.boostMultiplier || 1) - 1) * 100);
    const adjustedPercent =
      baseBoostPercent - cycles * GAME_CONFIG.DEPRECIATING_EFFECT_DECAY_PERCENT;

    effects.push({
      id: `asset-${asset.id}`,
      source: asset.name,
      type: adjustedPercent > 0 ? "buff" : "debuff",
      impactText:
        adjustedPercent > 0
          ? `Current earning boost: +${adjustedPercent}%`
          : `Current earning drag: ${adjustedPercent}%`,
      remainingDays: maintenanceInterval - (daysOwned % Math.max(1, maintenanceInterval)),
      percentImpact: adjustedPercent,
    });
  }

  return effects.slice(0, 12);
}

const EVENT_MIN_PHASE: Record<string, number> = {
  "bike-offer": 7,
  "scooter-offer": 7,
  "festival-gift-offer": 2,
  "delay-bill-offer": 2,
  "emergency-friend-help": 4,
  "quick-fd-bonus": 5,
  "appreciating-asset-discount": 7,
  "car-offer": 7,
};

function getEventForPhase(day: number, phase: number): SimpleEvent | null {
  if (!isFeatureUnlocked("simple-scenarios", phase)) {
    return null;
  }

  for (let offset = 0; offset < SIMPLE_EVENTS.length; offset += 1) {
    const candidate = getSimpleEventForDay(day + offset);
    const minPhase = EVENT_MIN_PHASE[candidate.id] || 2;
    if (phase >= minPhase) {
      return candidate;
    }
  }

  return null;
}

function buildDailySummaryFromState(
  state: GameState,
  inflationLoss: number,
  walletAfterInflation: number,
): DailySummary {
  const decisions = state.dailyDecisionLog.filter((entry) => entry.day === state.player.currentDay);
  const temptationsAccepted = decisions
    .filter((entry) => entry.wasTemptationAccepted)
    .map((entry) => entry.eventTitle);

  const spentFromChoices = decisions.reduce((sum, entry) => {
    const outgoing = Math.max(0, -entry.walletDelta) + Math.max(0, -entry.savingsDelta);
    return sum + outgoing;
  }, 0);

  const loan = getLoanOutstanding(state.emergencyLoan, state.player.currentDay);
  const maintenancePaid = state.maintenanceChargesToday.reduce((sum, item) => sum + item.cost, 0);
  const eventCashFlow = decisions.reduce(
    (sum, entry) => sum + entry.walletDelta + entry.savingsDelta + entry.investmentDelta,
    0,
  );
  const savedToday = state.todayBankSaved + state.todaySavingsDeposited;
  const investedToday = state.todayInvested;
  const earningsToday = Math.max(0, state.player.totalEarnings - state.dayStartTotalEarnings);
  const netCashFlow =
    earningsToday +
    eventCashFlow +
    state.loanTakenToday -
    (state.loanRepaidToday +
      state.loanInterestPaidToday +
      state.weatherLossToday +
      maintenancePaid +
      inflationLoss +
      savedToday +
      investedToday);
  const netWorth = calculateNetWorth(
    state,
    walletAfterInflation,
    state.savings.balance,
    state.fixedDeposits,
    state.sips,
    state.ownedAssets,
  );

  return {
    id: createId(),
    currentDay: state.player.currentDay,
    currentPhase: state.currentPhase,
    decisions,
    treeHealth: state.tree.health,
    walletBalance: walletAfterInflation,
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
      rate: GAME_CONFIG.DAILY_CASH_INFLATION_RATE,
      cashPowerLoss: inflationLoss,
    },
    pendingConsequences: state.pendingEvents,
    temptationsAccepted,
    savedToday,
    investedToday,
    spentToday:
      spentFromChoices +
      inflationLoss +
      maintenancePaid +
      state.weatherLossToday +
      state.loanInterestPaidToday +
      state.loanRepaidToday,
    maintenancePaid,
    weather: state.currentWeather,
    riskLevel: state.riskLevel,
    netWorth,
    activeEffects: buildActiveEffects(state),
    loanSnapshot: {
      loanTakenToday: state.loanTakenToday,
      loanRepaidToday: state.loanRepaidToday,
      loanInterestPaidToday: state.loanInterestPaidToday,
      hasActiveLoan: Boolean(state.emergencyLoan),
      principal: state.emergencyLoan?.principal || 0,
      daysOutstanding: loan.daysOutstanding,
      outstandingAmount: loan.outstandingAmount,
    },
    financialBreakdown: {
      earningsToday,
      weatherLossToday: state.weatherLossToday,
      maintenancePaidToday: maintenancePaid,
      inflationLossToday: inflationLoss,
      eventCashFlow,
      savedToday,
      investedToday,
      loanTakenToday: state.loanTakenToday,
      loanRepaidToday: state.loanRepaidToday,
      loanInterestPaidToday: state.loanInterestPaidToday,
      netCashFlow,
    },
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
    aiReviewEnabled: false,
    lastAwardedReviewDay: 0,
    leaderboard: createLeaderboard(1, 0),
    hasPlayed: false,
    currentDay: 1,
    treeHealth: { value: 100 },
    riskMeter: 0,
    riskLevel: "low",
    currentPhase: 1,
    completedScenarios: 0,
    phaseUnlockModal: null,
    emergencyLoan: null,
    loanTakenToday: 0,
    loanRepaidToday: 0,
    loanInterestPaidToday: 0,
    weatherLossToday: 0,
    pendingEvents: [],
    currentSimpleEvent: null,
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
    stockItems: STOCK_ITEMS,
    stockUnlocked: false,
    stormPenaltyDaysRemaining: 0,
    stormChanceModifier: 0,
    isPlaying: false,
    showEndOfDay: false,
    showLesson: false,
    currentLesson: null,
    aiTip: AI_TIPS.firstDay,
    showBankModal: false,
  };
}

const initialState = createInitialState();

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => {
      const syncProgression = () => {
        const state = get();
        const patch = getPhaseProgressPatch(state);
        if (Object.keys(patch).length > 0) {
          set(patch);
        }
      };

      return {
        ...initialState,

      startJourney: () => {
        const state = get();
        if (state.currentScreen === "play") return;

        set({
          currentScreen: "play",
          isPlaying: true,
          hasPlayed: true,
          currentSimpleEvent: getEventForPhase(state.currentDay, state.currentPhase),
          reviewStatus: "idle",
          reviewError: null,
          aiReviewEnabled: false,
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

        const inflationResult = applyInflationToCash(
          state.player.wallet,
          GAME_CONFIG.DAILY_CASH_INFLATION_RATE,
        );
        const summary = buildDailySummaryFromState(
          state,
          inflationResult.loss,
          inflationResult.adjustedWallet,
        );

        set({
          player: {
            ...state.player,
            wallet: inflationResult.adjustedWallet,
          },
          dailySummaries: [...state.dailySummaries, summary],
          currentInflationRate: GAME_CONFIG.DAILY_CASH_INFLATION_RATE,
          inflationImpactToday: inflationResult.loss,
          ...getGameOverPatch(
            state,
            inflationResult.adjustedWallet,
            state.savings.balance,
            state.fixedDeposits,
            state.sips,
            state.ownedAssets,
          ),
        });

        appendDailySummaryToLocalStorage(summary);
        return summary;
      },

      setGeminiReview: (review: GeminiReview) => {
        const clampedExtra = Math.max(0, Math.min(GAME_CONFIG.REVIEW_MAX_EXTRA_EXP, Math.floor(review.exp)));
        set({
          latestGeminiReview: {
            ...review,
            exp: clampedExtra,
          },
          reviewStatus: "ready",
          reviewError: null,
        });
      },

      setReviewStatus: (status, error = null) => {
        set({ reviewStatus: status, reviewError: error });
      },

      setAiReviewEnabled: (enabled: boolean) => {
        set({ aiReviewEnabled: enabled });
      },

      isFeatureUnlocked: (feature: UnlockFeature) => {
        const state = get();
        return isFeatureUnlocked(feature, state.currentPhase);
      },

      dismissPhaseUnlockModal: () => {
        set({ phaseUnlockModal: null });
        syncProgression();
      },

      awardNightExp: (extraExp: number, day: number) => {
        const state = get();
        if (state.lastAwardedReviewDay === day) return;

        const clampedExtra = Math.max(0, Math.min(GAME_CONFIG.REVIEW_MAX_EXTRA_EXP, Math.floor(extraExp)));
        const gained = GAME_CONFIG.REVIEW_BASE_EXP + clampedExtra;
        const nextTotalEXP = state.totalEXP + gained;
        const nextLevel = calculateLevelFromExp(nextTotalEXP);

        set({
          totalEXP: nextTotalEXP,
          playerLevel: nextLevel,
          stockUnlocked:
            nextLevel >= GAME_CONFIG.STOCK_UNLOCK_LEVEL &&
            isFeatureUnlocked("stock-market", state.currentPhase),
          lastAwardedReviewDay: day,
        });
        get().refreshLeaderboard();
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
        set({ leaderboard: createLeaderboard(state.playerLevel, state.totalEXP) });
      },

      waterTree: () => {
        const state = get();
        if (!state.isPlaying) return;
        if (!isFeatureUnlocked("water-usage", state.currentPhase)) return;
        if (!canWaterTree(state.tree, state.player.waterUnits)) return;

        const baseEarnings = calculateTreeYield(
          state.tree,
          state.ownedAssets,
          state.player.currentDay,
          state.player.investmentBalance,
          state.riskMeter,
        );
        const earnings = applyWeatherModifier(baseEarnings, state.currentWeather);
        const weatherLoss = Math.max(0, baseEarnings - earnings);
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
          showWaterEffect: true,
          showCoinEffect: true,
          lastCoinAmount: earnings,
          weatherLossToday: state.weatherLossToday + weatherLoss,
          aiTip: nextWallet < 80 ? AI_TIPS.lowMoney : AI_TIPS.healthy,
          ...getGameOverPatch(
            state,
            nextWallet,
            state.savings.balance,
            state.fixedDeposits,
            state.sips,
            state.ownedAssets,
          ),
        });

        setTimeout(() => set({ showWaterEffect: false, showCoinEffect: false }), 1200);
      },

      buyWater: (units: number) => {
        const state = get();
        if (!state.isPlaying) return;
        if (!isFeatureUnlocked("water-usage", state.currentPhase)) return;
        const cost = calculateWaterCost(units, state.ownedAssets);
        if (state.player.wallet < cost) return;

        const nextWallet = state.player.wallet - cost;
        set({
          player: {
            ...state.player,
            wallet: nextWallet,
            waterUnits: state.player.waterUnits + units,
          },
          ...getGameOverPatch(
            state,
            nextWallet,
            state.savings.balance,
            state.fixedDeposits,
            state.sips,
            state.ownedAssets,
          ),
        });
      },

      triggerWeatherEvent: (event: WeatherEvent) => {
        const state = get();
        if (!isFeatureUnlocked("extreme-weather", state.currentPhase)) {
          set({ currentWeather: "none", weatherIntensity: 0, weatherLossToday: 0 });
          return;
        }

        if (event === "storm") {
          const nextWallet = state.player.wallet - GAME_CONFIG.WEATHER_STORM_EMERGENCY_LOSS;
          const nextTreeHealth = Math.max(
            0,
            state.tree.health - GAME_CONFIG.WEATHER_STORM_TREE_HEALTH_LOSS,
          );

          set({
            currentWeather: "storm",
            weatherIntensity: toLegacyWeatherIntensity("storm"),
            activeStormEmergency: createLegacyStormEmergency(),
            showStormEmergency: true,
            stormPenaltyDaysRemaining: Math.max(0, GAME_CONFIG.WEATHER_STORM_TREE_HEALTH_DAYS - 1),
            weatherLossToday: state.weatherLossToday + GAME_CONFIG.WEATHER_STORM_EMERGENCY_LOSS,
            player: {
              ...state.player,
              wallet: nextWallet,
            },
            tree: {
              ...state.tree,
              health: nextTreeHealth,
            },
            treeHealth: { value: nextTreeHealth },
            ...getGameOverPatch(
              state,
              nextWallet,
              state.savings.balance,
              state.fixedDeposits,
              state.sips,
              state.ownedAssets,
            ),
          });
          return;
        }

        set({
          currentWeather: event,
          weatherIntensity: toLegacyWeatherIntensity(event),
          activeStormEmergency: null,
          showStormEmergency: false,
        });
      },

      clearWeatherEvent: () => {
        set({
          currentWeather: "none",
          weatherIntensity: 0,
          activeStormEmergency: null,
          showStormEmergency: false,
        });
      },

      payWeatherCharge: () => {
        // Rain has no charge in final rules. Keep as no-op clear for compatibility.
        const state = get();
        if (state.currentWeather === "rain") {
          get().clearWeatherEvent();
        }
      },

      depositToSavings: (amount: number) => {
        const state = get();
        if (!state.isPlaying) return;
        if (!isFeatureUnlocked("savings-account", state.currentPhase)) return;
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
          ...getGameOverPatch(
            state,
            nextWallet,
            nextSavings,
            state.fixedDeposits,
            state.sips,
            state.ownedAssets,
          ),
        });
      },

      withdrawFromSavings: (amount: number) => {
        const state = get();
        if (!state.isPlaying) return;
        if (!isFeatureUnlocked("savings-account", state.currentPhase)) return;
        const result = withdrawSavings(state.savings, amount);
        const nextWallet = state.player.wallet + result.withdrawn;

        set({
          savings: result.savings,
          player: {
            ...state.player,
            wallet: nextWallet,
          },
          ...getGameOverPatch(
            state,
            nextWallet,
            result.savings.balance,
            state.fixedDeposits,
            state.sips,
            state.ownedAssets,
          ),
        });
      },

      takeEmergencyLoan: (amount: number) => {
        const state = get();
        if (!isFeatureUnlocked("bank-loans", state.currentPhase)) return false;
        if (state.emergencyLoan) return false;
        if (!GAME_CONFIG.EMERGENCY_LOAN_OPTIONS.includes(amount as 500 | 1000 | 2000)) return false;

        const netWorth = calculateNetWorth(state);
        const isEmergency =
          state.isGameOver ||
          state.player.wallet <= GAME_CONFIG.EMERGENCY_LOAN_DANGER_WALLET ||
          netWorth <= 80;
        if (!isEmergency) return false;

        const loan: EmergencyLoan = {
          id: createId(),
          principal: amount,
          startDay: state.currentDay,
          dailyInterestRate: GAME_CONFIG.EMERGENCY_LOAN_DAILY_INTEREST_RATE,
          totalPaid: 0,
          totalInterestPaid: 0,
        };

        const nextWallet = state.player.wallet + amount;
        set({
          emergencyLoan: loan,
          loanTakenToday: state.loanTakenToday + amount,
          player: {
            ...state.player,
            wallet: nextWallet,
          },
          isGameOver: false,
          isPlaying: true,
          gameOverReason: null,
        });

        return true;
      },

      repayEmergencyLoan: () => {
        const state = get();
        if (!state.emergencyLoan) return false;

        const loanInfo = getLoanOutstanding(state.emergencyLoan, state.currentDay);
        if (loanInfo.outstandingAmount <= 0) {
          set({ emergencyLoan: null });
          return true;
        }

        if (state.player.wallet < loanInfo.outstandingAmount) return false;

        const interestPart = Math.max(0, loanInfo.outstandingAmount - state.emergencyLoan.principal);
        const nextWallet = state.player.wallet - loanInfo.outstandingAmount;
        set({
          emergencyLoan: null,
          loanRepaidToday: state.loanRepaidToday + loanInfo.outstandingAmount,
          loanInterestPaidToday: state.loanInterestPaidToday + interestPart,
          player: {
            ...state.player,
            wallet: nextWallet,
          },
          ...getGameOverPatch(
            state,
            nextWallet,
            state.savings.balance,
            state.fixedDeposits,
            state.sips,
            state.ownedAssets,
          ),
        });

        return true;
      },

      createFixedDeposit: (amount: number, durationDays: number) => {
        const state = get();
        if (!state.isPlaying) return;
        if (!isFeatureUnlocked("investments", state.currentPhase)) return;
        if (amount <= 0 || state.player.wallet < amount) return;

        const fd = createFD(amount, state.player.currentDay, durationDays);
        if (!fd) return;

        const nextWallet = state.player.wallet - amount;
        const nextFDs = [...state.fixedDeposits, fd];
        set({
          fixedDeposits: nextFDs,
          player: {
            ...state.player,
            wallet: nextWallet,
          },
          ...getGameOverPatch(
            state,
            nextWallet,
            state.savings.balance,
            nextFDs,
            state.sips,
            state.ownedAssets,
          ),
        });
      },

      withdrawFixedDeposit: (fdId: string) => {
        const state = get();
        if (!state.isPlaying) return;
        const fd = state.fixedDeposits.find((item) => item.id === fdId);
        if (!fd) return;

        const result = withdrawFD(fd, state.player.currentDay);
        const nextWallet = state.player.wallet + result.amount;
        const nextFDs = state.fixedDeposits.filter((item) => item.id !== fdId);

        set({
          fixedDeposits: nextFDs,
          player: {
            ...state.player,
            wallet: nextWallet,
          },
          ...getGameOverPatch(
            state,
            nextWallet,
            state.savings.balance,
            nextFDs,
            state.sips,
            state.ownedAssets,
          ),
        });
      },

      createSIP: (amount: number, intervalDays: number) => {
        const state = get();
        if (!state.isPlaying) return;
        if (!isFeatureUnlocked("investments", state.currentPhase)) return;
        if (amount <= 0 || state.player.wallet < amount) return;

        const sip = createNewSIP(amount, intervalDays, state.player.currentDay);
        if (!sip) return;

        const nextWallet = state.player.wallet - amount;
        const nextSips = [...state.sips, sip];
        set({
          sips: nextSips,
          player: {
            ...state.player,
            wallet: nextWallet,
          },
          ...getGameOverPatch(
            state,
            nextWallet,
            state.savings.balance,
            state.fixedDeposits,
            nextSips,
            state.ownedAssets,
          ),
        });
      },

      cancelSIP: (sipId: string) => {
        const state = get();
        if (!state.isPlaying) return;
        const sip = state.sips.find((item) => item.id === sipId);
        if (!sip) return;

        const result = cancelSIPFn(sip);
        const nextWallet = state.player.wallet + result.returnAmount;
        const nextSips = state.sips.filter((item) => item.id !== sipId);

        set({
          sips: nextSips,
          player: {
            ...state.player,
            wallet: nextWallet,
          },
          ...getGameOverPatch(
            state,
            nextWallet,
            state.savings.balance,
            state.fixedDeposits,
            nextSips,
            state.ownedAssets,
          ),
        });
      },

      saveToBank: (amount: number) => {
        const state = get();
        if (!state.isPlaying) return;
        if (!isFeatureUnlocked("savings-account", state.currentPhase)) return;
        if (amount <= 0 || state.player.wallet < amount) return;

        const nextWallet = state.player.wallet - amount;
        set({
          player: {
            ...state.player,
            wallet: nextWallet,
            bankBalance: state.player.bankBalance + amount,
          },
          todayBankSaved: state.todayBankSaved + amount,
          ...getGameOverPatch(
            state,
            nextWallet,
            state.savings.balance,
            state.fixedDeposits,
            state.sips,
            state.ownedAssets,
          ),
        });
      },

      investMoney: (amount: number) => {
        const state = get();
        if (!state.isPlaying) return;
        if (!isFeatureUnlocked("investments", state.currentPhase)) return;
        if (amount <= 0 || state.player.wallet < amount) return;

        const nextWallet = state.player.wallet - amount;
        set({
          player: {
            ...state.player,
            wallet: nextWallet,
            investmentBalance: state.player.investmentBalance + amount,
          },
          todayInvested: state.todayInvested + amount,
          ...getGameOverPatch(
            state,
            nextWallet,
            state.savings.balance,
            state.fixedDeposits,
            state.sips,
            state.ownedAssets,
          ),
        });
      },

      buyAsset: (assetId: string) => {
        const state = get();
        if (!state.isPlaying) return;
        if (!isFeatureUnlocked("shop-assets", state.currentPhase)) return;
        const marketAsset = state.marketAssets.find((item) => item.id === assetId);
        if (!marketAsset) return;
        if (state.player.wallet < marketAsset.currentPrice) return;

        const newAsset = purchaseAsset(marketAsset, state.player.currentDay);
        const nextWallet = state.player.wallet - marketAsset.currentPrice;
        const nextAssets = [...state.ownedAssets, newAsset];

        set({
          ownedAssets: nextAssets,
          player: {
            ...state.player,
            wallet: nextWallet,
          },
          ...getGameOverPatch(
            state,
            nextWallet,
            state.savings.balance,
            state.fixedDeposits,
            state.sips,
            nextAssets,
          ),
        });
      },

      sellAsset: (assetId: string) => {
        const state = get();
        if (!state.isPlaying) return;
        const asset = state.ownedAssets.find((item) => item.id === assetId);
        if (!asset) return;

        const saleValue = calculateAssetValue(asset, state.player.currentDay);
        const nextWallet = state.player.wallet + saleValue;
        const nextAssets = state.ownedAssets.filter((item) => item.id !== assetId);

        set({
          ownedAssets: nextAssets,
          player: {
            ...state.player,
            wallet: nextWallet,
          },
          ...getGameOverPatch(
            state,
            nextWallet,
            state.savings.balance,
            state.fixedDeposits,
            state.sips,
            nextAssets,
          ),
        });
      },

      endDay: () => {
        const state = get();
        if (!state.isPlaying) return;
        set({ showEndOfDay: true, currentScreen: "end-day" });
      },

      startNewDay: () => {
        const preState = get();
        if (!preState.isPlaying) return;

        get().buildDailySummary();
        const state = get();
        const nextDay = state.currentDay + 1;

        const nextSavings = applySavingsInterest(state.savings);
        const nextFDs = updateFDMaturityStatus(state.fixedDeposits, nextDay);
        const nextAssets = updateAssetValues(state.ownedAssets, nextDay);
        const maintenanceBreakdown = calculateDailyMaintenanceBreakdown(nextAssets, nextDay);
        const maintenanceTotal = maintenanceBreakdown.reduce((sum, item) => sum + item.cost, 0);

        const pendingResolution = resolvePendingConsequences(
          nextDay,
          state.pendingEvents,
          nextSavings.balance,
        );

        let nextTree = resetTreeForNewDay(state.tree);
        let stormPenaltyRemaining = state.stormPenaltyDaysRemaining;
        if (stormPenaltyRemaining > 0) {
          nextTree = {
            ...nextTree,
            health: Math.max(0, nextTree.health - GAME_CONFIG.WEATHER_STORM_TREE_HEALTH_LOSS),
          };
          stormPenaltyRemaining -= 1;
        }

        nextTree = {
          ...nextTree,
          health: Math.max(0, Math.min(100, nextTree.health + pendingResolution.treeHealthDelta)),
        };

        const bankInterest = Math.floor(state.player.bankBalance * 0.01);
        const walletBeforeSIP =
          state.player.wallet +
          state.player.bankBalance +
          bankInterest +
          pendingResolution.walletDelta;

        let nextSips = applySIPGrowth(state.sips, nextDay);
        let sipDeductions = 0;
        for (const sip of nextSips) {
          const result = processSIPForDay(sip, nextDay, walletBeforeSIP - sipDeductions);
          if (result.invested) {
            nextSips = nextSips.map((item) => (item.id === sip.id ? result.sip : item));
            sipDeductions += result.amountDeducted;
          }
        }

        const nextWallet = walletBeforeSIP - sipDeductions - maintenanceTotal;
        const nextRiskMeter = Math.max(0, state.riskMeter - 2);
        const nextSimpleEvent = getEventForPhase(nextDay, state.currentPhase);

        set({
          tree: nextTree,
          treeHealth: { value: nextTree.health },
          savings: nextSavings,
          fixedDeposits: nextFDs,
          sips: nextSips,
          ownedAssets: nextAssets,
          player: {
            ...state.player,
            currentDay: nextDay,
            wallet: nextWallet,
            bankBalance: 0,
          },
          currentDay: nextDay,
          riskMeter: nextRiskMeter,
          riskLevel: getRiskLevel(nextRiskMeter),
          pendingEvents: pendingResolution.remaining,
          currentSimpleEvent: nextSimpleEvent,
          activeDailyEvents: [],
          activeGameEvent: null,
          eventConsequences: [
            ...state.eventConsequences,
            ...pendingResolution.logs.map((entry) => ({
              id: createId(),
              icon: "🧾",
              title: "Pending Consequence",
              summary: entry,
            })),
          ].slice(-12),
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
          stormPenaltyDaysRemaining: stormPenaltyRemaining,
          maintenanceChargesToday: maintenanceBreakdown,
          showMaintenancePopup: maintenanceBreakdown.length > 0,
          latestEventResolution: null,
          investmentPreviewDays: null,
          reviewStatus: "idle",
          reviewError: null,
          latestGeminiReview: null,
          reviewChatMessages: [],
          aiReviewEnabled: false,
          stockUnlocked:
            state.playerLevel >= GAME_CONFIG.STOCK_UNLOCK_LEVEL &&
            isFeatureUnlocked("stock-market", state.currentPhase),
          hasPlayed: true,
          loanTakenToday: 0,
          loanRepaidToday: 0,
          loanInterestPaidToday: 0,
          weatherLossToday: 0,
          ...getGameOverPatch(state, nextWallet, nextSavings.balance, nextFDs, nextSips, nextAssets),
        });

        syncProgression();

        const progressedState = get();
        if (
          !progressedState.currentSimpleEvent &&
          isFeatureUnlocked("simple-scenarios", progressedState.currentPhase)
        ) {
          set({ currentSimpleEvent: getEventForPhase(progressedState.currentDay, progressedState.currentPhase) });
        }

        if (
          progressedState.playerLevel >= GAME_CONFIG.STOCK_UNLOCK_LEVEL &&
          isFeatureUnlocked("stock-market", progressedState.currentPhase)
        ) {
          set({ stockUnlocked: true });
        }

        get().refreshLeaderboard();
      },

      advanceDay: () => {
        const state = get();
        if (!state.isPlaying) return;
        get().startNewDay();
      },

      handleEventChoice: (choiceId: string) => {
        const state = get();
        if (!isFeatureUnlocked("simple-scenarios", state.currentPhase)) return;
        const event = state.currentSimpleEvent as SimpleEvent | null;
        if (!event) return;

        const choice = event.choices.find((item) => item.id === choiceId);
        if (!choice) return;

        let walletDelta = 0;
        const treeHealthDelta = 0;
        const riskDelta = 0;
        const savingsDelta = 0;
        const investmentDelta = 0;
        let nextFDs = [...state.fixedDeposits];
        const nextSips = [...state.sips];
        const assetsToAdd = [] as GameState["ownedAssets"];
        const pendingToAdd: PendingEvent[] = [];
        let consequenceSummary = "Skipped safely.";
        const accepted = choice.id === "accept";

        if (accepted) {
          switch (event.id) {
            case "bike-offer": {
              const bike = state.marketAssets.find((item) => item.id === "bike");
              if (bike) {
                assetsToAdd.push(purchaseAsset({ ...bike, currentPrice: 0 }, state.currentDay));
                pendingToAdd.push(...queueEventConsequences(event.id, state.currentDay));
                consequenceSummary = "Bike boost activated for 3 days. Repair scheduled on Day+4.";
              }
              break;
            }
            case "scooter-offer": {
              const scooter = state.marketAssets.find((item) => item.id === "scooter");
              if (scooter) {
                assetsToAdd.push(purchaseAsset({ ...scooter, currentPrice: 0 }, state.currentDay));
                pendingToAdd.push(...queueEventConsequences(event.id, state.currentDay));
                consequenceSummary = "Scooter boost activated for 2 days. Repair scheduled on Day+3.";
              }
              break;
            }
            case "festival-gift-offer": {
              if (state.player.wallet >= 120) {
                walletDelta -= 120;
                pendingToAdd.push(...queueEventConsequences(event.id, state.currentDay));
                consequenceSummary = "Festival gift bought. Cashback and savings-check consequences scheduled.";
              } else {
                consequenceSummary = "Not enough cash for festival gift.";
              }
              break;
            }
            case "delay-bill-offer": {
              walletDelta += 100;
              pendingToAdd.push(...queueEventConsequences(event.id, state.currentDay));
              consequenceSummary = "Bill delayed. Extra charge scheduled for Day+5.";
              break;
            }
            case "emergency-friend-help": {
              if (state.player.wallet >= 80) {
                walletDelta -= 80;
                pendingToAdd.push(...queueEventConsequences(event.id, state.currentDay));
                consequenceSummary = "Friend help sent. Repayment outcome will arrive in 4 days.";
              } else {
                consequenceSummary = "Not enough wallet balance to lend ₹80.";
              }
              break;
            }
            case "quick-fd-bonus": {
              if (state.player.wallet >= 150) {
                const fd = createFD(150, state.currentDay, 7);
                if (fd) {
                  fd.interestRate = 0.11;
                  nextFDs = [...nextFDs, fd];
                  walletDelta -= 150;
                  consequenceSummary = "Bonus FD created: ₹150 locked for 7 days at 11%.";
                }
              } else {
                consequenceSummary = "Insufficient wallet for ₹150 bonus FD.";
              }
              break;
            }
            case "appreciating-asset-discount": {
              if (state.player.wallet >= 200) {
                const villageShop = state.marketAssets.find((item) => item.id === "village-shop");
                if (villageShop) {
                  assetsToAdd.push(
                    purchaseAsset({ ...villageShop, currentPrice: 200 }, state.currentDay),
                  );
                  walletDelta -= 200;
                  consequenceSummary = "Village Shop bought at discount with permanent +15% earning boost.";
                }
              } else {
                consequenceSummary = "Insufficient wallet for ₹200 Village Shop discount.";
              }
              break;
            }
            case "car-offer": {
              const car = state.marketAssets.find((item) => item.id === "car");
              if (car) {
                assetsToAdd.push(purchaseAsset({ ...car, currentPrice: 0 }, state.currentDay));
                pendingToAdd.push(...queueEventConsequences(event.id, state.currentDay));
                consequenceSummary = "Car boost activated for 3 days. Heavy maintenance scheduled on Day+4.";
              }
              break;
            }
            default:
              break;
          }
        }

        const nextWallet = state.player.wallet + walletDelta;
        const nextSavings = Math.max(0, state.savings.balance + savingsDelta);
        const nextInvestment = Math.max(0, state.player.investmentBalance + investmentDelta);
        const nextTreeHealth = Math.max(0, Math.min(100, state.tree.health + treeHealthDelta));
        const nextRisk = Math.max(0, Math.min(100, state.riskMeter + riskDelta));
        const nextAssets = [...state.ownedAssets, ...assetsToAdd];
        const nextPending = [...state.pendingEvents, ...pendingToAdd];

        const decision: DailyDecision = {
          id: createId(),
          day: state.currentDay,
          eventId: event.id,
          eventTitle: event.title,
          choiceId: choice.id,
          choiceLabel: choice.label,
          walletDelta,
          savingsDelta,
          investmentDelta,
          treeHealthDelta,
          riskDelta,
          consequenceSummary,
          wasTemptationAccepted: accepted,
        };

        set({
          player: {
            ...state.player,
            wallet: nextWallet,
            investmentBalance: nextInvestment,
          },
          savings: {
            ...state.savings,
            balance: nextSavings,
          },
          fixedDeposits: nextFDs,
          sips: nextSips,
          ownedAssets: nextAssets,
          tree: {
            ...state.tree,
            health: nextTreeHealth,
          },
          treeHealth: { value: nextTreeHealth },
          riskMeter: nextRisk,
          riskLevel: getRiskLevel(nextRisk),
          completedScenarios: state.completedScenarios + 1,
          pendingEvents: nextPending,
          currentSimpleEvent: null,
          activeDailyEvents: [],
          activeGameEvent: null,
          dailyDecisionLog: [...state.dailyDecisionLog, decision],
          eventConsequences: [
            ...state.eventConsequences,
            {
              id: createId(),
              icon: event.icon,
              title: event.title,
              summary: consequenceSummary,
            },
          ].slice(-12),
          ...getGameOverPatch(state, nextWallet, nextSavings, nextFDs, nextSips, nextAssets),
        });
      },

      applyInvestmentPreview: (days: number | null) => {
        set({ investmentPreviewDays: days });
      },

      setScreen: (screen: GameScreen) => {
        set({ currentScreen: screen });
      },

      toggleBankModal: () => {
        const state = get();
        set({ showBankModal: !state.showBankModal });
      },

      triggerWaterEffect: () => {
        set({ showWaterEffect: true });
        setTimeout(() => set({ showWaterEffect: false }), 1200);
      },

      triggerCoinEffect: (amount: number) => {
        set({ showCoinEffect: true, lastCoinAmount: amount });
        setTimeout(() => set({ showCoinEffect: false }), 1200);
      },

      setAITip: (tip: string | null) => {
        set({ aiTip: tip });
      },

      dismissLesson: () => {
        set({ showLesson: false, currentLesson: null });
      },

      dismissMaintenancePopup: () => {
        set({ showMaintenancePopup: false });
      },

      dismissStormEmergency: () => {
        set({ showStormEmergency: false });
      },

      resolveSuddenEvent: () => {
        // Legacy sudden event flow disabled for the simplified final design.
      },

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

      loadGame: () => {
        // No-op: zustand persist handles hydration.
      },
    };
    },
    {
      name: "growtopia-game-storage",
    },
  ),
);
// Game state management with Zustand

