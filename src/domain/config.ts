const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Shortest allowed delay between sealing and unlocking. */
export const MIN_UNLOCK_MS = 1 * MINUTE;
/** Longest allowed delay between sealing and unlocking. */
export const MAX_UNLOCK_MS = 30 * DAY;

export const TITLE_MAX = 60;
export const CONTENT_MAX = 5000;

export const SCHEMA_VERSION = 1 as const;

export const REPLY_MAX = 5000;
