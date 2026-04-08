// Banking logic for savings, fixed deposits, and SIPs

import { GAME_CONFIG } from "./constants";
import type { SavingsAccount, FixedDeposit, SIP } from "@/types/game";

/**
 * Create initial savings account
 */
export function createInitialSavings(): SavingsAccount {
  return {
    balance: 0,
    interestRate: GAME_CONFIG.SAVINGS_INTEREST_RATE, // 1% daily
  };
}

/**
 * Calculate daily interest for savings account
 */
export function calculateSavingsInterest(savings: SavingsAccount): number {
  return Math.floor(savings.balance * savings.interestRate);
}

/**
 * Apply daily interest to savings
 */
export function applySavingsInterest(savings: SavingsAccount): SavingsAccount {
  const interest = calculateSavingsInterest(savings);
  return {
    ...savings,
    balance: savings.balance + interest,
  };
}

/**
 * Deposit to savings account
 */
export function depositToSavings(
  savings: SavingsAccount,
  amount: number,
): SavingsAccount {
  if (amount <= 0) return savings;

  return {
    ...savings,
    balance: savings.balance + amount,
  };
}

/**
 * Withdraw from savings account
 */
export function withdrawFromSavings(
  savings: SavingsAccount,
  amount: number,
): { savings: SavingsAccount; withdrawn: number } {
  const withdrawn = Math.min(amount, savings.balance);

  return {
    savings: {
      ...savings,
      balance: savings.balance - withdrawn,
    },
    withdrawn,
  };
}

/**
 * Get FD options with rates
 */
export function getFDOptions(): Array<{ days: number; rate: number; label: string }> {
  return GAME_CONFIG.FD_OPTIONS;
}

/**
 * Create a new fixed deposit with selected duration
 */
export function createFixedDeposit(
  principal: number,
  currentDay: number,
  durationDays: number,
): FixedDeposit | null {
  if (principal < GAME_CONFIG.FD_MINIMUM_AMOUNT) {
    return null;
  }

  // Find the rate for selected duration
  const option = GAME_CONFIG.FD_OPTIONS.find(opt => opt.days === durationDays);
  const rate = option?.rate || 0.05;

  return {
    id: crypto.randomUUID(),
    principal,
    interestRate: rate,
    startDay: currentDay,
    maturityDay: currentDay + durationDays,
    matured: false,
    durationDays,
  };
}

/**
 * Calculate FD value at maturity
 */
export function calculateFDMaturityValue(fd: FixedDeposit): number {
  return Math.floor(fd.principal * (1 + fd.interestRate));
}

/**
 * Check if FD has matured
 */
export function isFDMatured(fd: FixedDeposit, currentDay: number): boolean {
  return currentDay >= fd.maturityDay;
}

/**
 * Update FD maturity status
 */
export function updateFDMaturityStatus(
  fds: FixedDeposit[],
  currentDay: number,
): FixedDeposit[] {
  return fds.map((fd) => ({
    ...fd,
    matured: isFDMatured(fd, currentDay),
  }));
}

/**
 * Withdraw FD (matured or early with penalty)
 */
export function withdrawFD(
  fd: FixedDeposit,
  currentDay: number,
): { amount: number; penalty: boolean } {
  const isMatured = isFDMatured(fd, currentDay);

  if (isMatured) {
    return {
      amount: calculateFDMaturityValue(fd),
      penalty: false,
    };
  }

  // Early withdrawal penalty: lose all interest + penalty percentage of principal
  const penaltyAmount = Math.floor(fd.principal * (1 - GAME_CONFIG.FD_EARLY_WITHDRAWAL_PENALTY));
  return {
    amount: penaltyAmount,
    penalty: true,
  };
}

/**
 * Get days until FD maturity
 */
export function getDaysUntilMaturity(
  fd: FixedDeposit,
  currentDay: number,
): number {
  return Math.max(0, fd.maturityDay - currentDay);
}

// ==================== SIP Functions ====================

/**
 * Create a new SIP
 */
export function createSIP(
  amount: number,
  intervalDays: number,
  currentDay: number,
): SIP | null {
  if (amount < GAME_CONFIG.SIP_MIN_AMOUNT) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    amount,
    intervalDays,
    startDay: currentDay,
    lastInvestmentDay: currentDay,
    totalInvested: amount, // First investment happens immediately
    currentValue: amount,
    growthRate: GAME_CONFIG.SIP_GROWTH_RATE,
    isActive: true,
  };
}

/**
 * Process SIP for a new day - check if investment is due
 */
export function processSIPForDay(
  sip: SIP,
  currentDay: number,
  walletBalance: number,
): { sip: SIP; amountDeducted: number; invested: boolean } {
  if (!sip.isActive) {
    return { sip, amountDeducted: 0, invested: false };
  }

  const daysSinceLastInvestment = currentDay - sip.lastInvestmentDay;
  
  // Check if it's time to invest
  if (daysSinceLastInvestment >= sip.intervalDays) {
    // Check if player has enough money
    if (walletBalance >= sip.amount) {
      // Apply growth to existing value first
      const growthPeriods = Math.floor(daysSinceLastInvestment / sip.intervalDays);
      let newValue = sip.currentValue;
      for (let i = 0; i < growthPeriods; i++) {
        newValue = Math.floor(newValue * (1 + sip.growthRate));
      }

      return {
        sip: {
          ...sip,
          lastInvestmentDay: currentDay,
          totalInvested: sip.totalInvested + sip.amount,
          currentValue: newValue + sip.amount,
        },
        amountDeducted: sip.amount,
        invested: true,
      };
    }
  }

  // Apply growth even if not investing
  return { sip, amountDeducted: 0, invested: false };
}

/**
 * Apply growth to all SIPs at day end
 */
export function applySIPGrowth(sips: SIP[], currentDay: number): SIP[] {
  return sips.map((sip) => {
    if (!sip.isActive) return sip;

    const daysSinceLastInvestment = currentDay - sip.lastInvestmentDay;
    
    // Apply growth proportionally
    if (daysSinceLastInvestment > 0 && daysSinceLastInvestment % sip.intervalDays === 0) {
      const newValue = Math.floor(sip.currentValue * (1 + sip.growthRate));
      return {
        ...sip,
        currentValue: newValue,
      };
    }

    return sip;
  });
}

/**
 * Cancel SIP and return current value
 */
export function cancelSIP(sip: SIP): { sip: SIP; returnAmount: number } {
  return {
    sip: {
      ...sip,
      isActive: false,
    },
    returnAmount: sip.currentValue,
  };
}

/**
 * Get SIP interval options
 */
export function getSIPIntervalOptions(): Array<{ days: number; label: string }> {
  return GAME_CONFIG.SIP_INTERVALS;
}
