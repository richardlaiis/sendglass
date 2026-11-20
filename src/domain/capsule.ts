import { CONTENT_MAX, MAX_UNLOCK_MS, MIN_UNLOCK_MS, SCHEMA_VERSION, TITLE_MAX } from "./config";
import type { Capsule, Unlock } from "./types";

/** What the Write form produces before sealing. */
export type DraftUnlock =
  | { type: "datetime"; at: number | null }
  | { type: "interval"; durationMs: number }
  | { type: "event"; label: string };

export interface CapsuleDraft {
  title: string;
  content: string;
  unlock: DraftUnlock;
}

/** Each value is an i18n key suffix under `write.errors.*`. */
export type DraftError =
  | "contentEmpty"
  | "contentTooLong"
  | "titleTooLong"
  | "dateMissing"
  | "tooSoon"
  | "tooLate"
  | "eventLabelEmpty";

/** Delay from `now` until the draft would unlock. Null for events or a missing date. */
export function getDraftDelayMs(unlock: DraftUnlock, now: number): number | null {
  switch (unlock.type) {
    case "datetime":
      return unlock.at === null ? null : unlock.at - now;
    case "interval":
      return unlock.durationMs;
    case "event":
      return null;
  }
}

export function validateDraft(draft: CapsuleDraft, now: number): DraftError[] {
  const errors: DraftError[] = [];

  if (draft.content.trim() === "") errors.push("contentEmpty");
  if (draft.content.length > CONTENT_MAX) errors.push("contentTooLong");
  if (draft.title.trim().length > TITLE_MAX) errors.push("titleTooLong");

  const { unlock } = draft;
  if (unlock.type === "event") {
    if (unlock.label.trim() === "") errors.push("eventLabelEmpty");
  } else if (unlock.type === "datetime" && unlock.at === null) {
    errors.push("dateMissing");
  } else {
    const delay = getDraftDelayMs(unlock, now);
    if (delay !== null && (Number.isNaN(delay) || delay < MIN_UNLOCK_MS)) errors.push("tooSoon");
    if (delay !== null && delay > MAX_UNLOCK_MS) errors.push("tooLate");
  }

  return errors;
}

/** Turns a valid draft into a sealed capsule. Call `validateDraft` first. */
export function buildCapsule(draft: CapsuleDraft, now: number, id: string): Capsule {
  const errors = validateDraft(draft, now);
  if (errors.length > 0) {
    throw new Error(`Invalid capsule draft: ${errors.join(", ")}`);
  }

  const title = draft.title.trim();
  return {
    id,
    schemaVersion: SCHEMA_VERSION,
    ...(title ? { title } : {}),
    content: draft.content,
    createdAt: now,
    unlock: toUnlock(draft.unlock, now),
  };
}

function toUnlock(unlock: DraftUnlock, now: number): Unlock {
  switch (unlock.type) {
    case "datetime":
      // validateDraft guarantees `at` is set.
      return { type: "datetime", at: unlock.at as number };
    case "interval":
      return { type: "interval", durationMs: unlock.durationMs, at: now + unlock.durationMs };
    case "event":
      return { type: "event", label: unlock.label.trim() };
  }
}
