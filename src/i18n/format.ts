import type { TFunction } from "i18next";
import { getDayLabel } from "../domain/dayLabel";
import { durationParts, largestUnit } from "../domain/duration";

/** "5h 12m" / "5 小時 12 分". */
export function formatDuration(t: TFunction, ms: number, rounding: "ceil" | "floor"): string {
  return durationParts(ms, rounding)
    .map((p) => t(`duration.${p.unit}`, { count: p.value }))
    .join(t("duration.separator"));
}

/** "21:00" in both locales (24-hour, as in the spec examples). */
export function formatTime(locale: string, ms: number): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(ms);
}

/** "Opens tonight 21:00" / "今晚 21:00 開啟". */
export function formatUnlockMoment(t: TFunction, locale: string, at: number, now: number): string {
  const time = formatTime(locale, at);
  const kind = getDayLabel(at, now);
  switch (kind) {
    case "weekday":
      return t("unlockAt.weekday", {
        weekday: new Intl.DateTimeFormat(locale, { weekday: "long" }).format(at),
        time,
      });
    case "date":
      return t("unlockAt.date", {
        date: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(at),
        time,
      });
    default:
      return t(`unlockAt.${kind}`, { time });
  }
}

/** "Jan 10, 2026, 14:00" in the active locale. */
export function formatDateTime(locale: string, ms: number): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(ms);
}

/** "62.4%". */
export function formatPercent(locale: string, percent: number): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(percent / 100);
}

/** "3 days ago" / "3 天前", "yesterday" / "昨天" — largest whole unit, via Intl.RelativeTimeFormat. */
export function formatRelativePast(locale: string, ms: number): string {
  const { unit, value } = largestUnit(ms);
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-value, unit);
}

/** "Opened 2 days early 😬" / "提早 2 天打開 😬". */
export function formatOpenedEarly(t: TFunction, earlyByMs: number): string {
  const { unit, value } = largestUnit(earlyByMs);
  return t(`early.${unit}`, { count: Math.max(1, value) });
}
