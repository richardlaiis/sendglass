import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calendarDaysBetween, getDayLabel } from "./dayLabel";

// Local-time constructors keep these tests independent of the machine's time zone.
const local = (d: number, h: number, m = 0) => new Date(2026, 0, d, h, m).getTime();
const NOW = local(10, 14); // Sat 2026-01-10 14:00

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("getDayLabel", () => {
  it("says today before 18:00 and tonight from 18:00 on the same day", () => {
    expect(getDayLabel(local(10, 17, 59), NOW)).toBe("today");
    expect(getDayLabel(local(10, 18), NOW)).toBe("tonight");
    expect(getDayLabel(local(10, 23, 59), NOW)).toBe("tonight");
  });

  it("says tomorrow for any time on the next calendar day", () => {
    expect(getDayLabel(local(11, 0), NOW)).toBe("tomorrow");
    expect(getDayLabel(local(11, 23, 59), NOW)).toBe("tomorrow");
  });

  it("uses the weekday within the next 6 days and a date after that", () => {
    expect(getDayLabel(local(12, 8), NOW)).toBe("weekday");
    expect(getDayLabel(local(16, 8), NOW)).toBe("weekday");
    expect(getDayLabel(local(17, 8), NOW)).toBe("date");
  });

  it("uses a date for earlier days", () => {
    expect(getDayLabel(local(9, 8), NOW)).toBe("date");
  });
});

describe("calendarDaysBetween", () => {
  it("counts calendar days, not 24h blocks", () => {
    expect(calendarDaysBetween(local(10, 23, 59), local(11, 0, 1))).toBe(1);
    expect(calendarDaysBetween(local(10, 0), local(10, 23))).toBe(0);
    expect(calendarDaysBetween(local(12, 0), local(10, 0))).toBe(-2);
  });

  it("crosses month boundaries", () => {
    expect(calendarDaysBetween(local(31, 12), new Date(2026, 1, 1, 12).getTime())).toBe(1);
  });
});
