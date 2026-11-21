import { CAPS, GLASS_OUTLINE, HOURGLASS } from "./hourglass";
import { seededRandom } from "./random";

/**
 * The "pixels reassemble" intro of the sealing ceremony: the hourglass with all
 * sand in the bottom chamber, cut into a grid of small squares. Each square flies
 * in from a seeded random offset. Coordinates are in the hourglass viewBox.
 */

export type PixelKind = "glass" | "sand";

export interface Pixel {
  /** Top-left corner and size of the square. */
  x: number;
  y: number;
  size: number;
  kind: PixelKind;
  /** Where it starts, relative to its place. */
  fromX: number;
  fromY: number;
  /** ms after the start. */
  delay: number;
}

export const CELL = 5;
/** Squares are a bit smaller than their cell, so the gaps read as pixels. */
const PIXEL_SIZE = 4.2;
/** Cells whose center is this close to the outline become glass pixels. */
const OUTLINE_REACH = 2.2;
export const MAX_DELAY_MS = 400;

type Pt = readonly [number, number];

export function planAssembly(seed: string): Pixel[] {
  const rand = seededRandom(seed);
  const pixels: Pixel[] = [];
  const inset = (CELL - PIXEL_SIZE) / 2;

  for (let y = 8; y < 192; y += CELL) {
    for (let x = 8; x < 112; x += CELL) {
      const center: Pt = [x + CELL / 2, y + CELL / 2];
      const kind = classify(center);
      if (!kind) continue;
      const angle = rand() * Math.PI * 2;
      const distance = 40 + rand() * 70;
      pixels.push({
        x: x + inset,
        y: y + inset,
        size: PIXEL_SIZE,
        kind,
        fromX: Math.cos(angle) * distance,
        fromY: Math.sin(angle) * distance,
        delay: Math.round(rand() * MAX_DELAY_MS),
      });
    }
  }
  return pixels;
}

/** Glass for the outline and caps, sand for the full bottom chamber, nothing elsewhere. */
export function classify(p: Pt): PixelKind | null {
  if (CAPS.some((c) => inRect(p, c))) return "glass";
  if (distanceToOutline(p) <= OUTLINE_REACH) return "glass";
  if (inBottomChamber(p)) return "sand";
  return null;
}

function inRect([x, y]: Pt, r: { x: number; y: number; width: number; height: number }) {
  return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
}

function inBottomChamber([x, y]: Pt): boolean {
  const { cx, bottomTipY, chamberH, chamberHalfBase } = HOURGLASS;
  if (y < bottomTipY || y > bottomTipY + chamberH) return false;
  const halfWidth = (chamberHalfBase * (y - bottomTipY)) / chamberH;
  return Math.abs(x - cx) <= halfWidth;
}

function distanceToOutline(p: Pt): number {
  let min = Infinity;
  GLASS_OUTLINE.forEach((a, i) => {
    const b = GLASS_OUTLINE[(i + 1) % GLASS_OUTLINE.length] as Pt;
    min = Math.min(min, distanceToSegment(p, a, b));
  });
  return min;
}

function distanceToSegment([px, py]: Pt, [ax, ay]: Pt, [bx, by]: Pt): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
