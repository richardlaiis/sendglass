import { getUnlockAt } from "./status";
import type { Capsule } from "./types";

/** Opened capsules, most recently opened first. */
export function getHistory(capsules: readonly Capsule[]): Capsule[] {
  return capsules
    .filter((c) => c.openedAt !== undefined)
    .sort((a, b) => (b.openedAt ?? 0) - (a.openedAt ?? 0));
}

/**
 * How long before its unlock moment a capsule was opened early.
 * Null if it wasn't opened early, or for event capsules (they have no unlock moment).
 */
export function getOpenedEarlyByMs(capsule: Capsule): number | null {
  if (!capsule.openedEarly || capsule.openedAt === undefined) return null;
  const unlockAt = getUnlockAt(capsule);
  if (unlockAt === null) return null;
  return Math.max(0, unlockAt - capsule.openedAt);
}
