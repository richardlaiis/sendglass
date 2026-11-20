import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MIN_UNLOCK_MS } from "./config";
import { INTERVAL_CHIPS, getDatetimeChips } from "./quickChips";
import { DAY, HOUR } from "./testUtils";

// Local-time constructors keep these tests independent of the machine's time zone.
// January 2026: Mon 5, Tue 6, ... Fri 9, Sat 10, Sun 11.
const local = (d: number, h: number, m = 0) => new Date(2026, 0, d, h, m).getTime();

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function chipsAt(now: number) {
  vi.setSystemTime(now);
  return Object.fromEntries(getDatetimeChips(now).map((c) => [c.id, c.at]));
}

describe("getDatetimeChips", () => {
  it("offers tonight, tomorrow and Saturday on a weekday afternoon", () => {
    expect(chipsAt(local(7, 14))).toEqual({
      tonight: local(7, 21),
      tomorrow: local(8, 8),
      weekend: local(10, 10),
    });
  });

  it("hides tonight once 21:00 has passed or is under the minimum delay away", () => {
    expect(chipsAt(local(7, 21, 5))).not.toHaveProperty("tonight");
    expect(chipsAt(local(7, 21) - MIN_UNLOCK_MS + 1)).not.toHaveProperty("tonight");
    expect(chipsAt(local(7, 21) - MIN_UNLOCK_MS)).toHaveProperty("tonight", local(7, 21));
  });

  it("on Friday night, tomorrow and the weekend chip are both Saturday", () => {
    expect(chipsAt(local(9, 22))).toEqual({ tomorrow: local(10, 8), weekend: local(10, 10) });
  });

  it("on Saturday morning, the weekend chip is today 10:00", () => {
    expect(chipsAt(local(10, 9))).toEqual({
      tonight: local(10, 21),
      tomorrow: local(11, 8),
      weekend: local(10, 10),
    });
  });

  it("hides the weekend chip on Saturday after 10:00 and all of Sunday", () => {
    expect(chipsAt(local(10, 10, 30))).not.toHaveProperty("weekend");
    expect(chipsAt(local(11, 9))).not.toHaveProperty("weekend");
  });

  it("always offers tomorrow, even just before midnight", () => {
    expect(chipsAt(local(7, 23, 59))).toEqual({ tomorrow: local(8, 8), weekend: local(10, 10) });
  });
});

describe("INTERVAL_CHIPS", () => {
  it("are 1h, 6h, 1d, 3d, 1w in order", () => {
    expect(INTERVAL_CHIPS.map((c) => c.durationMs)).toEqual([
      HOUR,
      6 * HOUR,
      DAY,
      3 * DAY,
      7 * DAY,
    ]);
    expect(new Set(INTERVAL_CHIPS.map((c) => c.id)).size).toBe(INTERVAL_CHIPS.length);
  });
});
