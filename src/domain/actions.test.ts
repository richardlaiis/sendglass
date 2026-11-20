import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addReply, markHappened, openCapsule, openEarly, validateReply } from "./actions";
import { REPLY_MAX } from "./config";
import { getStatus } from "./status";
import { HOUR, T0, makeCapsule } from "./testUtils";
import type { Capsule } from "./types";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});
afterEach(() => {
  vi.useRealTimers();
});

const timed = makeCapsule({ type: "datetime", at: T0 + HOUR });
const event = makeCapsule({ type: "event", label: "exam" });
const apply = (c: Capsule, changes: Partial<Capsule>): Capsule => ({ ...c, ...changes });

describe("markHappened", () => {
  it("sets doneAt and makes the event capsule ready", () => {
    const changes = markHappened(event, T0 + HOUR);
    expect(changes).toEqual({ unlock: { type: "event", label: "exam", doneAt: T0 + HOUR } });
    expect(getStatus(apply(event, changes), T0 + HOUR)).toBe("ready");
  });

  it("rejects time capsules, repeated marks and opened capsules", () => {
    expect(() => markHappened(timed, T0)).toThrow();
    const done = apply(event, markHappened(event, T0));
    expect(() => markHappened(done, T0)).toThrow();
    expect(() => markHappened({ ...event, openedAt: T0 }, T0)).toThrow();
  });
});

describe("openCapsule", () => {
  it("opens a ready capsule exactly at the unlock moment", () => {
    expect(openCapsule(timed, T0 + HOUR)).toEqual({ openedAt: T0 + HOUR });
  });

  it("refuses sealed and already opened capsules", () => {
    expect(() => openCapsule(timed, T0 + HOUR - 1)).toThrow();
    expect(() => openCapsule(event, T0)).toThrow();
    expect(() => openCapsule({ ...timed, openedAt: T0 + HOUR }, T0 + 2 * HOUR)).toThrow();
  });
});

describe("openEarly", () => {
  it("records the early opening on a sealed capsule", () => {
    expect(openEarly(timed, T0 + 1, 5)).toEqual({
      openedAt: T0 + 1,
      openedEarly: true,
      earlyConfirmations: 5,
    });
    expect(openEarly(event, T0, 5).openedEarly).toBe(true);
  });

  it("refuses ready and opened capsules", () => {
    expect(() => openEarly(timed, T0 + HOUR, 5)).toThrow();
    expect(() => openEarly({ ...event, openedAt: T0 }, T0, 5)).toThrow();
  });
});

describe("replies", () => {
  const opened = { ...timed, openedAt: T0 + HOUR };

  it("adds a write-once reply to an opened capsule", () => {
    const changes = addReply(opened, "Thanks, past me", T0 + 2 * HOUR);
    expect(changes).toEqual({ reply: { content: "Thanks, past me", createdAt: T0 + 2 * HOUR } });
    expect(() => addReply(apply(opened, changes), "again", T0)).toThrow();
  });

  it("refuses unopened capsules", () => {
    expect(() => addReply(timed, "hi", T0)).toThrow();
  });

  it("validates empty and overlong replies", () => {
    expect(validateReply("  ")).toBe("replyEmpty");
    expect(validateReply("a".repeat(REPLY_MAX))).toBeNull();
    expect(validateReply("a".repeat(REPLY_MAX + 1))).toBe("replyTooLong");
    expect(() => addReply(opened, " ", T0)).toThrow(/replyEmpty/);
  });
});
