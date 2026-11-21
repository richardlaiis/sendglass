import { pixelGrid, type PixelKind } from "./assemble";
import { HOURGLASS } from "./hourglass";
import { seededRandom } from "./random";

/**
 * The shatter reveal (SPEC §6.4) as data. Cracks appear on the glass; the glass
 * then turns into a pixel version cut into shards, the shards break apart a little,
 * and their pixels scatter and fade (sand pixels fall instead). Seeded from the
 * capsule id, so the same capsule always shatters the same way. Coordinates are in
 * the hourglass viewBox.
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
export const MAX_PIXEL_DELAY_MS = 300;

export interface Crack {
  d: string;
  /** ms after the start. */
  delay: number;
}

/** How a shard breaks away from the others: a short drift and a small tilt. */
export interface ShardMotion {
  /** SVG polygon `points`. */
  points: string;
  /** Rotation center (the shard's centroid). */
  origin: { x: number; y: number };
  dx: number;
  dy: number;
  /** Degrees. */
  rotate: number;
  /** ms after the break starts. */
  delay: number;
}

/** One square of the pixel hourglass, belonging to a shard, and where it flies. */
export interface ShatterPixel {
  x: number;
  y: number;
  size: number;
  kind: PixelKind;
  /** Index into `shards`. */
  shard: number;
  dx: number;
  dy: number;
  /** ms after the scatter starts. */
  delay: number;
}

export interface ShatterPlan {
  cracks: Crack[];
  shards: ShardMotion[];
  pixels: ShatterPixel[];
}

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

  // Shards drift a little away from the middle of the glass, tilting as they go.
  const shards = SHARD_POLYGONS.map((poly) => {
    const origin = centroid(poly);
    const dir = unit(origin.x - CENTER.x, origin.y - CENTER.y);
    const distance = between(6, 14);
    return {
      points: poly.map(([x, y]) => `${x},${y}`).join(" "),
      origin,
      dx: dir.x * distance,
      dy: dir.y * distance,
      rotate: (rand() < 0.5 ? -1 : 1) * between(4, 12),
      delay: Math.round(between(0, 60)),
    };
  });

  // Then every pixel leaves: glass scatters outward, sand falls.
  const pixels = pixelGrid().map((p) => {
    const cx = p.x + p.size / 2;
    const cy = p.y + p.size / 2;
    const shard = shardAt(cx, cy);
    const delay = Math.round(between(0, MAX_PIXEL_DELAY_MS));
    if (p.kind === "sand") {
      return { ...p, shard, dx: between(-12, 12), dy: between(40, 110), delay };
    }
    const base = Math.atan2(cy - CENTER.y, cx - CENTER.x);
    const angle = base + between(-0.6, 0.6);
    const distance = between(25, 70);
    return {
      ...p,
      shard,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      delay,
    };
  });

  return { cracks, shards, pixels };
}

/** The shard containing a point (the shards tile the whole area). */
export function shardAt(x: number, y: number): number {
  const i = SHARD_POLYGONS.findIndex((poly) => inPolygon(x, y, poly));
  return i === -1 ? 0 : i;
}

function inPolygon(x: number, y: number, poly: readonly Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i] as Pt;
    const [xj, yj] = poly[j] as Pt;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function unit(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
}

function toPath(points: readonly Pt[]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}

function centroid(poly: readonly Pt[]): { x: number; y: number } {
  const x = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const y = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  return { x, y };
}
