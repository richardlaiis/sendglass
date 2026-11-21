import { HOURGLASS } from "./hourglass";
import { seededRandom } from "./random";

/**
 * The shatter reveal (SPEC §6.4) as data: which cracks appear, how each glass
 * shard flies and how the sand spills. Seeded from the capsule id, so the same
 * capsule always shatters the same way. Coordinates are in the hourglass viewBox.
 */

type Pt = readonly [number, number];

// Corners and edge points of the area the glass covers, plus three hubs the
// shards fan out from: one in each chamber and one at the neck.
const A: Pt = [8, 8];
const B: Pt = [46, 8];
const C: Pt = [84, 8];
const D: Pt = [112, 8];
const E: Pt = [112, 46];
const F: Pt = [112, 100];
const G: Pt = [112, 150];
const H: Pt = [112, 192];
const I: Pt = [76, 192];
const J: Pt = [40, 192];
const K: Pt = [8, 192];
const L: Pt = [8, 154];
const M: Pt = [8, 100];
const N: Pt = [8, 52];
const TOP_HUB: Pt = [58, 58];
const NECK: Pt = [60, 100];
const BOTTOM_HUB: Pt = [63, 142];

/** Hand-made shards. Together they tile the rectangle (8,8)–(112,192) exactly. */
export const SHARD_POLYGONS: readonly (readonly Pt[])[] = [
  [TOP_HUB, A, B],
  [TOP_HUB, B, C],
  [TOP_HUB, C, D, E],
  [TOP_HUB, E, F, NECK],
  [TOP_HUB, NECK, M, N],
  [TOP_HUB, N, A],
  [BOTTOM_HUB, NECK, F, G],
  [BOTTOM_HUB, G, H],
  [BOTTOM_HUB, H, I],
  [BOTTOM_HUB, I, J],
  [BOTTOM_HUB, J, K, L],
  [BOTTOM_HUB, L, M, NECK],
];

/** Possible cracks. They follow shard edges, so the glass breaks where it cracked. */
const CRACK_CANDIDATES: readonly (readonly Pt[])[] = [
  [TOP_HUB, NECK, BOTTOM_HUB],
  [TOP_HUB, B],
  [TOP_HUB, E],
  [TOP_HUB, N],
  [BOTTOM_HUB, G],
  [BOTTOM_HUB, I],
  [BOTTOM_HUB, J],
  [BOTTOM_HUB, L],
];

export const MIN_CRACKS = 3;
export const MAX_CRACKS = 5;
export const SAND_DOTS = 18;

export interface Crack {
  d: string;
  /** ms after the start. */
  delay: number;
}

export interface ShardMotion {
  /** SVG polygon `points`. */
  points: string;
  /** Rotation center (the shard's centroid). */
  origin: { x: number; y: number };
  dx: number;
  dy: number;
  /** Degrees. */
  rotate: number;
  /** ms after the shatter starts. */
  delay: number;
}

export interface SandDot {
  cx: number;
  cy: number;
  r: number;
  dx: number;
  dy: number;
  /** ms after the shatter starts. */
  delay: number;
}

export interface ShatterPlan {
  cracks: Crack[];
  shards: ShardMotion[];
  dots: SandDot[];
}

const SIDEWAYS = 0.6;

const CENTER = { x: HOURGLASS.cx, y: HOURGLASS.height / 2 };

export function planShatter(seed: string): ShatterPlan {
  const rand = seededRandom(seed);
  const between = (min: number, max: number) => min + rand() * (max - min);

  // Cracks: a seeded shuffle of the candidates, then take 3–5.
  const order = CRACK_CANDIDATES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }
  const count = MIN_CRACKS + Math.floor(rand() * (MAX_CRACKS - MIN_CRACKS + 1));
  const cracks = order.slice(0, count).map((index, n) => ({
    d: toPath(CRACK_CANDIDATES[index] as readonly Pt[]),
    delay: Math.round(n * 40 + between(0, 20)),
  }));

  // Shards fly away from the middle of the glass, then gravity pulls them down a bit.
  // Sideways travel is damped so they fade out before reaching the edges of a phone screen.
  const shards = SHARD_POLYGONS.map((poly) => {
    const origin = centroid(poly);
    const vx = origin.x - CENTER.x;
    const vy = origin.y - CENTER.y;
    const len = Math.hypot(vx, vy) || 1;
    const distance = between(45, 95);
    return {
      points: poly.map(([x, y]) => `${x},${y}`).join(" "),
      origin,
      dx: (vx / len) * distance * SIDEWAYS,
      dy: (vy / len) * distance + between(30, 70),
      rotate: (rand() < 0.5 ? -1 : 1) * between(30, 160),
      delay: Math.round(between(0, 120)),
    };
  });

  // Sand dots start inside the full bottom chamber and fall.
  const dots = Array.from({ length: SAND_DOTS }, () => {
    const { x, y } = pointInBottomChamber(rand(), rand());
    return {
      cx: x,
      cy: y,
      r: between(1.2, 2.6),
      dx: between(-12, 12),
      dy: between(50, 120),
      delay: Math.round(between(0, 250)),
    };
  });

  return { cracks, shards, dots };
}

function toPath(points: readonly Pt[]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}

function centroid(poly: readonly Pt[]): { x: number; y: number } {
  const x = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const y = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  return { x, y };
}

/** Uniform point in the bottom sand triangle, from two uniform numbers in [0, 1). */
function pointInBottomChamber(u: number, v: number): { x: number; y: number } {
  const { cx, bottomTipY, chamberH, chamberHalfBase } = HOURGLASS;
  // Fold the unit square onto the triangle.
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  const tip = { x: cx, y: bottomTipY };
  const left = { x: cx - chamberHalfBase, y: bottomTipY + chamberH };
  const right = { x: cx + chamberHalfBase, y: bottomTipY + chamberH };
  return {
    x: tip.x + u * (left.x - tip.x) + v * (right.x - tip.x),
    y: tip.y + u * (left.y - tip.y) + v * (right.y - tip.y),
  };
}
