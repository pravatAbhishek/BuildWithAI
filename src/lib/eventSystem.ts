import { EVENT_TEMPLATES, GAME_CONFIG } from "./constants";
import type { Event, GameState, PendingEvent } from "@/types/game";

function getRiskLevel(riskMeter: number) {
  if (riskMeter >= 70) return "high";
  if (riskMeter >= 35) return "medium";
  return "low";
}

export function generateDailyEvents(state: Pick<GameState, "currentDay" | "riskMeter" | "savings">): Event[] {
  const day = state.currentDay;
  const riskLevel = getRiskLevel(state.riskMeter);
  const candidates = EVENT_TEMPLATES.filter((event) => {
    const minDayOk = event.minDay === undefined || day >= event.minDay;
    const maxDayOk = event.maxDay === undefined || day <= event.maxDay;
    return minDayOk && maxDayOk && event.probability > 0;
  });

  const extraTemptation = state.savings.balance > GAME_CONFIG.TEMPTATION_SAVINGS_THRESHOLD;
  const picks: Event[] = [];
  const targetCount = Math.max(1, Math.min(GAME_CONFIG.MAX_EVENTS_PER_DAY, riskLevel === "high" ? 3 : 2));

  const weighted = candidates.flatMap((event) => {
    const scale = event.type === "temptation" && extraTemptation ? 2 : 1;
    const slots = Math.max(1, Math.round(event.probability * 10) * scale);
    return Array.from({ length: slots }, () => event);
  });

  while (picks.length < targetCount && weighted.length > 0) {
    const next = weighted[Math.floor(Math.random() * weighted.length)];
    if (!picks.find((item) => item.id === next.id)) picks.push(next);
  }

  return picks;
}

export function triggerEvent(type: Event["type"]): Event | null {
  const matches = EVENT_TEMPLATES.filter((event) => event.type === type);
  if (matches.length === 0) return null;
  return matches[Math.floor(Math.random() * matches.length)];
}

export function resolvePendingEvents(
  currentDay: number,
  pendingEvents: PendingEvent[],
): { dueEvents: Event[]; remaining: PendingEvent[] } {
  const due = pendingEvents.filter((item) => item.executeOnDay <= currentDay);
  const remaining = pendingEvents.filter((item) => item.executeOnDay > currentDay);
  const dueEvents = due
    .map((item) => EVENT_TEMPLATES.find((event) => event.id === item.eventId))
    .filter((event): event is Event => Boolean(event));

  return { dueEvents, remaining };
}
