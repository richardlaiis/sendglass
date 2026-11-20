import { describe, expect, it } from "vitest";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "./datetimeLocal";

describe("datetime-local conversion", () => {
  it("formats local time with zero padding", () => {
    expect(toDateTimeLocalValue(new Date(2026, 0, 5, 8, 3).getTime())).toBe("2026-01-05T08:03");
  });

  it("parses back to the same local instant", () => {
    const ms = new Date(2026, 10, 20, 21, 0).getTime();
    expect(fromDateTimeLocalValue(toDateTimeLocalValue(ms))).toBe(ms);
  });

  it("drops seconds when formatting", () => {
    const ms = new Date(2026, 0, 5, 8, 3, 45).getTime();
    expect(toDateTimeLocalValue(ms)).toBe("2026-01-05T08:03");
  });

  it("returns null for empty, malformed or impossible dates", () => {
    expect(fromDateTimeLocalValue("")).toBeNull();
    expect(fromDateTimeLocalValue("2026-01-05")).toBeNull();
    expect(fromDateTimeLocalValue("2026-02-31T10:00")).toBeNull();
  });
});
