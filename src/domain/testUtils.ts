import type { Capsule, Unlock } from "./types";

/** Fixed reference instant for tests: 2026-01-10T12:00:00Z. */
export const T0 = Date.UTC(2026, 0, 10, 12, 0, 0);
export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export function makeCapsule(unlock: Unlock, overrides: Partial<Capsule> = {}): Capsule {
  return {
    id: overrides.id ?? "c1",
    schemaVersion: 1,
    content: "hello",
    createdAt: T0,
    unlock,
    ...overrides,
  };
}
