import { getStatus } from "./status";
import type { Capsule } from "./types";

/**
 * Which capsules to notify about, and when to look again (SPEC §9.1).
 * The scheduler keeps a single timer for `nextCheckAt`; when it fires (or the app
 * starts, gets focus, or capsules change) it plans again and shows what's due.
 */

/** How far ahead the scheduler arms a timer while the app is open. */
export const NOTIFY_HORIZON_MS = 24 * 60 * 60 * 1000;

export interface NotificationPlan {
  /** Ready time capsules nobody has been told about yet, earliest unlock first. */
  due: Capsule[];
  /** When to check again: the next unlock within the horizon, or now + horizon. */
  nextCheckAt: number;
}

/**
 * Event capsules are never notified about: they become ready when you tap
 * "It happened" yourself, so you already know.
 */
export function planNotifications(
  capsules: readonly Capsule[],
  now: number,
  horizonMs = NOTIFY_HORIZON_MS,
): NotificationPlan {
  const due: Capsule[] = [];
  let next = now + horizonMs;

  for (const c of capsules) {
    if (c.unlock.type === "event" || c.notifiedAt !== undefined) continue;
    const status = getStatus(c, now);
    if (status === "ready") due.push(c);
    else if (status === "sealed" && c.unlock.at < next) next = c.unlock.at;
  }

  due.sort((a, b) => unlockAt(a) - unlockAt(b));
  return { due, nextCheckAt: next };
}

export type NotificationMessage =
  | {
      kind: "single";
      capsuleId: string;
      /** The capsule's own title, if it has one. Never the content. */
      title?: string;
      createdAt: number;
      /** Where tapping the notification goes. */
      hash: string;
      tag: string;
    }
  | { kind: "summary"; count: number; hash: string; tag: string };

/** One notification for everything due: the capsule itself, or a summary when there are several. */
export function describeNotification(due: readonly Capsule[]): NotificationMessage | null {
  const [first] = due;
  if (!first) return null;
  if (due.length > 1) {
    return { kind: "summary", count: due.length, hash: "#/", tag: "sendglass-summary" };
  }
  return {
    kind: "single",
    capsuleId: first.id,
    ...(first.title ? { title: first.title } : {}),
    createdAt: first.createdAt,
    hash: `#/capsule/${encodeURIComponent(first.id)}`,
    tag: `capsule-${first.id}`,
  };
}

/** For the app badge: capsules waiting to be opened, event capsules included. */
export function readyCount(capsules: readonly Capsule[], now: number): number {
  return capsules.filter((c) => getStatus(c, now) === "ready").length;
}

function unlockAt(c: Capsule): number {
  return c.unlock.type === "event" ? c.createdAt : c.unlock.at;
}
