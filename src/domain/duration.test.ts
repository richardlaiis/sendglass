import { describe, expect, it } from "vitest";
import { durationParts, largestUnit } from "./duration";
import { DAY, HOUR, MIN } from "./testUtils";

const S = 1000;

describe("durationParts", () => {
  it("shows days + hours when at least a day", () => {
    expect(durationParts(3 * DAY + 4 * HOUR + 5 * MIN, "floor")).toEqual([
      { unit: "day", value: 3 },
      { unit: "hour", value: 4 },
    ]);
  });

  it("shows hours + minutes when at least an hour", () => {
    expect(durationParts(5 * HOUR + 12 * MIN + 30 * S, "floor")).toEqual([
      { unit: "hour", value: 5 },
      { unit: "minute", value: 12 },
    ]);
  });

  it("shows minutes + seconds under an hour", () => {
    expect(durationParts(12 * MIN + 5 * S, "floor")).toEqual([
      { unit: "minute", value: 12 },
      { unit: "second", value: 5 },
    ]);
  });

  it("shows only seconds under a minute", () => {
    expect(durationParts(42 * S, "floor")).toEqual([{ unit: "second", value: 42 }]);
  });

  it("rounds up for countdowns so it never shows 0s while time remains", () => {
    expect(durationParts(1, "ceil")).toEqual([{ unit: "second", value: 1 }]);
    expect(durationParts(59 * MIN + 59 * S + 1, "ceil")).toEqual([
      { unit: "hour", value: 1 },
      { unit: "minute", value: 0 },
    ]);
  });

  it("rounds down for elapsed time", () => {
    expect(durationParts(999, "floor")).toEqual([{ unit: "second", value: 0 }]);
  });

  it("treats negative durations as zero", () => {
    expect(durationParts(-5 * MIN, "ceil")).toEqual([{ unit: "second", value: 0 }]);
  });
});

describe("largestUnit", () => {
  it("picks the largest whole unit", () => {
    expect(largestUnit(2 * DAY + 5 * HOUR)).toEqual({ unit: "day", value: 2 });
    expect(largestUnit(DAY - 1)).toEqual({ unit: "hour", value: 23 });
    expect(largestUnit(90 * MIN)).toEqual({ unit: "hour", value: 1 });
    expect(largestUnit(59 * S)).toEqual({ unit: "second", value: 59 });
  });

  it("treats negative durations as zero seconds", () => {
    expect(largestUnit(-HOUR)).toEqual({ unit: "second", value: 0 });
  });
});
