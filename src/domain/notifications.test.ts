import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  describeNotification,
  NOTIFY_HORIZON_MS,
  planNotifications,
  readyCount,
} from "./notifications";
import { DAY, HOUR, MIN, T0, makeCapsule } from "./testUtils";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});
afterEach(() => {
  vi.useRealTimers();
});

const inHour = makeCapsule({ type: "datetime", at: T0 + HOUR }, { id: "hour" });
const inTwoHours = makeCapsule(
  { type: "interval", durationMs: 2 * HOUR, at: T0 + 2 * HOUR },
  { id: "two", title: "Exam tips" },
);
const inTwoDays = makeCapsule({ type: "datetime", at: T0 + 2 * DAY }, { id: "far" });
const event = makeCapsule({ type: "event", label: "exam" }, { id: "event" });
const eventDone = makeCapsule({ type: "event", label: "exam", doneAt: T0 }, { id: "done" });

describe("planNotifications", () => {
  it("has nothing due while everything is sealed, and waits for the next unlock", () => {
    const now = Date.now();
    const plan = planNotifications([inTwoHours, inHour, inTwoDays, event], now);
    expect(plan.due).toEqual([]);
    expect(plan.nextCheckAt).toBe(T0 + HOUR);
  });

  it("checks again after the horizon when nothing unlocks within it", () => {
    const now = Date.now();
    expect(planNotifications([inTwoDays], now).nextCheckAt).toBe(now + NOTIFY_HORIZON_MS);
    expect(planNotifications([], now).nextCheckAt).toBe(now + NOTIFY_HORIZON_MS);
  });

  it("makes a capsule due exactly at its unlock moment", () => {
    vi.setSystemTime(T0 + HOUR);
    const plan = planNotifications([inHour, inTwoHours], Date.now());
    expect(plan.due.map((c) => c.id)).toEqual(["hour"]);
    expect(plan.nextCheckAt).toBe(T0 + 2 * HOUR);
  });

  it("collects capsules that became ready while the app was closed, earliest first", () => {
    vi.advanceTimersByTime(3 * HOUR);
    const plan = planNotifications([inTwoHours, inHour, inTwoDays], Date.now());
    expect(plan.due.map((c) => c.id)).toEqual(["hour", "two"]);
    expect(plan.nextCheckAt).toBe(Date.now() + NOTIFY_HORIZON_MS);
  });

  it("skips capsules already notified about or opened", () => {
    vi.advanceTimersByTime(3 * HOUR);
    const now = Date.now();
    const notified = { ...inHour, notifiedAt: T0 + HOUR };
    const opened = { ...inTwoHours, openedAt: T0 + 2 * HOUR };
    expect(planNotifications([notified, opened], now).due).toEqual([]);
  });

  it("never notifies about event capsules, even once they happened", () => {
    expect(planNotifications([event, eventDone], Date.now()).due).toEqual([]);
  });

  it("is not due a minute before unlocking", () => {
    vi.setSystemTime(T0 + HOUR - MIN);
    expect(planNotifications([inHour], Date.now())).toEqual({ due: [], nextCheckAt: T0 + HOUR });
  });
});

describe("describeNotification", () => {
  it("is null when nothing is due", () => {
    expect(describeNotification([])).toBeNull();
  });

  it("points a single capsule at its page, with its title but never its content", () => {
    expect(describeNotification([inTwoHours])).toEqual({
      kind: "single",
      capsuleId: "two",
      title: "Exam tips",
      createdAt: T0,
      hash: "#/capsule/two",
      tag: "capsule-two",
    });
    const msg = describeNotification([inHour]);
    expect(msg).not.toHaveProperty("title");
    expect(JSON.stringify(msg)).not.toContain(inHour.content);
  });

  it("summarises several capsules into one notification that opens Home", () => {
    expect(describeNotification([inHour, inTwoHours])).toEqual({
      kind: "summary",
      count: 2,
      hash: "#/",
      tag: "sendglass-summary",
    });
  });

  it("encodes ids in the link", () => {
    const odd = makeCapsule({ type: "datetime", at: T0 }, { id: "a b/c" });
    expect(describeNotification([odd])).toMatchObject({ hash: "#/capsule/a%20b%2Fc" });
  });
});

describe("readyCount", () => {
  it("counts ready capsules, events included, and not opened ones", () => {
    vi.setSystemTime(T0 + HOUR);
    const opened = { ...inHour, id: "opened", openedAt: T0 + HOUR };
    expect(readyCount([inHour, inTwoHours, eventDone, event, opened], Date.now())).toBe(2);
  });
});
