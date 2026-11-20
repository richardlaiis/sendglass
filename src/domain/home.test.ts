import { describe, expect, it } from "vitest";
import { groupForHome } from "./home";
import { HOUR, T0, makeCapsule } from "./testUtils";

describe("groupForHome", () => {
  const soon = makeCapsule({ type: "datetime", at: T0 + HOUR }, { id: "soon" });
  const later = makeCapsule(
    { type: "interval", durationMs: 5 * HOUR, at: T0 + 5 * HOUR },
    { id: "later" },
  );
  const eventOld = makeCapsule(
    { type: "event", label: "a" },
    { id: "eventOld", createdAt: T0 - HOUR },
  );
  const eventNew = makeCapsule({ type: "event", label: "b" }, { id: "eventNew" });
  const readyTime = makeCapsule(
    { type: "datetime", at: T0 - 2 * HOUR },
    { id: "readyTime", createdAt: T0 - 3 * HOUR },
  );
  const readyEvent = makeCapsule(
    { type: "event", label: "c", doneAt: T0 - HOUR },
    { id: "readyEvent" },
  );
  const opened = makeCapsule(
    { type: "datetime", at: T0 - HOUR },
    { id: "opened", createdAt: T0 - 2 * HOUR, openedAt: T0 },
  );

  const ids = (cs: { id: string }[]) => cs.map((c) => c.id);

  it("sorts sealed by soonest unlock with events last, oldest event first", () => {
    const { sealed } = groupForHome([eventNew, later, eventOld, soon], T0);
    expect(ids(sealed)).toEqual(["soon", "later", "eventOld", "eventNew"]);
  });

  it("puts ready capsules in their own section, earliest first, and drops opened ones", () => {
    const { ready, sealed } = groupForHome([readyEvent, opened, readyTime, soon], T0);
    expect(ids(ready)).toEqual(["readyTime", "readyEvent"]);
    expect(ids(sealed)).toEqual(["soon"]);
  });

  it("moves a capsule from sealed to ready exactly at its unlock moment", () => {
    expect(ids(groupForHome([soon], T0 + HOUR - 1).sealed)).toEqual(["soon"]);
    expect(ids(groupForHome([soon], T0 + HOUR).ready)).toEqual(["soon"]);
  });
});
