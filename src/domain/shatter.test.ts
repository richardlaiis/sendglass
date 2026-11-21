import { describe, expect, it } from "vitest";
import { HOURGLASS } from "./hourglass";
import { pixelGrid } from "./assemble";
import {
  MAX_CRACKS,
  MAX_PIXEL_DELAY_MS,
  MIN_CRACKS,
  planShatter,
  SHARD_POLYGONS,
  shardAt,
} from "./shatter";

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

  it("breaks every shard a little away from the middle of the glass", () => {
    const { shards } = planShatter("outward");
    expect(shards).toHaveLength(SHARD_POLYGONS.length);
    for (const s of shards) {
      const fromCenterX = s.origin.x - HOURGLASS.cx;
      if (Math.abs(fromCenterX) > 5) expect(Math.sign(s.dx)).toBe(Math.sign(fromCenterX));
      expect(Math.hypot(s.dx, s.dy)).toBeLessThanOrEqual(14 + 1e-9);
      expect(Math.abs(s.rotate)).toBeGreaterThanOrEqual(4);
      expect(Math.abs(s.rotate)).toBeLessThanOrEqual(12);
    }
  });

  it("turns the whole hourglass into pixels, each in the shard that covers it", () => {
    const { pixels } = planShatter("pixels");
    expect(pixels).toHaveLength(pixelGrid().length);
    for (const p of pixels) {
      expect(p.shard).toBe(shardAt(p.x + p.size / 2, p.y + p.size / 2));
      expect(p.delay).toBeGreaterThanOrEqual(0);
      expect(p.delay).toBeLessThanOrEqual(MAX_PIXEL_DELAY_MS);
    }
    // Every shard that covers part of the glass gets pixels.
    expect(new Set(pixels.map((p) => p.shard)).size).toBeGreaterThan(8);
  });

  it("scatters glass pixels outward and lets sand pixels fall", () => {
    const { pixels } = planShatter("scatter");
    for (const p of pixels) {
      if (p.kind === "sand") {
        expect(p.dy).toBeGreaterThanOrEqual(40);
        expect(Math.abs(p.dx)).toBeLessThanOrEqual(12);
      } else {
        const fromCenter = { x: p.x + p.size / 2 - HOURGLASS.cx, y: p.y + p.size / 2 - 100 };
        // Within ±0.6 rad of straight out, so always moving away from the middle.
        expect(fromCenter.x * p.dx + fromCenter.y * p.dy).toBeGreaterThan(0);
      }
    }
  });
});

describe("shardAt", () => {
  it("finds the shard around each hub", () => {
    expect(shardAt(58, 50)).toBeLessThan(6); // top fan
    expect(shardAt(63, 150)).toBeGreaterThanOrEqual(6); // bottom fan
  });
});
