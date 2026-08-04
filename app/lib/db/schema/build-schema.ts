/**
 * app/lib/db/schema/build-schema.ts
 * --------------------------------------------------------------------------
 * Versioned schema composition and validation for Eleeveon Schools.
 */

import {
  LOCAL_SYSTEM_STORES,
} from "../db-migrations";
import {
  validateStoreMap,
} from "../core/indexes";
import {
  DOMAIN_STORES,
  findDuplicateModuleStores,
} from "../modules";
import {
  SCHEMA_V1_STORES,
  SCHEMA_V1_VERSION,
} from "./schema-v1";
import {
  SCHEMA_V2_STORES,
  SCHEMA_V2_VERSION,
} from "./schema-v2";

// ======================================================
// VERSION 3
// ======================================================

export const SCHEMA_V3_VERSION = 3 as const;

/**
 * Platform V2 schema.
 *
 * DOMAIN_STORES contains school-domain and backend-cache module stores.
 * LOCAL_SYSTEM_STORES contains migration, backup, quarantine and health stores.
 */
export const SCHEMA_V3_STORES: Readonly<
  Record<string, string>
> = Object.freeze({
  ...DOMAIN_STORES,
  ...LOCAL_SYSTEM_STORES,
});

// ======================================================
// VERSION REGISTRY
// ======================================================

export interface VersionedDexieSchema {
  version: number;
  stores: Readonly<Record<string, string>>;
  label: string;
}

export const VERSIONED_SCHEMAS = [
  {
    version: SCHEMA_V1_VERSION,
    stores: SCHEMA_V1_STORES,
    label: "Historical baseline",
  },
  {
    version: SCHEMA_V2_VERSION,
    stores: SCHEMA_V2_STORES,
    label: "Pre-Platform-V2",
  },
  {
    version: SCHEMA_V3_VERSION,
    stores: SCHEMA_V3_STORES,
    label: "Platform V2",
  },
] as const satisfies readonly VersionedDexieSchema[];

export type RegisteredSchemaVersion =
  (typeof VERSIONED_SCHEMAS)[number]["version"];

// ======================================================
// BUILD HELPERS
// ======================================================

export function schemaForVersion(
  version: number,
): Readonly<Record<string, string>> {
  const schema = VERSIONED_SCHEMAS.find(
    (entry) => entry.version === version,
  );

  if (!schema) {
    throw new Error(
      `Unsupported Eleeveon database schema version ${version}.`,
    );
  }

  return schema.stores;
}

export function latestSchema():
  Readonly<Record<string, string>> {
  return SCHEMA_V3_STORES;
}

export function latestSchemaVersion(): number {
  return SCHEMA_V3_VERSION;
}

// ======================================================
// VALIDATION
// ======================================================

export interface SchemaValidationResult {
  ok: boolean;
  version: number;
  tableCount: number;
  issues: string[];
}

/**
 * Validates one store map without opening IndexedDB.
 */
export function validateSchema(
  version: number,
  stores: Readonly<Record<string, string>>,
): SchemaValidationResult {
  const issues = validateStoreMap({
    ...stores,
  });

  return {
    ok: issues.length === 0,
    version,
    tableCount: Object.keys(stores).length,
    issues,
  };
}

/**
 * Validates every registered version and checks current module ownership.
 */
export function validateAllSchemas():
  SchemaValidationResult[] {
  const duplicateModuleStores =
    findDuplicateModuleStores();

  const results = VERSIONED_SCHEMAS.map(
    ({ version, stores }) =>
      validateSchema(version, stores),
  );

  if (duplicateModuleStores.length) {
    const current = results.find(
      (result) =>
        result.version === SCHEMA_V3_VERSION,
    );

    current?.issues.push(
      ...duplicateModuleStores.map(
        (tableName) =>
          `Table ${tableName} is declared by more than one database module.`,
      ),
    );

    if (current) current.ok = false;
  }

  return results;
}

/**
 * Throws during development when the current schema is malformed.
 */
export function assertValidLatestSchema(): void {
  const result = validateSchema(
    SCHEMA_V3_VERSION,
    SCHEMA_V3_STORES,
  );

  const duplicateModuleStores =
    findDuplicateModuleStores();

  if (duplicateModuleStores.length) {
    result.issues.push(
      ...duplicateModuleStores.map(
        (tableName) =>
          `Duplicate module store: ${tableName}.`,
      ),
    );
    result.ok = false;
  }

  if (!result.ok) {
    throw new Error(
      [
        "Invalid Eleeveon Platform V2 Dexie schema:",
        ...result.issues.map(
          (issue) => `- ${issue}`,
        ),
      ].join("\n"),
    );
  }
}

// ======================================================
// DEXIE REGISTRATION
// ======================================================

/**
 * Minimal structural contract required by registerSchemas().
 *
 * Using this interface keeps build-schema.ts independent of the concrete
 * EleeveonDatabase class and avoids importing the database singleton.
 */
export interface DexieSchemaRegistrar {
  version(
    versionNumber: number,
  ): {
    stores(
      schema: Record<string, string>,
    ): unknown;
  };
}

/**
 * Registers every historical schema in ascending order.
 *
 * Example:
 *
 *   registerSchemas(this);
 */
export function registerSchemas(
  database: DexieSchemaRegistrar,
): void {
  for (const schema of VERSIONED_SCHEMAS) {
    database
      .version(schema.version)
      .stores({
        ...schema.stores,
      });
  }
}
