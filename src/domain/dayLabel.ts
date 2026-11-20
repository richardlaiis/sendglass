/** Hour (local) from which "today" is called "tonight". */
export const TONIGHT_FROM_HOUR = 18;

export type DayLabel = "today" | "tonight" | "tomorrow" | "weekday" | "date";

/**
 * How to describe a future moment relative to now, in local time:
 * today / tonight (same day, from 18:00) / tomorrow / weekday (within the next 6 days) / date.
 * Past moments on earlier days get "date".
 */
export function getDayLabel(at: number, now: number): DayLabel {
  const days = calendarDaysBetween(now, at);
  if (days === 0) return new Date(at).getHours() >= TONIGHT_FROM_HOUR ? "tonight" : "today";
  if (days === 1) return "tomorrow";
  if (days > 1 && days < 7) return "weekday";
  return "date";
}

/** Whole local calendar days from `from` to `to` (DST-safe). */
export function calendarDaysBetween(from: number, to: number): number {
  const a = new Date(from);
  const b = new Date(to);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}
