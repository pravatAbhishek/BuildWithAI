import { SIMPLE_EVENTS } from "./constants";
import type { PendingEvent, SimpleEvent } from "@/types/game";

const FESTIVAL_SAFE_SAVINGS_THRESHOLD = 120;

const SIMPLE_EVENTS_BY_ID = new Map(SIMPLE_EVENTS.map((event) => [event.id, event]));

export function getSimpleEventForDay(day: number): SimpleEvent {
  const index = ((Math.max(1, day) - 1) % SIMPLE_EVENTS.length + SIMPLE_EVENTS.length) % SIMPLE_EVENTS.length;
  return SIMPLE_EVENTS[index];
}

export function getSimpleEventById(eventId: string): SimpleEvent | null {
  return SIMPLE_EVENTS_BY_ID.get(eventId) || null;
}

export function queueEventConsequences(eventId: string, currentDay: number): PendingEvent[] {
  switch (eventId) {
    case "bike-offer":
      return [
        {
          id: crypto.randomUUID(),
          eventId: "bike-maintenance",
          executeOnDay: currentDay + 4,
          reason: "Bike repair due",
          type: "wallet-delta",
          amount: -120,
        },
      ];
    case "scooter-offer":
      return [
        {
          id: crypto.randomUUID(),
          eventId: "scooter-repair",
          executeOnDay: currentDay + 3,
          reason: "Scooter repair due",
          type: "wallet-delta",
          amount: -90,
        },
      ];
    case "festival-gift-offer":
      return [
        {
          id: crypto.randomUUID(),
          eventId: "festival-reward",
          executeOnDay: currentDay + 1,
          reason: "Festival cashback",
          type: "wallet-delta",
          amount: 60,
        },
        {
          id: crypto.randomUUID(),
          eventId: "festival-health-check",
          executeOnDay: currentDay + 1,
          reason: "Savings buffer check",
          type: "tree-health-check",
          amount: -10,
        },
      ];
    case "delay-bill-offer":
      return [
        {
          id: crypto.randomUUID(),
          eventId: "delayed-bill-charge",
          executeOnDay: currentDay + 5,
          reason: "Delayed bill with 30% extra",
          type: "wallet-delta",
          amount: -130,
        },
      ];
    case "emergency-friend-help":
      return [
        {
          id: crypto.randomUUID(),
          eventId: "friend-return",
          executeOnDay: currentDay + 4,
          reason: "Friend repayment",
          type: "friend-help-return",
          successAmount: 110,
          failureAmount: 40,
          successChance: 0.6,
        },
      ];
    case "car-offer":
      return [
        {
          id: crypto.randomUUID(),
          eventId: "car-heavy-maintenance",
          executeOnDay: currentDay + 4,
          reason: "Car heavy maintenance",
          type: "wallet-delta",
          amount: -250,
        },
      ];
    default:
      return [];
  }
}

export function resolvePendingConsequences(
  currentDay: number,
  pendingEvents: PendingEvent[],
  savingsBalance: number,
): {
  walletDelta: number;
  treeHealthDelta: number;
  logs: string[];
  remaining: PendingEvent[];
} {
  const due = pendingEvents.filter((item) => item.executeOnDay <= currentDay);
  const remaining = pendingEvents.filter((item) => item.executeOnDay > currentDay);

  let walletDelta = 0;
  let treeHealthDelta = 0;
  const logs: string[] = [];

  for (const event of due) {
    if (event.type === "wallet-delta") {
      const amount = event.amount || 0;
      walletDelta += amount;
      logs.push(`${event.reason || event.eventId}: ${amount >= 0 ? "+" : ""}₹${amount}`);
      continue;
    }

    if (event.type === "tree-health-check") {
      if (savingsBalance < FESTIVAL_SAFE_SAVINGS_THRESHOLD) {
        treeHealthDelta += event.amount || 0;
        logs.push("Festival cash pressure: Tree health -10");
      } else {
        logs.push("Festival handled safely: no tree health penalty");
      }
      continue;
    }

    if (event.type === "friend-help-return") {
      const successChance = event.successChance ?? 0.6;
      const success = Math.random() < successChance;
      const amount = success ? event.successAmount ?? 110 : event.failureAmount ?? 40;
      walletDelta += amount;
      logs.push(
        success
          ? `Friend repaid fully: +₹${amount}`
          : `Friend repaid partially: +₹${amount}`,
      );
    }
  }

  return {
    walletDelta,
    treeHealthDelta,
    logs,
    remaining,
  };
}
