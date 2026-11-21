import { describe, expect, it } from "vitest";
import { hashString, mulberry32, seededRandom } from "./random";

describe("hashString", () => {
  it("matches known FNV-1a values", () => {
    expect(hashString("")).toBe(0x811c9dc5);
    expect(hashString("a")).toBe(0xe40c292c);
  });

  it("differs for different strings", () => {
    expect(hashString("capsule-1")).not.toBe(hashString("capsule-2"));
  });
});

describe("mulberry32", () => {
  it("returns numbers in [0, 1)", () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const x = rand();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("is deterministic for a seed", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("seededRandom", () => {
  it("gives the same sequence for the same string and a different one otherwise", () => {
    const seq = (s: string) => {
      const r = seededRandom(s);
      return [r(), r(), r(), r()];
    };
    expect(seq("abc")).toEqual(seq("abc"));
    expect(seq("abc")).not.toEqual(seq("abd"));
  });
});
