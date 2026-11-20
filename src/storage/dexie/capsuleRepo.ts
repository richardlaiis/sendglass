import type { Capsule } from "../../domain/types";
import type { CapsuleChanges, CapsuleRepository, ImportResult } from "../repositories";
import type { SendglassDB } from "./db";

export function createDexieCapsuleRepository(db: SendglassDB): CapsuleRepository {
  return {
    async list() {
      return db.capsules.orderBy("createdAt").toArray();
    },
    async get(id) {
      return db.capsules.get(id);
    },
    async create(capsule) {
      await db.capsules.add(capsule);
    },
    async update(id: string, changes: CapsuleChanges) {
      const count = await db.capsules.update(id, changes);
      if (count === 0 && !(await db.capsules.get(id))) {
        throw new Error(`Capsule not found: ${id}`);
      }
    },
    async delete(id) {
      await db.capsules.delete(id);
    },
    async exportAll() {
      return db.capsules.orderBy("createdAt").toArray();
    },
    async importAll(capsules: readonly Capsule[]): Promise<ImportResult> {
      return db.transaction("rw", db.capsules, async () => {
        const existing = await db.capsules.bulkGet(capsules.map((c) => c.id));
        const seen = new Set<string>();
        const fresh: Capsule[] = [];
        capsules.forEach((c, i) => {
          if (existing[i] === undefined && !seen.has(c.id)) fresh.push(c);
          seen.add(c.id);
        });
        await db.capsules.bulkAdd(fresh);
        return { imported: fresh.length, skipped: capsules.length - fresh.length };
      });
    },
  };
}
