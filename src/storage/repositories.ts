import type { Capsule, Settings } from "../domain/types";

/**
 * Fields that may change after sealing. Title and content are immutable,
 * so they are deliberately not part of this type.
 */
export type CapsuleChanges = Partial<
  Pick<
    Capsule,
    "unlock" | "openedAt" | "openedEarly" | "earlyConfirmations" | "reply" | "notifiedAt"
  >
>;

export interface ImportResult {
  imported: number;
  skipped: number;
}

/** The only way UI code reads or writes capsules. Swap the implementation for a cloud backend later. */
export interface CapsuleRepository {
  list(): Promise<Capsule[]>;
  get(id: string): Promise<Capsule | undefined>;
  create(capsule: Capsule): Promise<void>;
  update(id: string, changes: CapsuleChanges): Promise<void>;
  delete(id: string): Promise<void>;
  exportAll(): Promise<Capsule[]>;
  /** Merges by id: capsules whose id already exists are skipped, never overwritten. */
  importAll(capsules: readonly Capsule[]): Promise<ImportResult>;
}

export interface SettingsRepository {
  get(): Promise<Settings>;
  set(patch: Partial<Settings>): Promise<Settings>;
}

export interface Repositories {
  capsules: CapsuleRepository;
  settings: SettingsRepository;
}
