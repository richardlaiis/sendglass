import { REPLY_MAX } from "./config";
import { getStatus } from "./status";
import type { Capsule, CapsuleChanges } from "./types";

/*
 * Pure lifecycle transitions. Each returns the fields to change and throws
 * if the capsule is in the wrong state, so the UI can't record impossible histories.
 */

export class InvalidTransitionError extends Error {}

function fail(message: string): never {
  throw new InvalidTransitionError(message);
}

/** "It happened": an event capsule becomes ready. */
export function markHappened(capsule: Capsule, now: number): CapsuleChanges {
  if (capsule.unlock.type !== "event") fail("Only event capsules can be marked as happened");
  if (capsule.openedAt !== undefined) fail("Capsule is already opened");
  if (capsule.unlock.doneAt !== undefined) fail("Event already marked as happened");
  return { unlock: { ...capsule.unlock, doneAt: now } };
}

/** Normal opening of a ready capsule. */
export function openCapsule(capsule: Capsule, now: number): CapsuleChanges {
  if (getStatus(capsule, now) !== "ready") fail("Only ready capsules can be opened");
  return { openedAt: now };
}

/** Opening a sealed capsule after the confirmation chain (SPEC §5). */
export function openEarly(capsule: Capsule, now: number, confirmations: number): CapsuleChanges {
  if (getStatus(capsule, now) !== "sealed") fail("Only sealed capsules can be opened early");
  return { openedAt: now, openedEarly: true, earlyConfirmations: confirmations };
}

export type ReplyError = "replyEmpty" | "replyTooLong";

export function validateReply(text: string): ReplyError | null {
  if (text.trim() === "") return "replyEmpty";
  if (text.length > REPLY_MAX) return "replyTooLong";
  return null;
}

/** Write-once reply on an opened capsule. */
export function addReply(capsule: Capsule, text: string, now: number): CapsuleChanges {
  if (capsule.openedAt === undefined) fail("Only opened capsules can be replied to");
  if (capsule.reply !== undefined) fail("Capsule already has a reply");
  const error = validateReply(text);
  if (error) fail(error);
  return { reply: { content: text, createdAt: now } };
}

/** An unlock notification was shown for a ready time capsule (SPEC §9.1). */
export function markNotified(capsule: Capsule, now: number): CapsuleChanges {
  if (getStatus(capsule, now) !== "ready") fail("Only ready capsules can be notified about");
  if (capsule.notifiedAt !== undefined) fail("Capsule was already notified about");
  return { notifiedAt: now };
}
