import type { Repositories } from "../repositories";
import { createDexieCapsuleRepository } from "./capsuleRepo";
import { SendglassDB } from "./db";
import { createDexieSettingsRepository } from "./settingsRepo";

export function createDexieRepositories(db = new SendglassDB()): Repositories {
  return {
    capsules: createDexieCapsuleRepository(db),
    settings: createDexieSettingsRepository(db),
  };
}
