import { describe, expect, it } from "vitest";
import { getHistory, getOpenedEarlyByMs } from "./history";
import { DAY, HOUR, T0, makeCapsule } from "./testUtils";

describe("getHistory", () => {
  it("lists only opened capsules, most recently opened first", () => {
    const a = makeCapsule(
      { type: "datetime", at: T0 + HOUR },
      { id: "a", openedAt: T0 + 2 * HOUR },
    );
    const b = makeCapsule({ type: "event", label: "x" }, { id: "b", openedAt: T0 + 5 * HOUR });
    const sealed = makeCapsule({ type: "datetime", at: T0 + DAY }, { id: "sealed" });
    expect(getHistory([a, sealed, b]).map((c) => c.id)).toEqual(["b", "a"]);
  });
});

describe("getOpenedEarlyByMs", () => {
  it("is the time left until the unlock moment when opened early", () => {
    const c = makeCapsule(
      { type: "interval", durationMs: 3 * DAY, at: T0 + 3 * DAY },
      { openedAt: T0 + DAY, openedEarly: true, earlyConfirmations: 5 },
    );
    expect(getOpenedEarlyByMs(c)).toBe(2 * DAY);
  });

  it("is null for normal openings, unopened capsules and event capsules", () => {
    expect(
      getOpenedEarlyByMs(makeCapsule({ type: "datetime", at: T0 }, { openedAt: T0 })),
    ).toBeNull();
    expect(getOpenedEarlyByMs(makeCapsule({ type: "datetime", at: T0 + HOUR }))).toBeNull();
    expect(
      getOpenedEarlyByMs(
        makeCapsule({ type: "event", label: "x" }, { openedAt: T0, openedEarly: true }),
      ),
    ).toBeNull();
  });
});
