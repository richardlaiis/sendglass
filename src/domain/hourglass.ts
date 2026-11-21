import { getStatus } from "./status";
import type { Capsule } from "./types";

/**
 * Hourglass geometry, in SVG user units (viewBox 0 0 120 200).
 *
 * Each sand chamber is a triangle with its tip at the neck. Because the drawing
 * is flat, the amount of sand is the triangle's area, which grows with the square
 * of its height. So a chamber holding a fraction f of the sand is filled to a
 * height of H·√f. That keeps the drawn sand volume-correct at every progress.
 */
export const HOURGLASS = {
  width: 120,
  height: 200,
  cx: 60,
  /** Height of each sand chamber (the clip triangles). */
  chamberH: 74,
  /** Half the width of a sand chamber at its wide end. */
  chamberHalfBase: 40,
  /** Tip of the top sand chamber. */
  topTipY: 98,
  /** Tip of the bottom sand chamber. */
  bottomTipY: 102,
} as const;

const H = HOURGLASS.chamberH;

/**
 * Corners of the glass outline (two triangles meeting at a narrow neck). The
 * drawn path rounds the wide corners a little; this is the straight-edged version.
 */
export const GLASS_OUTLINE: readonly (readonly [number, number])[] = [
  [16, 20],
  [104, 20],
  [61.5, 100],
  [104, 180],
  [16, 180],
  [58.5, 100],
];

/** The two caps above and below the glass. */
export const CAPS = [
  { x: 12, y: 12, width: 96, height: 5, rx: 2.5 },
  { x: 12, y: 183, width: 96, height: 5, rx: 2.5 },
] as const;

/** How full the top chamber looks for event capsules (resting, no flow). */
export const EVENT_RESTING_PROGRESS = 0.25;

export function clamp01(p: number): number {
  if (Number.isNaN(p)) return 0;
  return Math.min(1, Math.max(0, p));
}

/** Height of the sand left in the top chamber, measured up from the neck. */
export function topSandHeight(p: number): number {
  return H * Math.sqrt(1 - clamp01(p));
}

/** Height of the empty space in the bottom chamber, measured down from the neck. */
export function bottomEmptyHeight(p: number): number {
  return H * Math.sqrt(1 - clamp01(p));
}

/**
 * translateY for the two sand shapes. Both are drawn in their "full" position
 * (top: chamber full; bottom: sand surface at the neck) and moved down.
 */
export function sandOffsets(p: number): { top: number; bottom: number } {
  return { top: H - topSandHeight(p), bottom: bottomEmptyHeight(p) };
}

export type HourglassState = "sealed" | "event" | "ready";

/**
 * translateY for both sand shapes in a given state. Event capsules are suspended:
 * the top rests at EVENT_RESTING_PROGRESS (leaving room for the wave) and nothing
 * has fallen yet, so the bottom stays empty.
 */
export function sandOffsetsFor(
  state: HourglassState,
  progress: number | null,
): { top: number; bottom: number } {
  if (state === "ready") return sandOffsets(1);
  if (state === "event") return { top: sandOffsets(EVENT_RESTING_PROGRESS).top, bottom: H };
  return sandOffsets(progress ?? 0);
}

/** Which hourglass to draw for a capsule. Null once it's opened (no hourglass then). */
export function hourglassState(capsule: Capsule, now: number): HourglassState | null {
  const status = getStatus(capsule, now);
  if (status === "opened") return null;
  if (status === "ready") return "ready";
  return capsule.unlock.type === "event" ? "event" : "sealed";
}
