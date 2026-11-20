export type DurationUnit = "day" | "hour" | "minute" | "second";

export interface DurationPart {
  unit: DurationUnit;
  value: number;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Splits a duration into its two most significant units for display:
 * - 1 day or more  → days + hours      ("3d 4h")
 * - 1 hour or more → hours + minutes   ("5h 12m")
 * - 1 minute or more → minutes + seconds ("12m 5s")  — seconds only show under 1 hour
 * - under 1 minute → seconds           ("42s")
 *
 * Use `"ceil"` for countdowns (so it never shows 0s while still waiting)
 * and `"floor"` for elapsed time. Negative input is treated as 0.
 */
export function durationParts(ms: number, rounding: "ceil" | "floor"): DurationPart[] {
  const round = rounding === "ceil" ? Math.ceil : Math.floor;
  const totalSeconds = round(Math.max(0, ms) / SECOND);
  const total = totalSeconds * SECOND;

  const days = Math.floor(total / DAY);
  const hours = Math.floor((total % DAY) / HOUR);
  const minutes = Math.floor((total % HOUR) / MINUTE);
  const seconds = Math.floor((total % MINUTE) / SECOND);

  if (days > 0) return [part("day", days), part("hour", hours)];
  if (hours > 0) return [part("hour", hours), part("minute", minutes)];
  if (minutes > 0) return [part("minute", minutes), part("second", seconds)];
  return [part("second", seconds)];
}

function part(unit: DurationUnit, value: number): DurationPart {
  return { unit, value };
}

/**
 * The largest whole unit in a duration: 2d 5h → { day, 2 }, 59s → { second, 59 }.
 * Used for relative times ("3 days ago") and the "opened 2 days early" badge.
 */
export function largestUnit(ms: number): DurationPart {
  const abs = Math.max(0, ms);
  if (abs >= DAY) return part("day", Math.floor(abs / DAY));
  if (abs >= HOUR) return part("hour", Math.floor(abs / HOUR));
  if (abs >= MINUTE) return part("minute", Math.floor(abs / MINUTE));
  return part("second", Math.floor(abs / SECOND));
}
