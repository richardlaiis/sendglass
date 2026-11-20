import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Capsule } from "../../domain/types";
import { HOUR, T0, makeCapsule } from "../../domain/testUtils";
import { DEFAULT_SETTINGS } from "../../domain/types";
import { createDexieCapsuleRepository } from "./capsuleRepo";
import { SendglassDB } from "./db";
import { createDexieSettingsRepository } from "./settingsRepo";

let db: SendglassDB;
let n = 0;

beforeEach(async () => {
  db = new SendglassDB(`test-${n++}`);
  await db.open();
});
afterEach(async () => {
  await db.delete();
});

const a = makeCapsule({ type: "datetime", at: T0 + HOUR }, { id: "a", createdAt: T0 });
const b = makeCapsule({ type: "event", label: "x" }, { id: "b", createdAt: T0 + 1 });

describe("Dexie capsule repository", () => {
  it("creates, lists in creation order, gets and deletes", async () => {
    const repo = createDexieCapsuleRepository(db);
    await repo.create(b);
    await repo.create(a);
    expect((await repo.list()).map((c) => c.id)).toEqual(["a", "b"]);
    expect(await repo.get("b")).toEqual(b);
    await repo.delete("a");
    expect(await repo.get("a")).toBeUndefined();
  });

  it("updates mutable fields", async () => {
    const repo = createDexieCapsuleRepository(db);
    await repo.create(b);
    await repo.update("b", { unlock: { type: "event", label: "x", doneAt: T0 + 5 } });
    expect((await repo.get("b"))?.unlock).toEqual({ type: "event", label: "x", doneAt: T0 + 5 });
  });

  it("throws when updating a missing capsule", async () => {
    const repo = createDexieCapsuleRepository(db);
    await expect(repo.update("nope", { openedAt: T0 })).rejects.toThrow(/not found/);
  });

  it("imports by merging on id, skipping existing and repeated ids", async () => {
    const repo = createDexieCapsuleRepository(db);
    await repo.create(a);
    const changedA: Capsule = { ...a, content: "should not overwrite" };
    const result = await repo.importAll([changedA, b, b]);
    expect(result).toEqual({ imported: 1, skipped: 2 });
    expect((await repo.get("a"))?.content).toBe("hello");
    expect(await repo.exportAll()).toHaveLength(2);
  });
});

describe("Dexie settings repository", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns defaults when nothing is stored", async () => {
    expect(await createDexieSettingsRepository(db).get()).toEqual(DEFAULT_SETTINGS);
  });

  it("merges patches and persists them", async () => {
    const repo = createDexieSettingsRepository(db);
    await repo.set({ theme: "dark" });
    const next = await repo.set({ language: "zh-TW" });
    expect(next).toEqual({ ...DEFAULT_SETTINGS, theme: "dark", language: "zh-TW" });
    expect(await createDexieSettingsRepository(db).get()).toEqual(next);
  });

  it("mirrors theme and language to localStorage for first paint", async () => {
    await createDexieSettingsRepository(db).set({ theme: "light", language: "en" });
    expect(store.get("sendglass.theme")).toBe("light");
    expect(store.get("sendglass.lang")).toBe("en");
  });
});
