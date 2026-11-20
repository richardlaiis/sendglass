import { getStatus, getUnlockAt } from "./status";
import type { Capsule } from "./types";

export interface HomeGroups {
  ready: Capsule[];
  sealed: Capsule[];
}

/**
 * Splits non-opened capsules into Home sections.
 * Sealed: soonest unlock first, event capsules last (oldest first among them).
 * Ready: the ones that became ready earliest first.
 */
export function groupForHome(capsules: readonly Capsule[], now: number): HomeGroups {
  const ready: Capsule[] = [];
  const sealed: Capsule[] = [];
  for (const c of capsules) {
    const status = getStatus(c, now);
    if (status === "ready") ready.push(c);
    else if (status === "sealed") sealed.push(c);
  }

  sealed.sort((a, b) => {
    const ua = getUnlockAt(a);
    const ub = getUnlockAt(b);
    if (ua === null && ub === null) return a.createdAt - b.createdAt;
    if (ua === null) return 1;
    if (ub === null) return -1;
    return ua - ub;
  });
  ready.sort((a, b) => readyAt(a) - readyAt(b));

  return { ready, sealed };
}

function readyAt(c: Capsule): number {
  if (c.unlock.type === "event") return c.unlock.doneAt ?? c.createdAt;
  return c.unlock.at;
}
