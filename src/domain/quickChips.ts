import { MIN_UNLOCK_MS } from "./config";

export type DatetimeChipId = "tonight" | "tomorrow" | "weekend";

export interface DatetimeChip {
  id: DatetimeChipId;
  at: number;
}

/** Local hour:minute of each datetime chip (SPEC §4.1). */
export const DATETIME_CHIP_TIMES = {
  tonight: { hour: 21, minute: 0 },
  tomorrow: { hour: 8, minute: 0 },
  weekend: { hour: 10, minute: 0 }, // Saturday
} as const;

const SATURDAY = 6;
const SUNDAY = 0;

/**
 * Datetime quick chips for "now", in local time:
 * - tonight: today 21:00
 * - tomorrow: tomorrow 08:00
 * - weekend: this week's Saturday 10:00 (none on Sunday — this weekend's Saturday is over)
 * A chip is hidden once its time has passed or is closer than the minimum unlock delay.
 */
export function getDatetimeChips(now: number): DatetimeChip[] {
  const d = new Date(now);
  const at = (dayOffset: number, { hour, minute }: { hour: number; minute: number }) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + dayOffset, hour, minute).getTime();

  const chips: DatetimeChip[] = [
    { id: "tonight", at: at(0, DATETIME_CHIP_TIMES.tonight) },
    { id: "tomorrow", at: at(1, DATETIME_CHIP_TIMES.tomorrow) },
  ];
  const day = d.getDay();
  if (day !== SUNDAY) {
    chips.push({ id: "weekend", at: at(SATURDAY - day, DATETIME_CHIP_TIMES.weekend) });
  }
  return chips.filter((c) => c.at - now >= MIN_UNLOCK_MS);
}

export type IntervalChipUnit = "hour" | "day" | "week";

export interface IntervalChip {
  id: string;
  unit: IntervalChipUnit;
  value: number;
  durationMs: number;
}

const HOUR = 3_600_000;
const UNIT_MS: Record<IntervalChipUnit, number> = { hour: HOUR, day: 24 * HOUR, week: 168 * HOUR };

const chip = (unit: IntervalChipUnit, value: number): IntervalChip => ({
  id: `${value}${unit}`,
  unit,
  value,
  durationMs: value * UNIT_MS[unit],
});

/** Interval quick chips (SPEC §4.2). "Custom" is a UI option, not a chip here. */
export const INTERVAL_CHIPS: readonly IntervalChip[] = [
  chip("hour", 1),
  chip("hour", 6),
  chip("day", 1),
  chip("day", 3),
  chip("week", 1),
];
