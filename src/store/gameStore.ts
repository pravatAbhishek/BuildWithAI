// Game state management with Zustand

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GameState,
  GameActions,
  DailyLesson,
  MarketAsset,
  GameScreen,
  WeatherEvent,
} from "@/types/game";
import { GAME_CONFIG, MARKET_ASSETS } from "@/lib/constants";
import {
  calculateTreeYield,
  canWaterTree,
  updateTreeAfterWatering,
  resetTreeForNewDay,
  createInitialPlayer,
  createInitialTree,
  calculateWaterCost,
} from "@/lib/gameEngine";
import {
  createInitialSavings,
  applySavingsInterest,
  depositToSavings as depositSavings,
  withdrawFromSavings as withdrawSavings,
  createFixedDeposit as createFD,
  updateFDMaturityStatus,
  withdrawFD,
} from "@/lib/bankingLogic";
import {
  updateAssetValues,
  calculateAssetValue,
  purchaseAsset,
} from "@/lib/assetCalculator";

// AI Tips based on player actions
const AI_TIPS = {
  lowMoney: "💡 Tip: Try saving some money in the bank for tomorrow!",
  noWater: "💧 Tip: Buy water from the shop to water your plant!",
  goodSaver: "🌟 Great job saving! Your money will grow with interest!",
  investor: "📈 Smart! Investments grow over time but need patience.",
  wateringDone: "🌙 Great work today! End the day to see what happens next.",
  firstDay: "👋 Welcome! Tap your plant to water it and earn coins!",
  bankTip: "🏦 Bank savings are safe and earn small daily interest.",
  investTip: "🌱 Investments grow faster but you can't use them right away.",
  shopTip: "🛒 Assets can boost your earnings! Check the shop.",
  balanced: "⚖️ Great balance of saving and spending! Keep it up!",
};

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
  if (state.player.bankBalance > 100) {
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

const initialState: GameState = {
  player: createInitialPlayer(),
  tree: createInitialTree(),
  savings: createInitialSavings(),
  fixedDeposits: [],
  ownedAssets: [],
  marketAssets: MARKET_ASSETS as MarketAsset[],
  lessons: [],
  timeOfDay: "morning",
  currentScreen: "play",
  showWaterEffect: false,
  showCoinEffect: false,
  lastCoinAmount: 0,
  currentWeather: "none",
  weatherIntensity: 0,
  dayStartTotalEarnings: 0,
  todayInvested: 0,
  todayBankSaved: 0,
  isPlaying: true,
  showEndOfDay: false,
  showLesson: false,
  currentLesson: null,
  aiTip: AI_TIPS.firstDay,
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Water the tree
      waterTree: () => {
        const state = get();
        if (!canWaterTree(state.tree, state.player.waterUnits)) return;

        const earnings = calculateTreeYield(
          state.tree,
          state.ownedAssets,
          state.player.currentDay,
        );

        set({
          tree: updateTreeAfterWatering(state.tree),
          player: {
            ...state.player,
            wallet: state.player.wallet + earnings,
            waterUnits: state.player.waterUnits - 1,
            totalEarnings: state.player.totalEarnings + earnings,
          },
          showWaterEffect: true,
          showCoinEffect: true,
          lastCoinAmount: earnings,
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
        const cost = calculateWaterCost(units);
        if (state.player.wallet < cost) return;

        set({
          player: {
            ...state.player,
            wallet: state.player.wallet - cost,
            waterUnits: state.player.waterUnits + units,
          },
        });
      },

      // Deposit to savings
      depositToSavings: (amount: number) => {
        const state = get();
        if (amount <= 0 || state.player.wallet < amount) return;

        set({
          savings: depositSavings(state.savings, amount),
          player: {
            ...state.player,
            wallet: state.player.wallet - amount,
          },
        });
      },

      // Withdraw from savings
      withdrawFromSavings: (amount: number) => {
        const state = get();
        const result = withdrawSavings(state.savings, amount);

        set({
          savings: result.savings,
          player: {
            ...state.player,
            wallet: state.player.wallet + result.withdrawn,
          },
        });
      },

      // Create fixed deposit
      createFixedDeposit: (
        amount: number,
        days: number = GAME_CONFIG.FD_LOCK_DAYS,
      ) => {
        const state = get();
        if (amount <= 0 || state.player.wallet < amount) return;

        const fd = createFD(amount, state.player.currentDay, days);
        if (!fd) return;

        set({
          fixedDeposits: [...state.fixedDeposits, fd],
          player: {
            ...state.player,
            wallet: state.player.wallet - amount,
          },
        });
      },

      // Withdraw fixed deposit
      withdrawFixedDeposit: (fdId: string) => {
        const state = get();
        const fd = state.fixedDeposits.find((f) => f.id === fdId);
        if (!fd) return;

        const result = withdrawFD(fd, state.player.currentDay);

        set({
          fixedDeposits: state.fixedDeposits.filter((f) => f.id !== fdId),
          player: {
            ...state.player,
            wallet: state.player.wallet + result.amount,
          },
        });
      },

      // Buy asset
      buyAsset: (assetId: string) => {
        const state = get();
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
        });
      },

      // Sell asset
      sellAsset: (assetId: string) => {
        const state = get();
        const asset = state.ownedAssets.find((a) => a.id === assetId);
        if (!asset) return;

        const saleValue = calculateAssetValue(asset, state.player.currentDay);

        set({
          ownedAssets: state.ownedAssets.filter((a) => a.id !== assetId),
          player: {
            ...state.player,
            wallet: state.player.wallet + saleValue,
          },
        });
      },

      // End day
      endDay: () => {
        set({ showEndOfDay: true, currentScreen: "end-day" });
      },

      // Start new day
      startNewDay: () => {
        const state = get();

        // Apply daily changes
        const newSavings = applySavingsInterest(state.savings);
        const newFDs = updateFDMaturityStatus(
          state.fixedDeposits,
          state.player.currentDay + 1,
        );
        const newAssets = updateAssetValues(
          state.ownedAssets,
          state.player.currentDay + 1,
        );
        // Investment growth (5% daily)
        const investmentGrowth = Math.floor(
          state.player.investmentBalance * 0.05,
        );
        // Bank interest (1% daily)
        const bankInterest = Math.floor(state.player.bankBalance * 0.01);

        // Generate lesson placeholder (will be replaced with AI)
        const dailyEarnings =
          state.player.totalEarnings - state.dayStartTotalEarnings;
        const savedToday = state.todayBankSaved;
        const investedToday = state.todayInvested;
        const additionalWater =
          state.currentWeather !== "none"
            ? GAME_CONFIG.WEATHER_DAILY_WATER_BONUS
            : 0;

        // Asset impact summary
        let assetImpact = "";
        const depreciating = state.ownedAssets.filter(
          (a) => a.type === "depreciating",
        );
        const appreciating = state.ownedAssets.filter(
          (a) => a.type === "appreciating",
        );

        if (depreciating.length > 0 || appreciating.length > 0) {
          assetImpact = `\n\nYou own ${depreciating.length} depreciating asset(s) that provide immediate income but lose value, and ${appreciating.length} appreciating asset(s) that grow in value over time. In real life, this is like owning both a car (depreciates, costs maintenance) and property (appreciates, long-term investment).`;
        }

        const lesson: DailyLesson = {
          day: state.player.currentDay,
          title: `Day ${state.player.currentDay} Review`,
          content: `Today you watered your tree ${state.tree.timesWateredToday} time(s) and earned ₹${dailyEarnings}. You saved ₹${savedToday} to your bank (now ₹${state.player.bankBalance + savedToday} total) and invested ₹${investedToday}. Your bank provides liquid funds with daily interest, while investments grow faster but are locked. In the real world, this is like balancing cash for daily needs, savings for security, and investments for long-term growth.${assetImpact}`,
          tip: `Good financial habits: Save emergency funds, invest for growth, diversify assets, and always keep some cash available.`,
          basedOn: ["daily_performance"],
        };

        const newWallet =
          state.player.wallet + state.player.bankBalance + bankInterest;

        set({
          tree: resetTreeForNewDay(state.tree),
          savings: newSavings,
          fixedDeposits: newFDs,
          ownedAssets: newAssets,
          player: {
            ...state.player,
            currentDay: state.player.currentDay + 1,
            wallet: newWallet,
            bankBalance: 0,
            investmentBalance:
              state.player.investmentBalance + investmentGrowth,
            waterUnits: state.player.waterUnits + additionalWater,
          },
          lessons: [...state.lessons, lesson],
          showEndOfDay: false,
          showLesson: true,
          currentLesson: lesson,
          currentScreen: "play",
          timeOfDay: "morning",
          dayStartTotalEarnings: state.player.totalEarnings,
          todayInvested: 0,
          todayBankSaved: 0,
        });

        // Update AI tip
        const newState = get();
        set({ aiTip: getAITip(newState) });
      },

      // Screen navigation
      setScreen: (screen: GameScreen) => {
        set({ currentScreen: screen });
      },

      // Save to bank (end of day)
      saveToBank: (amount: number) => {
        const state = get();
        if (amount <= 0 || state.player.wallet < amount) return;

        set({
          player: {
            ...state.player,
            wallet: state.player.wallet - amount,
            bankBalance: state.player.bankBalance + amount,
          },
          todayBankSaved: state.todayBankSaved + amount,
        });
      },

      // Invest money (end of day)
      investMoney: (amount: number) => {
        const state = get();
        if (amount <= 0 || state.player.wallet < amount) return;

        set({
          player: {
            ...state.player,
            wallet: state.player.wallet - amount,
            investmentBalance: state.player.investmentBalance + amount,
          },
          todayInvested: state.todayInvested + amount,
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

      // Reset game
      resetGame: () => {
        set({
          ...initialState,
          player: createInitialPlayer(),
          tree: createInitialTree(),
          savings: createInitialSavings(),
          fixedDeposits: [],
          ownedAssets: [],
          lessons: [],
          aiTip: AI_TIPS.firstDay,
        });
      },

      // Load game (called on mount)
      loadGame: () => {
        // Persistence is handled by zustand/persist middleware
        // This is here for manual reload if needed
      },

      // Trigger weather event
      triggerWeatherEvent: (event: WeatherEvent) => {
        set({
          currentWeather: event,
          weatherIntensity: event === "none" ? 0 : 100,
        });
      },

      // Clear weather event
      clearWeatherEvent: () => {
        set({
          currentWeather: "none",
          weatherIntensity: 0,
        });
      },

      // Pay weather event charge to end weather early
      payWeatherCharge: () => {
        const state = get();
        if (state.currentWeather === "none") return;

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
          content: `You paid ₹${charge} to end the ${state.currentWeather} event. This shows how emergency costs can affect your wallet and why savings matter.`, 
          tip: `Having a reserve helps you avoid negative balances and recover faster.`, 
          basedOn: ["weather_event"],
        };

        set({
          player: {
            ...state.player,
            wallet: newWallet,
          },
          currentWeather: "none",
          weatherIntensity: 0,
          lessons: [...state.lessons, lesson],
          showLesson: true,
          currentLesson: lesson,
        });
      },
    }),
    {
      name: "growtopia-game-storage",
    },
  ),
);
