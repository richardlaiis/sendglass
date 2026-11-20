import { describe, expect, it } from "vitest";
import { parseHash, routeToHash, type Route } from "./routes";

describe("parseHash", () => {
  it("parses every route", () => {
    expect(parseHash("#/")).toEqual({ name: "home" });
    expect(parseHash("")).toEqual({ name: "home" });
    expect(parseHash("#/new")).toEqual({ name: "new" });
    expect(parseHash("#/history")).toEqual({ name: "history" });
    expect(parseHash("#/settings/")).toEqual({ name: "settings" });
    expect(parseHash("#/capsule/abc-123")).toEqual({ name: "capsule", id: "abc-123" });
  });

  it("falls back to home for unknown routes", () => {
    expect(parseHash("#/nope")).toEqual({ name: "home" });
    expect(parseHash("#/capsule/")).toEqual({ name: "home" });
    expect(parseHash("#/capsule/a/b")).toEqual({ name: "home" });
  });

  it("round-trips through routeToHash", () => {
    const routes: Route[] = [
      { name: "home" },
      { name: "new" },
      { name: "history" },
      { name: "settings" },
      { name: "capsule", id: "a b/c" },
    ];
    for (const r of routes) expect(parseHash(routeToHash(r))).toEqual(r);
  });
});
