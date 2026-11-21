import { describe, expect, it } from "vitest";
import { HOURGLASS } from "./hourglass";
import { MAX_CRACKS, MIN_CRACKS, planShatter, SAND_DOTS, SHARD_POLYGONS } from "./shatter";

function area(poly: readonly (readonly [number, number])[]): number {
  let sum = 0;
  poly.forEach(([x1, y1], i) => {
    const [x2, y2] = poly[(i + 1) % poly.length] as readonly [number, number];
    sum += x1 * y2 - x2 * y1;
  });
  return Math.abs(sum) / 2;
}

describe("SHARD_POLYGONS", () => {
  it("has about ten shards", () => {
    expect(SHARD_POLYGONS.length).toBeGreaterThanOrEqual(8);
    expect(SHARD_POLYGONS.length).toBeLessThanOrEqual(14);
  });

  it("tiles the glass area exactly (areas add up to the covering rectangle)", () => {
    const total = SHARD_POLYGONS.reduce((s, p) => s + area(p), 0);
    expect(total).toBeCloseTo((112 - 8) * (192 - 8), 6);
  });
});

describe("planShatter", () => {
  it("is the same for the same capsule id", () => {
    expect(planShatter("capsule-a")).toEqual(planShatter("capsule-a"));
  });

  it("differs between capsules", () => {
    expect(planShatter("capsule-a")).not.toEqual(planShatter("capsule-b"));
  });

  it("draws 3–5 distinct cracks, staggered", () => {
    for (const id of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      const { cracks } = planShatter(id);
      expect(cracks.length).toBeGreaterThanOrEqual(MIN_CRACKS);
      expect(cracks.length).toBeLessThanOrEqual(MAX_CRACKS);
      expect(new Set(cracks.map((c) => c.d)).size).toBe(cracks.length);
      cracks.forEach((c) => expect(c.d).toMatch(/^M[\d.]+ [\d.]+( L[\d.]+ [\d.]+)+$/));
    }
  });

  it("sends every shard outward from the middle of the glass", () => {
    const { shards } = planShatter("outward");
    expect(shards).toHaveLength(SHARD_POLYGONS.length);
    for (const s of shards) {
      const fromCenterX = s.origin.x - HOURGLASS.cx;
      if (Math.abs(fromCenterX) > 5) expect(Math.sign(s.dx)).toBe(Math.sign(fromCenterX));
      expect(Math.abs(s.rotate)).toBeGreaterThanOrEqual(30);
      expect(Math.abs(s.rotate)).toBeLessThanOrEqual(160);
      expect(s.delay).toBeGreaterThanOrEqual(0);
      expect(s.delay).toBeLessThanOrEqual(120);
    }
  });

  it("starts the sand dots inside the bottom chamber and lets them fall", () => {
    const { dots } = planShatter("sand");
    expect(dots).toHaveLength(SAND_DOTS);
    const { cx, bottomTipY, chamberH, chamberHalfBase } = HOURGLASS;
    for (const d of dots) {
      expect(d.cy).toBeGreaterThanOrEqual(bottomTipY);
      expect(d.cy).toBeLessThanOrEqual(bottomTipY + chamberH);
      const halfWidthHere = (chamberHalfBase * (d.cy - bottomTipY)) / chamberH;
      expect(Math.abs(d.cx - cx)).toBeLessThanOrEqual(halfWidthHere + 1e-9);
      expect(d.dy).toBeGreaterThan(0);
    }
  });
});
