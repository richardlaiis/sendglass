import { describe, expect, it } from "vitest";
import { classify, MAX_DELAY_MS, planAssembly } from "./assemble";

describe("classify", () => {
  it("puts sand in the bottom chamber only", () => {
    expect(classify([60, 160])).toBe("sand");
    expect(classify([60, 60])).toBeNull(); // empty top chamber
  });

  it("marks the outline and the caps as glass", () => {
    expect(classify([60, 20])).toBe("glass"); // top edge
    expect(classify([60, 14])).toBe("glass"); // top cap
    expect(classify([60, 185])).toBe("glass"); // bottom cap
    expect(classify([60, 100])).toBe("glass"); // neck
  });

  it("ignores the space outside the glass", () => {
    expect(classify([10, 100])).toBeNull();
    expect(classify([110, 60])).toBeNull();
  });
});

describe("planAssembly", () => {
  it("is the same for the same seed and differs otherwise", () => {
    expect(planAssembly("a")).toEqual(planAssembly("a"));
    expect(planAssembly("a")).not.toEqual(planAssembly("b"));
  });

  it("has a few hundred pixels of both kinds, all inside the hourglass area", () => {
    const pixels = planAssembly("seed");
    expect(pixels.length).toBeGreaterThan(150);
    expect(pixels.length).toBeLessThan(500);
    expect(pixels.some((p) => p.kind === "glass")).toBe(true);
    expect(pixels.some((p) => p.kind === "sand")).toBe(true);
    for (const p of pixels) {
      expect(p.x).toBeGreaterThanOrEqual(8);
      expect(p.x + p.size).toBeLessThanOrEqual(112);
      expect(p.y).toBeGreaterThanOrEqual(8);
      expect(p.y + p.size).toBeLessThanOrEqual(192);
      expect(p.delay).toBeGreaterThanOrEqual(0);
      expect(p.delay).toBeLessThanOrEqual(MAX_DELAY_MS);
      expect(Math.hypot(p.fromX, p.fromY)).toBeGreaterThanOrEqual(40 - 1e-9);
    }
  });
});
