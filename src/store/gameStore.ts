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
  SuddenEvent,
  EventResolutionLog,
  StormEmergency,
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
    id: "pocket-money-day",
    title: "🎒 Pocket Money Day",
    scenario: "You received ₹100 as pocket money.",
    options: [
      {
        id: "snacks",
        label: "Spend all on snacks 🍫",
        walletDelta: 0,
        quality: "weak",
        treeHealthDelta: -2,
        resultText: "Quick happiness, but no money was protected for emergencies.",
      },
      {
        id: "save-all",
        label: "Save all 💰",
        walletDelta: 0,
        savingsDelta: 100,
        quality: "strong",
        treeHealthDelta: 3,
        resultText: "Strong discipline. Savings give long-term financial stability.",
      },
      {
        id: "split",
        label: "Spend ₹50, save ₹50",
        walletDelta: 0,
        savingsDelta: 50,
        quality: "balanced",
        treeHealthDelta: 1,
        resultText: "Balanced choice. You enjoyed today and still saved for tomorrow.",
      },
    ],
  },
  {
    id: "game-sale",
    title: "🎮 Game Sale Temptation",
    scenario: "A game is on sale for ₹80.",
    options: [
      {
        id: "buy",
        label: "Buy it",
        walletDelta: -80,
        quality: "weak",
        treeHealthDelta: -3,
        resultText: "Impulse buying reduced your future flexibility.",
      },
      {
        id: "ignore",
        label: "Ignore it",
        walletDelta: 0,
        quality: "strong",
        treeHealthDelta: 3,
        resultText: "Great restraint. Delayed gratification strengthens money habits.",
      },
      {
        id: "later",
        label: "Save for later purchase",
        walletDelta: 0,
        savingsDelta: 40,
        quality: "balanced",
        treeHealthDelta: 1,
        resultText: "You avoided impulse and started planning for purchases.",
      },
    ],
  },
  {
    id: "hungry-after-school",
    title: "🍔 Hungry After School",
    scenario: "You are hungry after school.",
    options: [
      {
        id: "food",
        label: "Buy food (₹50)",
        walletDelta: -50,
        quality: "balanced",
        treeHealthDelta: 2,
        resultText: "Necessary spending is healthy when kept reasonable.",
      },
      {
        id: "skip",
        label: "Skip and save",
        walletDelta: 0,
        quality: "weak",
        treeHealthDelta: -6,
        resultText: "Over-saving at the cost of needs can backfire.",
      },
      {
        id: "cheap",
        label: "Buy cheaper option (₹20)",
        walletDelta: -20,
        quality: "strong",
        treeHealthDelta: 4,
        resultText: "Smart spending: need fulfilled with lower cost.",
      },
    ],
  },
  {
    id: "broken-headphones",
    title: "🎧 Broken Headphones",
    scenario: "Your headphones broke (₹150 repair).",
    options: [
      {
        id: "use-savings",
        label: "Use savings",
        walletDelta: 0,
        savingsDelta: -150,
        quality: "strong",
        treeHealthDelta: 2,
        resultText: "Emergency fund worked exactly as intended.",
      },
      {
        id: "ignore",
        label: "Ignore problem",
        walletDelta: 0,
        quality: "weak",
        treeHealthDelta: -5,
        resultText: "Ignoring maintenance often causes bigger losses later.",
      },
      {
        id: "borrow",
        label: "Borrow money",
        walletDelta: -30,
        quality: "balanced",
        treeHealthDelta: -1,
        resultText: "Borrowing solved now, but interest and instability increase future stress.",
      },
    ],
  },
  {
    id: "birthday-party",
    title: "🎉 Friend’s Birthday Party",
    scenario: "Friend invites you to a party (₹200).",
    options: [
      {
        id: "spend-all",
        label: "Spend and go",
        walletDelta: -200,
        quality: "weak",
        treeHealthDelta: -3,
        resultText: "Full spending weakened your cash buffer.",
      },
      {
        id: "skip-save",
        label: "Skip and save",
        walletDelta: 0,
        savingsDelta: 100,
        quality: "strong",
        treeHealthDelta: 3,
        resultText: "Financial strength increased by prioritizing savings.",
      },
      {
        id: "spend-less",
        label: "Spend less (₹100)",
        walletDelta: -100,
        quality: "balanced",
        treeHealthDelta: 1,
        resultText: "A budgeted social decision preserved part of your reserves.",
      },
    ],
  },
  {
    id: "investment-opportunity",
    title: "📈 Investment Opportunity",
    scenario: "You can allocate ₹200 today.",
    options: [
      {
        id: "invest",
        label: "Invest (locked, higher return)",
        walletDelta: -200,
        investmentDelta: 200,
        quality: "strong",
        treeHealthDelta: 3,
        resultText: "Strong long-term move. You traded liquidity for growth.",
      },
      {
        id: "save",
        label: "Save normally",
        walletDelta: 0,
        savingsDelta: 200,
        quality: "balanced",
        treeHealthDelta: 1,
        resultText: "Safe and stable. Lower return, but strong liquidity.",
      },
      {
        id: "spend",
        label: "Spend instead",
        walletDelta: -200,
        quality: "weak",
        treeHealthDelta: -4,
        resultText: "Short-term spending weakened your future growth potential.",
      },
    ],
  },
  {
    id: "flash-sale",
    title: "⚡ Flash Sale Offer",
    scenario: "Limited-time deal! Buy now.",
    options: [
      {
        id: "buy-now",
        label: "Buy immediately",
        walletDelta: -120,
        quality: "weak",
        treeHealthDelta: -3,
        resultText: "Impulsive buying hurt your emergency readiness.",
      },
      {
        id: "skip",
        label: "Think and skip",
        walletDelta: 0,
        quality: "strong",
        treeHealthDelta: 3,
        resultText: "You protected your funds by avoiding pressure spending.",
      },
      {
        id: "wait",
        label: "Wait",
        walletDelta: 0,
        quality: "balanced",
        treeHealthDelta: 1,
        resultText: "Good pause. Decision quality improves when you slow down.",
      },
    ],
  },
  {
    id: "sudden-rain-bonus",
    title: "🌧️ Sudden Rain Bonus",
    scenario: "You got a surprise bonus of ₹100.",
    options: [
      {
        id: "bonus-spend",
        label: "Spend",
        walletDelta: 0,
        quality: "weak",
        treeHealthDelta: -1,
        resultText: "Unexpected income disappeared quickly without improving stability.",
      },
      {
        id: "bonus-save",
        label: "Save",
        walletDelta: 0,
        savingsDelta: 100,
        quality: "strong",
        treeHealthDelta: 3,
        resultText: "Excellent. Windfall money strengthened your emergency fund.",
      },
      {
        id: "bonus-invest",
        label: "Invest",
        walletDelta: 0,
        investmentDelta: 100,
        quality: "strong",
        treeHealthDelta: 3,
        resultText: "Great long-term choice from unexpected money.",
      },
    ],
  },
  {
    id: "new-phone-upgrade",
    title: "📱 New Phone Upgrade",
    scenario: "You want a new phone (₹500).",
    options: [
      {
        id: "buy-phone",
        label: "Buy now",
        walletDelta: -500,
        quality: "weak",
        treeHealthDelta: -4,
        resultText: "Large impulse purchase reduced your resilience.",
      },
      {
        id: "save-phone",
        label: "Save for it",
        walletDelta: 0,
        savingsDelta: 150,
        quality: "strong",
        treeHealthDelta: 2,
        resultText: "Planned purchasing protects goals and avoids cash shocks.",
      },
      {
        id: "ignore-phone",
        label: "Ignore",
        walletDelta: 0,
        quality: "balanced",
        treeHealthDelta: 1,
        resultText: "Neutral choice with no immediate financial stress.",
      },
    ],
  },
  {
    id: "school-emergency",
    title: "📚 Emergency School Expense",
    scenario: "School needs ₹100 urgently.",
    options: [
      {
        id: "school-savings",
        label: "Use savings",
        walletDelta: 0,
        savingsDelta: -100,
        quality: "strong",
        treeHealthDelta: 3,
        resultText: "Savings protected you during an urgent need.",
      },
      {
        id: "school-borrow",
        label: "Borrow",
        walletDelta: -130,
        quality: "balanced",
        treeHealthDelta: -1,
        resultText: "Borrowing solved today, but repayment increased future burden.",
      },
      {
        id: "school-cannot-pay",
        label: "Cannot pay",
        walletDelta: 0,
        quality: "weak",
        treeHealthDelta: -8,
        resultText: "No emergency buffer caused a serious setback.",
      },
    ],
  },
];

function pickSuddenEvent(day: number): SuddenEvent {
  const index = (day * 7 + 3) % SUDDEN_EVENTS.length;
  return SUDDEN_EVENTS[index];
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

// Generate insightful daily lesson
function generateDailyLesson(state: GameState): DailyLesson {
  const dailyEarnings = state.player.totalEarnings - state.dayStartTotalEarnings;
  const savedToday = state.todayBankSaved;
  const savingsDepositedToday = state.todaySavingsDeposited;
  const totalSavedToday = savedToday + savingsDepositedToday;
  const maintenanceTotal = state.maintenanceChargesToday.reduce(
    (sum, item) => sum + item.cost,
    0,
  );

  const goodDecisions: string[] = [];
  const improvements: string[] = [];

  // Analyze good decisions
  if (state.tree.timesWateredToday >= 3) {
    goodDecisions.push("You watered your plant the maximum times - great productivity!");
  }
  if (totalSavedToday > dailyEarnings * 0.2) {
    goodDecisions.push("You saved more than 20% of your earnings - smart saving habit!");
  }
  if (state.savings.balance > 0) {
    goodDecisions.push("You have money in savings earning 1% daily interest!");
  }
  if (state.fixedDeposits.length > 0) {
    goodDecisions.push("You have FDs growing your wealth for the future!");
  }
  if (state.sips.length > 0) {
    goodDecisions.push("Your SIPs are building wealth automatically!");
  }
  if (state.currentWeather === "rain") {
    goodDecisions.push("Rain gave a bonus because your savings discipline is strong.");
  }
  if (state.latestEventResolution?.quality === "strong") {
    goodDecisions.push(`Great choice in today's challenge: ${state.latestEventResolution.optionLabel}.`);
  }

  // Analyze areas for improvement
  if (totalSavedToday === 0 && dailyEarnings > 100) {
    improvements.push("Consider saving some money - even small amounts add up!");
  }
  if (state.savings.balance === 0 && state.player.wallet > 200) {
    improvements.push("Opening a savings account gives you daily interest.");
  }
  if (state.ownedAssets.length === 0 && state.player.currentDay > 3) {
    improvements.push("Check out assets in the shop - they can boost your earnings!");
  }
  if (state.player.waterUnits < 3) {
    improvements.push("Buy more water to keep earning tomorrow!");
  }
  if (maintenanceTotal > 0) {
    improvements.push(
      `You paid ₹${maintenanceTotal} in maintenance. Sell old depreciating assets before costs snowball.`,
    );
  }
  if (state.latestEventResolution?.quality === "weak") {
    improvements.push(
      `Today's choice "${state.latestEventResolution.optionLabel}" hurt stability. Plan expenses before spending.`,
    );
  }
  if (state.currentWeather === "storm" && state.activeStormEmergency) {
    improvements.push(
      "Storm emergency proved why emergency funds are critical when surprise bills appear.",
    );
  }

  // Asset impact summary
  let assetImpact = "";
  const depreciating = state.ownedAssets.filter((a) => a.type === "depreciating");
  const appreciating = state.ownedAssets.filter((a) => a.type === "appreciating");

  if (depreciating.length > 0 || appreciating.length > 0) {
    assetImpact = `\n\n📦 You own ${depreciating.length} depreciating asset(s) (quick boost, loses value) and ${appreciating.length} appreciating asset(s) (grows over time).`;
  }

  const eventSummary = state.latestEventResolution
    ? `\n\n🎯 Sudden Event: ${state.latestEventResolution.eventTitle} → ${state.latestEventResolution.optionLabel}. ${state.latestEventResolution.resultText}`
    : "";

  const maintenanceSummary =
    maintenanceTotal > 0
      ? `\n\n🧰 Maintenance paid today: ₹${maintenanceTotal}.`
      : "";

  const lesson: DailyLesson = {
    day: state.player.currentDay,
    title: `Day ${state.player.currentDay} Review`,
    content: `Today you earned ₹${dailyEarnings} and saved ₹${totalSavedToday}. Your total savings: ₹${state.savings.balance}. Bank balance: ₹${state.player.bankBalance}.${assetImpact}${eventSummary}${maintenanceSummary}`,
    tip: goodDecisions.length > 0 
      ? goodDecisions[0] 
      : "Remember: Save a little every day and your money will grow!",
    basedOn: ["daily_performance"],
    goodDecisions,
    improvements,
  };

  return lesson;
}

const initialState: GameState = {
  player: createInitialPlayer(),
  tree: createInitialTree(),
  savings: createInitialSavings(),
  fixedDeposits: [],
  sips: [],
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
  isPlaying: true,
  showEndOfDay: false,
  showLesson: false,
  currentLesson: null,
  aiTip: AI_TIPS.firstDay,
  showBankModal: false,
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Water the tree
      waterTree: () => {
        const state = get();
        if (!state.isPlaying) return;
        if (!canWaterTree(state.tree, state.player.waterUnits)) return;

        const baseEarnings = calculateTreeYield(
          state.tree,
          state.ownedAssets,
          state.player.currentDay,
        );
        const earnings = applyWeatherModifier(baseEarnings, state.currentWeather);
        const nextWallet = state.player.wallet + earnings;

        set({
          tree: updateTreeAfterWatering(state.tree),
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
        const state = get();
        if (!state.isPlaying) return;
        const nextDay = state.player.currentDay + 1;

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

        // Generate enhanced lesson
        const lesson = generateDailyLesson(state);

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
        const shouldTriggerSuddenEvent = nextDay >= 4 && !gameOverPatch.isGameOver;
        const suddenEvent = shouldTriggerSuddenEvent ? pickSuddenEvent(nextDay) : null;

        set({
          tree: resetTreeForNewDay(state.tree),
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
          lessons: [...state.lessons, lesson],
          showEndOfDay: false,
          showLesson: true,
          currentLesson: lesson,
          currentScreen: "play",
          timeOfDay: "morning",
          dayStartTotalEarnings: state.player.totalEarnings,
          todayInvested: 0,
          todayBankSaved: 0,
          todaySavingsDeposited: 0,
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
          ...gameOverPatch,
        });

        // Update AI tip
        const newState = get();
        set({ aiTip: getAITip(newState) });
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
        set({
          ...initialState,
          player: createInitialPlayer(),
          tree: createInitialTree(),
          savings: createInitialSavings(),
          fixedDeposits: [],
          sips: [],
          ownedAssets: [],
          lessons: [],
          aiTip: AI_TIPS.firstDay,
          showBankModal: false,
        });
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
          showLesson: true,
          currentLesson: lesson,
          ...getGameOverPatch(state, newWallet, state.savings.balance),
        });
      },
    }),
    {
      name: "growtopia-game-storage",
    },
  ),
);
