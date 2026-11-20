export type Unlock =
  | { type: "datetime"; at: number } // epoch ms
  | { type: "interval"; durationMs: number; at: number } // at = createdAt + durationMs
  | { type: "event"; label: string; doneAt?: number }; // doneAt set by "It happened"

export type UnlockType = Unlock["type"];

export interface Capsule {
  id: string;
  schemaVersion: 1;
  title?: string;
  content: string;
  createdAt: number;
  unlock: Unlock;
  openedAt?: number;
  openedEarly?: boolean;
  earlyConfirmations?: number;
  reply?: { content: string; createdAt: number };
  notifiedAt?: number;
}

/**
 * Fields that may change after sealing. Title and content are immutable,
 * so they are deliberately not part of this type.
 */
export type CapsuleChanges = Partial<
  Pick<
    Capsule,
    "unlock" | "openedAt" | "openedEarly" | "earlyConfirmations" | "reply" | "notifiedAt"
  >
>;

export type Language = "system" | "en" | "zh-TW";
export type Theme = "system" | "light" | "dark";

export interface Settings {
  language: Language;
  theme: Theme;
  allowEarlyOpen: boolean;
  notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  language: "system",
  theme: "system",
  allowEarlyOpen: false,
  notificationsEnabled: false,
};

/** Derived from data + current time. Never stored. */
export type CapsuleStatus = "sealed" | "ready" | "opened";
