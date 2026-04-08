// Banking logic for savings and fixed deposits

import { GAME_CONFIG } from "./constants";
import type { SavingsAccount, FixedDeposit } from "@/types/game";

/**
 * Create initial savings account
 */
export function createInitialSavings(): SavingsAccount {
  return {
    balance: 0,
    interestRate: GAME_CONFIG.SAVINGS_INTEREST_RATE,
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
 * Create a new fixed deposit
 */
export function createFixedDeposit(
  principal: number,
  currentDay: number,
  lockDays: number = GAME_CONFIG.FD_LOCK_DAYS,
): FixedDeposit | null {
  if (principal < GAME_CONFIG.FD_MINIMUM_AMOUNT) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    principal,
    interestRate: GAME_CONFIG.FD_INTEREST_RATE,
    startDay: currentDay,
    maturityDay: currentDay + lockDays,
    matured: false,
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
 * Withdraw matured FD
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

  // Early withdrawal penalty: lose all interest + 10% principal
  const penaltyAmount = Math.floor(fd.principal * 0.9);
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
