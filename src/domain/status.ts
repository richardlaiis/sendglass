import type { Capsule, CapsuleStatus } from "./types";

/**
 * The scheduled unlock moment for time-based capsules.
 * Event capsules have no scheduled moment, so this returns null for them.
 */
export function getUnlockAt(capsule: Capsule): number | null {
  return capsule.unlock.type === "event" ? null : capsule.unlock.at;
}

export function getStatus(capsule: Capsule, now: number): CapsuleStatus {
  if (capsule.openedAt !== undefined) return "opened";
  if (capsule.unlock.type === "event") {
    return capsule.unlock.doneAt !== undefined ? "ready" : "sealed";
  }
  return now >= capsule.unlock.at ? "ready" : "sealed";
}

/**
 * Fraction of the waiting time that has passed, clamped to 0–1.
 * Null for event capsules (no time-based progress). Opened capsules report 1.
 */
export function getProgress(capsule: Capsule, now: number): number | null {
  const unlockAt = getUnlockAt(capsule);
  if (unlockAt === null) return null;
  if (capsule.openedAt !== undefined) return 1;
  const total = unlockAt - capsule.createdAt;
  if (total <= 0) return 1;
  return clamp01((now - capsule.createdAt) / total);
}

/**
 * Milliseconds until the unlock moment, never negative.
 * Null for event capsules. Opened capsules report 0.
 */
export function getRemainingMs(capsule: Capsule, now: number): number | null {
  const unlockAt = getUnlockAt(capsule);
  if (unlockAt === null) return null;
  if (capsule.openedAt !== undefined) return 0;
  return Math.max(0, unlockAt - now);
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * Progress as a percentage with one decimal, rounded down so a sealed
 * capsule never shows 100.0%. Example: 0.62449 → 62.4.
 */
export function toDisplayPercent(progress: number): number {
  return Math.floor(progress * 1000) / 10;
}
