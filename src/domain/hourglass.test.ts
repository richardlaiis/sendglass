import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bottomEmptyHeight,
  clamp01,
  EVENT_RESTING_PROGRESS,
  HOURGLASS,
  hourglassState,
  sandOffsets,
  sandOffsetsFor,
  topSandHeight,
} from "./hourglass";
import { HOUR, makeCapsule, T0 } from "./testUtils";

const H = HOURGLASS.chamberH;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("clamp01", () => {
  it("clamps to 0–1 and maps NaN to 0", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0.3)).toBe(0.3);
    expect(clamp01(1.5)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });
});

describe("topSandHeight", () => {
  it("is full at p = 0", () => {
    expect(topSandHeight(0)).toBe(H);
  });

  it("is H·√0.5 at p = 0.5 (half the area, not half the height)", () => {
    expect(topSandHeight(0.5)).toBeCloseTo(H * Math.SQRT1_2, 10);
  });

  it("is empty at p = 1", () => {
    expect(topSandHeight(1)).toBe(0);
  });

  it("clamps out-of-range values", () => {
    expect(topSandHeight(-1)).toBe(H);
    expect(topSandHeight(2)).toBe(0);
    expect(topSandHeight(Number.NaN)).toBe(H);
  });

  it("leaves area proportional to the remaining fraction", () => {
    for (const p of [0.1, 0.25, 0.62, 0.9]) {
      const h = topSandHeight(p);
      expect((h / H) ** 2).toBeCloseTo(1 - p, 10);
    }
  });
});

describe("bottomEmptyHeight", () => {
  it("is fully empty at p = 0", () => {
    expect(bottomEmptyHeight(0)).toBe(H);
  });

  it("is H·√0.5 at p = 0.5", () => {
    expect(bottomEmptyHeight(0.5)).toBeCloseTo(H * Math.SQRT1_2, 10);
  });

  it("has no empty space at p = 1", () => {
    expect(bottomEmptyHeight(1)).toBe(0);
  });

  it("clamps out-of-range values", () => {
    expect(bottomEmptyHeight(-3)).toBe(H);
    expect(bottomEmptyHeight(7)).toBe(0);
  });

  it("fills an area equal to the progress", () => {
    for (const p of [0.1, 0.5, 0.77]) {
      const empty = bottomEmptyHeight(p);
      expect(1 - (empty / H) ** 2).toBeCloseTo(p, 10);
    }
  });
});

describe("sandOffsets", () => {
  it("does not move anything at p = 0 except pushing the bottom sand out of view", () => {
    expect(sandOffsets(0)).toEqual({ top: 0, bottom: H });
  });

  it("moves the top sand fully down and the bottom sand to the neck at p = 1", () => {
    expect(sandOffsets(1)).toEqual({ top: H, bottom: 0 });
  });
});

describe("sandOffsetsFor", () => {
  it("follows progress when sealed", () => {
    expect(sandOffsetsFor("sealed", 0.5)).toEqual(sandOffsets(0.5));
    expect(sandOffsetsFor("sealed", null)).toEqual(sandOffsets(0));
  });

  it("puts all sand at the bottom when ready, whatever the progress", () => {
    expect(sandOffsetsFor("ready", 0.2)).toEqual({ top: H, bottom: 0 });
  });

  it("keeps event sand resting on top with an empty bottom", () => {
    expect(sandOffsetsFor("event", null)).toEqual({
      top: sandOffsets(EVENT_RESTING_PROGRESS).top,
      bottom: H,
    });
  });
});

describe("hourglassState", () => {
  const timed = makeCapsule({ type: "interval", durationMs: 4 * HOUR, at: T0 + 4 * HOUR });
  const event = makeCapsule({ type: "event", label: "exam" });

  it("is sealed before unlocking", () => {
    expect(hourglassState(timed, Date.now() + HOUR)).toBe("sealed");
  });

  it("is ready exactly at the unlock moment", () => {
    expect(hourglassState(timed, Date.now() + 4 * HOUR)).toBe("ready");
  });

  it("is event for an event capsule that hasn't happened", () => {
    expect(hourglassState(event, Date.now())).toBe("event");
  });

  it("is ready once the event happened", () => {
    const done = makeCapsule({ type: "event", label: "exam", doneAt: T0 + HOUR });
    expect(hourglassState(done, Date.now() + HOUR)).toBe("ready");
  });

  it("has no hourglass once opened", () => {
    const opened = { ...timed, openedAt: T0 + 5 * HOUR };
    expect(hourglassState(opened, Date.now() + 5 * HOUR)).toBeNull();
  });
});
