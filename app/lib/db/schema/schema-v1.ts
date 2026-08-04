/** Frozen historical Dexie schema version 1. */
import { LEGACY_DB_STORES } from "./legacy-stores";

export const SCHEMA_V1_VERSION = 1 as const;
export const SCHEMA_V1_STORES: Readonly<Record<string, string>> =
  Object.freeze({ ...LEGACY_DB_STORES });
export type SchemaV1TableName = keyof typeof SCHEMA_V1_STORES;
