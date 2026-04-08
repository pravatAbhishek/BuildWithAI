// Game state management with Zustand

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GameState,
  GameActions,
  DailyLesson,
  MarketAsset,
} from "@/types/game";
import { GAME_CONFIG, MARKET_ASSETS } from "./constants";
import {
  calculateTreeYield,
  canWaterTree,
  updateTreeAfterWatering,
  resetTreeForNewDay,
  createInitialPlayer,
  createInitialTree,
  calculateWaterCost,
} from "./gameEngine";
import {
  createInitialSavings,
  applySavingsInterest,
  depositToSavings as depositSavings,
  withdrawFromSavings as withdrawSavings,
  createFixedDeposit as createFD,
  updateFDMaturityStatus,
  withdrawFD,
} from "./bankingLogic";
import {
  updateAssetValues,
  calculateMaintenanceCosts,
  calculateAssetValue,
  purchaseAsset,
} from "./assetCalculator";

const initialState: GameState = {
  player: createInitialPlayer(),
  tree: createInitialTree(),
  savings: createInitialSavings(),
  fixedDeposits: [],
  ownedAssets: [],
  marketAssets: MARKET_ASSETS as MarketAsset[],
  lessons: [],
  isPlaying: true,
  showEndOfDay: false,
  showLesson: false,
  currentLesson: null,
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
        });
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
        set({ showEndOfDay: true });
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
        const maintenanceCost = calculateMaintenanceCosts(
          state.ownedAssets,
          state.player.currentDay + 1,
        );

        // Generate lesson placeholder (will be replaced with AI)
        const lesson: DailyLesson = {
          day: state.player.currentDay,
          title: `Day ${state.player.currentDay} Lesson`,
          content: `Great job today! You earned money and learned about managing resources.`,
          tip: "Remember: Saving early helps your money grow over time!",
          basedOn: ["daily_summary"],
        };

        set({
          tree: resetTreeForNewDay(state.tree),
          savings: newSavings,
          fixedDeposits: newFDs,
          ownedAssets: newAssets,
          player: {
            ...state.player,
            currentDay: state.player.currentDay + 1,
            wallet: Math.max(0, state.player.wallet - maintenanceCost),
          },
          lessons: [...state.lessons, lesson],
          showEndOfDay: false,
          showLesson: true,
          currentLesson: lesson,
        });
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
        });
      },

      // Load game (called on mount)
      loadGame: () => {
        // Persistence is handled by zustand/persist middleware
        // This is here for manual reload if needed
      },
    }),
    {
      name: "growtopia-game-storage",
    },
  ),
);
