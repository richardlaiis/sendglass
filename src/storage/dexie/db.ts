import { Dexie, type EntityTable, type Table } from "dexie";
import type { Capsule } from "../../domain/types";

export interface KeyValue {
  key: string;
  value: unknown;
}

export class SendglassDB extends Dexie {
  capsules!: EntityTable<Capsule, "id">;
  kv!: Table<KeyValue, string>;

  constructor(name = "sendglass") {
    super(name);
    this.version(1).stores({
      capsules: "id, createdAt",
      kv: "key",
    });
  }
}
