import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProgress, getRemainingMs, getStatus, getUnlockAt, toDisplayPercent } from "./status";
import { HOUR, T0, makeCapsule } from "./testUtils";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});
afterEach(() => {
  vi.useRealTimers();
});

const datetime = makeCapsule({ type: "datetime", at: T0 + 10 * HOUR });
const interval = makeCapsule({ type: "interval", durationMs: 4 * HOUR, at: T0 + 4 * HOUR });
const event = makeCapsule({ type: "event", label: "After my exam" });
const eventDone = makeCapsule({ type: "event", label: "After my exam", doneAt: T0 + HOUR });

describe("getUnlockAt", () => {
  it("returns `at` for datetime and interval capsules", () => {
    expect(getUnlockAt(datetime)).toBe(T0 + 10 * HOUR);
    expect(getUnlockAt(interval)).toBe(T0 + 4 * HOUR);
  });

  it("returns null for event capsules, done or not", () => {
    expect(getUnlockAt(event)).toBeNull();
    expect(getUnlockAt(eventDone)).toBeNull();
  });
});

describe("getStatus", () => {
  it("is sealed before the unlock moment", () => {
    expect(getStatus(datetime, T0 + 10 * HOUR - 1)).toBe("sealed");
  });

  it("is ready exactly at the unlock moment", () => {
    expect(getStatus(datetime, T0 + 10 * HOUR)).toBe("ready");
    expect(getStatus(interval, T0 + 4 * HOUR)).toBe("ready");
  });

  it("is ready after the unlock moment", () => {
    expect(getStatus(interval, T0 + 5 * HOUR)).toBe("ready");
  });

  it("is sealed when now is before createdAt (clock moved back)", () => {
    expect(getStatus(datetime, T0 - HOUR)).toBe("sealed");
  });

  it("keeps event capsules sealed regardless of time until doneAt is set", () => {
    expect(getStatus(event, T0 + 1000 * HOUR)).toBe("sealed");
    expect(getStatus(eventDone, T0)).toBe("ready");
  });

  it("is opened once openedAt is set, even if the unlock time hasn't come", () => {
    const early = { ...datetime, openedAt: T0 + HOUR, openedEarly: true };
    expect(getStatus(early, T0 + 2 * HOUR)).toBe("opened");
    expect(getStatus({ ...event, openedAt: T0 }, T0)).toBe("opened");
  });
});

describe("getProgress", () => {
  it("is 0 at creation and proportional while waiting", () => {
    expect(getProgress(datetime, T0)).toBe(0);
    expect(getProgress(datetime, T0 + 2.5 * HOUR)).toBe(0.25);
    expect(getProgress(interval, T0 + 3 * HOUR)).toBe(0.75);
  });

  it("is exactly 1 at the unlock moment and stays clamped after", () => {
    expect(getProgress(datetime, T0 + 10 * HOUR)).toBe(1);
    expect(getProgress(datetime, T0 + 99 * HOUR)).toBe(1);
  });

  it("clamps to 0 when now is before createdAt", () => {
    expect(getProgress(datetime, T0 - 5 * HOUR)).toBe(0);
  });

  it("is null for event capsules", () => {
    expect(getProgress(event, T0 + HOUR)).toBeNull();
    expect(getProgress(eventDone, T0 + HOUR)).toBeNull();
  });

  it("is 1 for opened capsules", () => {
    expect(getProgress({ ...datetime, openedAt: T0 + HOUR }, T0 + HOUR)).toBe(1);
  });

  it("is 1 when the unlock moment is not after createdAt (bad data)", () => {
    const broken = makeCapsule({ type: "datetime", at: T0 - HOUR });
    expect(getProgress(broken, T0)).toBe(1);
  });
});

describe("getRemainingMs", () => {
  it("counts down to the unlock moment", () => {
    expect(getRemainingMs(datetime, T0)).toBe(10 * HOUR);
    expect(getRemainingMs(datetime, T0 + 9 * HOUR)).toBe(HOUR);
  });

  it("is 0 exactly at and after the unlock moment", () => {
    expect(getRemainingMs(interval, T0 + 4 * HOUR)).toBe(0);
    expect(getRemainingMs(interval, T0 + 8 * HOUR)).toBe(0);
  });

  it("includes the extra time when now is before createdAt", () => {
    expect(getRemainingMs(datetime, T0 - HOUR)).toBe(11 * HOUR);
  });

  it("is null for event capsules", () => {
    expect(getRemainingMs(event, T0)).toBeNull();
  });

  it("is 0 for opened capsules", () => {
    expect(getRemainingMs({ ...datetime, openedAt: T0 + HOUR }, T0 + HOUR)).toBe(0);
  });
});

describe("toDisplayPercent", () => {
  it("keeps one decimal and rounds down", () => {
    expect(toDisplayPercent(0.62449)).toBe(62.4);
    expect(toDisplayPercent(0)).toBe(0);
    expect(toDisplayPercent(1)).toBe(100);
  });

  it("never shows 100 before the capsule is fully done", () => {
    expect(toDisplayPercent(0.99999)).toBe(99.9);
  });
});
