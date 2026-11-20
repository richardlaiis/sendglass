import { DEFAULT_SETTINGS, type Settings } from "../../domain/types";
import type { SettingsRepository } from "../repositories";
import { mirrorSettings } from "../settingsMirror";
import type { SendglassDB } from "./db";

const SETTINGS_KEY = "settings";

export function createDexieSettingsRepository(db: SendglassDB): SettingsRepository {
  async function get(): Promise<Settings> {
    const row = await db.kv.get(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...(row?.value as Partial<Settings> | undefined) };
  }

  return {
    get,
    async set(patch) {
      const next = await db.transaction("rw", db.kv, async () => {
        const merged = { ...(await get()), ...patch };
        await db.kv.put({ key: SETTINGS_KEY, value: merged });
        return merged;
      });
      mirrorSettings(next);
      return next;
    },
  };
}
