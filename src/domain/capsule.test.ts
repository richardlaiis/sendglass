import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCapsule, getDraftDelayMs, validateDraft, type CapsuleDraft } from "./capsule";
import { CONTENT_MAX, MAX_UNLOCK_MS, MIN_UNLOCK_MS, TITLE_MAX } from "./config";
import { DAY, HOUR, T0 } from "./testUtils";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});
afterEach(() => {
  vi.useRealTimers();
});

function draft(overrides: Partial<CapsuleDraft> = {}): CapsuleDraft {
  return {
    title: "",
    content: "Dear future me",
    unlock: { type: "interval", durationMs: HOUR },
    ...overrides,
  };
}

describe("getDraftDelayMs", () => {
  it("measures datetime drafts from now", () => {
    expect(getDraftDelayMs({ type: "datetime", at: T0 + 3 * HOUR }, T0)).toBe(3 * HOUR);
  });
  it("uses the duration for interval drafts", () => {
    expect(getDraftDelayMs({ type: "interval", durationMs: DAY }, T0)).toBe(DAY);
  });
  it("is null for events and missing dates", () => {
    expect(getDraftDelayMs({ type: "event", label: "x" }, T0)).toBeNull();
    expect(getDraftDelayMs({ type: "datetime", at: null }, T0)).toBeNull();
  });
});

describe("validateDraft", () => {
  it("accepts a valid draft", () => {
    expect(validateDraft(draft(), T0)).toEqual([]);
  });

  it("rejects empty or whitespace-only content", () => {
    expect(validateDraft(draft({ content: "  \n " }), T0)).toContain("contentEmpty");
  });

  it("enforces the content and title limits at the boundary", () => {
    expect(validateDraft(draft({ content: "a".repeat(CONTENT_MAX) }), T0)).toEqual([]);
    expect(validateDraft(draft({ content: "a".repeat(CONTENT_MAX + 1) }), T0)).toContain(
      "contentTooLong",
    );
    expect(validateDraft(draft({ title: "t".repeat(TITLE_MAX) }), T0)).toEqual([]);
    expect(validateDraft(draft({ title: "t".repeat(TITLE_MAX + 1) }), T0)).toContain(
      "titleTooLong",
    );
  });

  it("enforces the minimum delay, inclusive", () => {
    const at = (ms: number) => draft({ unlock: { type: "interval", durationMs: ms } });
    expect(validateDraft(at(MIN_UNLOCK_MS), T0)).toEqual([]);
    expect(validateDraft(at(MIN_UNLOCK_MS - 1), T0)).toEqual(["tooSoon"]);
  });

  it("enforces the maximum delay, inclusive", () => {
    const at = (ms: number) => draft({ unlock: { type: "datetime", at: T0 + ms } });
    expect(validateDraft(at(MAX_UNLOCK_MS), T0)).toEqual([]);
    expect(validateDraft(at(MAX_UNLOCK_MS + 1), T0)).toEqual(["tooLate"]);
  });

  it("rejects a datetime in the past", () => {
    expect(validateDraft(draft({ unlock: { type: "datetime", at: T0 - HOUR } }), T0)).toEqual([
      "tooSoon",
    ]);
  });

  it("rejects a missing date", () => {
    expect(validateDraft(draft({ unlock: { type: "datetime", at: null } }), T0)).toEqual([
      "dateMissing",
    ]);
  });

  it("rejects a NaN duration", () => {
    expect(validateDraft(draft({ unlock: { type: "interval", durationMs: NaN } }), T0)).toEqual([
      "tooSoon",
    ]);
  });

  it("requires an event label but no time limits", () => {
    expect(validateDraft(draft({ unlock: { type: "event", label: " " } }), T0)).toEqual([
      "eventLabelEmpty",
    ]);
    expect(validateDraft(draft({ unlock: { type: "event", label: "After exam" } }), T0)).toEqual(
      [],
    );
  });
});

describe("buildCapsule", () => {
  it("computes `at` for interval capsules from now", () => {
    const c = buildCapsule(draft({ unlock: { type: "interval", durationMs: 6 * HOUR } }), T0, "x");
    expect(c).toEqual({
      id: "x",
      schemaVersion: 1,
      content: "Dear future me",
      createdAt: T0,
      unlock: { type: "interval", durationMs: 6 * HOUR, at: T0 + 6 * HOUR },
    });
  });

  it("stores datetime capsules as an absolute timestamp", () => {
    const c = buildCapsule(draft({ unlock: { type: "datetime", at: T0 + DAY } }), T0, "x");
    expect(c.unlock).toEqual({ type: "datetime", at: T0 + DAY });
  });

  it("trims the title and event label, and omits an empty title", () => {
    const c = buildCapsule(
      draft({ title: "  Hi  ", unlock: { type: "event", label: " After exam " } }),
      T0,
      "x",
    );
    expect(c.title).toBe("Hi");
    expect(c.unlock).toEqual({ type: "event", label: "After exam" });
    expect("title" in buildCapsule(draft({ title: "   " }), T0, "y")).toBe(false);
  });

  it("throws on an invalid draft", () => {
    expect(() => buildCapsule(draft({ content: "" }), T0, "x")).toThrow(/contentEmpty/);
  });
});
