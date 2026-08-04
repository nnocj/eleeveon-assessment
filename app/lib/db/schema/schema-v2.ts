/** Frozen pre-Platform-V2 Dexie schema version 2. */
import { LEGACY_DB_STORES } from "./legacy-stores";

export const SCHEMA_V2_VERSION = 2 as const;
export const SCHEMA_V2_STORES: Readonly<Record<string, string>> =
  Object.freeze({ ...LEGACY_DB_STORES });
export type SchemaV2TableName = keyof typeof SCHEMA_V2_STORES;
