import { HOURGLASS } from "../domain/hourglass";

/** SVG shapes for the hourglass, shared with the shatter reveal. viewBox 0 0 120 200. */
const { cx, chamberH, chamberHalfBase, topTipY, bottomTipY } = HOURGLASS;
const topBaseY = topTipY - chamberH; // 24
const bottomBaseY = bottomTipY + chamberH; // 176

export const VIEW_BOX = `0 0 ${HOURGLASS.width} ${HOURGLASS.height}`;

/** Sand chambers: true triangles with the tip at the neck, so the √ level math is exact. */
export const TOP_CHAMBER = `${cx - chamberHalfBase},${topBaseY} ${cx + chamberHalfBase},${topBaseY} ${cx},${topTipY}`;
export const BOTTOM_CHAMBER = `${cx},${bottomTipY} ${cx + chamberHalfBase},${bottomBaseY} ${cx - chamberHalfBase},${bottomBaseY}`;

/** Full-chamber sand rects (moved with translateY, clipped by the chamber). */
export const TOP_SAND = { x: 0, y: topBaseY, width: HOURGLASS.width, height: chamberH + 12 };
export const BOTTOM_SAND = { x: 0, y: bottomTipY, width: HOURGLASS.width, height: chamberH + 12 };

/** Glass outline: two soft triangles meeting at a narrow neck, rounded at the wide ends. */
export const GLASS_PATH = [
  "M22 20 H98 Q104 20 100.8 26",
  "L61.5 100",
  "L100.8 174 Q104 180 98 180",
  "H22 Q16 180 19.2 174",
  "L58.5 100",
  "L19.2 26 Q16 20 22 20 Z",
].join(" ");

export const CAPS = [
  { x: 12, y: 12, width: 96, height: 5, rx: 2.5 },
  { x: 12, y: 183, width: 96, height: 5, rx: 2.5 },
] as const;

export const STREAM = { x: cx, y1: topTipY - 1, y2: bottomBaseY };

/** Sand with a wavy surface, 20 units per wave, wide enough to slide one wave sideways. */
function wavePath(amplitude: number): string {
  const waves = 10;
  const half = "q5 -A 10 0 q5 A 10 0".replaceAll("A", String(amplitude));
  const top = Array.from({ length: waves }, () => half).join(" ");
  return `M-40 ${topBaseY} ${top} L160 ${topBaseY + chamberH + 12} L-40 ${topBaseY + chamberH + 12} Z`;
}

export const WAVE_FRONT = wavePath(1.4);
export const WAVE_BACK = wavePath(2.2);
