/**
 * app/lib/sync/syncTables.ts
 * --------------------------------------------------------------------------
 * Backward-compatible synchronization exports derived from the canonical
 * database table-behaviour registry.
 *
 * Do not maintain a second hand-written table inventory here. Add or classify
 * tables only in app/lib/db/core/registry.ts.
 */

import {
  ALL_REGISTERED_TABLES,
  BACKEND_CACHE_TABLES,
  BACKEND_ONLY_TABLES,
  BLOB_TABLES,
  LOCAL_FIRST_SYNC_TABLES,
  LOCAL_ONLY_TABLES,
  PLATFORM_CACHE_TABLES,
  PULL_SYNC_TABLES as REGISTRY_PULL_SYNC_TABLES,
  PUSH_SYNC_TABLES as REGISTRY_PUSH_SYNC_TABLES,
  isBackendOnlyTable as registryIsBackendOnlyTable,
  isBlobTable,
  isLocalOnlyTable as registryIsLocalOnlyTable,
  isPlatformCacheTable,
  isRegisteredTable,
  shouldPullTable,
  shouldPushTable,
  tableKind,
  validateTableRegistry,
  type RegisteredTableName,
} from "../db/core/registry";

export {
  ALL_REGISTERED_TABLES,
  BACKEND_CACHE_TABLES,
  BACKEND_ONLY_TABLES,
  BLOB_TABLES,
  LOCAL_FIRST_SYNC_TABLES,
  LOCAL_ONLY_TABLES,
  PLATFORM_CACHE_TABLES,
  tableKind,
};

export const ALL_KNOWN_DEXIE_TABLES =
  ALL_REGISTERED_TABLES;

export type KnownDexieTableName =
  RegisteredTableName;

export type LocalFirstSyncTableName =
  (typeof LOCAL_FIRST_SYNC_TABLES)[number];
export type BackendCacheTableName =
  (typeof BACKEND_CACHE_TABLES)[number];
export type BackendOnlyTableName =
  (typeof BACKEND_ONLY_TABLES)[number];
export type LocalOnlyTableName =
  | (typeof LOCAL_ONLY_TABLES)[number]
  | (typeof BLOB_TABLES)[number];
export type SyncTableName =
  LocalFirstSyncTableName;

export const SYNC_TABLES: SyncTableName[] = [
  ...LOCAL_FIRST_SYNC_TABLES,
];

export const PUSH_SYNC_TABLES: SyncTableName[] = [
  ...REGISTRY_PUSH_SYNC_TABLES,
];

/**
 * Ordinary SyncRecord pulls are local-first only. Platform cache records are
 * accepted separately by applyPlatformCacheRecords().
 */
export const PULL_SYNC_TABLES = [
  ...REGISTRY_PULL_SYNC_TABLES,
] as const;

export type PullSyncTableName =
  (typeof PULL_SYNC_TABLES)[number];

export const BROWSER_READABLE_TABLES = [
  ...LOCAL_FIRST_SYNC_TABLES,
  ...BACKEND_CACHE_TABLES,
] as const;

export type BrowserReadableTableName =
  (typeof BROWSER_READABLE_TABLES)[number];

export const NEVER_PUSH_TABLES = [
  ...BACKEND_CACHE_TABLES,
  ...BACKEND_ONLY_TABLES,
  ...LOCAL_ONLY_TABLES,
  ...BLOB_TABLES,
] as const;

export type NeverPushTableName =
  (typeof NEVER_PUSH_TABLES)[number];

export const MAP_LOCATION_FIELDS = [
  "latitude",
  "longitude",
  "altitudeMeters",
  "accuracyMeters",
  "geohash",
  "locationLabel",
  "formattedAddress",
  "locationSource",
  "locationPrecision",
  "locationCapturedAt",
  "mapVisible",
] as const;

export type MapLocationField =
  (typeof MAP_LOCATION_FIELDS)[number];

export const LOCATION_AWARE_SYNC_TABLES = [
  "schools",
  "branches",
  "students",
  "teachers",
  "parents",
  "attendanceCaptureEvents",
  "identityDevices",
  "identityAccessPoints",
  "identityActivityEvents",
  "transportStops",
  "transportJourneyEvents",
] as const satisfies readonly LocalFirstSyncTableName[];

export type LocationAwareSyncTableName =
  (typeof LOCATION_AWARE_SYNC_TABLES)[number];

export const KNOWN_DEXIE_TABLE_SET =
  new Set<string>(ALL_KNOWN_DEXIE_TABLES);
export const SYNC_TABLE_SET =
  new Set<string>(SYNC_TABLES);
export const PUSH_SYNC_TABLE_SET =
  new Set<string>(PUSH_SYNC_TABLES);
export const LOCAL_FIRST_SYNC_TABLE_SET =
  new Set<string>(LOCAL_FIRST_SYNC_TABLES);
export const BACKEND_CACHE_TABLE_SET =
  new Set<string>(BACKEND_CACHE_TABLES);
export const BACKEND_ONLY_TABLE_SET =
  new Set<string>(BACKEND_ONLY_TABLES);
export const LOCAL_ONLY_TABLE_SET =
  new Set<string>([
    ...LOCAL_ONLY_TABLES,
    ...BLOB_TABLES,
  ]);
export const PULL_SYNC_TABLE_SET =
  new Set<string>(PULL_SYNC_TABLES);
export const BROWSER_READABLE_TABLE_SET =
  new Set<string>(BROWSER_READABLE_TABLES);
export const NEVER_PUSH_TABLE_SET =
  new Set<string>(NEVER_PUSH_TABLES);
export const LOCATION_AWARE_SYNC_TABLE_SET =
  new Set<string>(LOCATION_AWARE_SYNC_TABLES);

export function isKnownDexieTable(
  tableName: string,
): tableName is KnownDexieTableName {
  return isRegisteredTable(tableName);
}

export function isSyncTable(
  tableName: string,
): tableName is SyncTableName {
  return shouldPullTable(tableName);
}

export function isLocalFirstSyncTable(
  tableName: string,
): tableName is LocalFirstSyncTableName {
  return tableKind(tableName) === "local_first";
}

export function isPushSyncTable(
  tableName: string,
): tableName is SyncTableName {
  return shouldPushTable(tableName);
}

export function isPullSyncTable(
  tableName: string,
): tableName is PullSyncTableName {
  return shouldPullTable(tableName);
}

export function isBrowserReadableTable(
  tableName: string,
): tableName is BrowserReadableTableName {
  return (
    shouldPullTable(tableName) ||
    isPlatformCacheTable(tableName)
  );
}

export function isBackendCacheTable(
  tableName: string,
): tableName is BackendCacheTableName {
  return isPlatformCacheTable(tableName);
}

export function isBackendOnlyTable(
  tableName: string,
): tableName is BackendOnlyTableName {
  return registryIsBackendOnlyTable(tableName);
}

export function isLocalOnlyTable(
  tableName: string,
): tableName is LocalOnlyTableName {
  return (
    registryIsLocalOnlyTable(tableName) ||
    isBlobTable(tableName)
  );
}

export function isNeverPushTable(
  tableName: string,
): tableName is NeverPushTableName {
  return !shouldPushTable(tableName);
}

export function isLocationAwareSyncTable(
  tableName: string,
): tableName is LocationAwareSyncTableName {
  return LOCATION_AWARE_SYNC_TABLE_SET.has(tableName);
}

export const BACKEND_DRIVEN_TABLES =
  BACKEND_CACHE_TABLES;
export type BackendDrivenTableName =
  BackendCacheTableName;
export const BACKEND_DRIVEN_TABLE_SET =
  BACKEND_CACHE_TABLE_SET;
export const BACKEND_DRIVEN_TABLE_SET_ALIAS =
  BACKEND_CACHE_TABLE_SET;

export function isBackendDrivenTable(
  tableName: string,
): tableName is BackendDrivenTableName {
  return isBackendCacheTable(tableName);
}

export function getSyncTables(options?: {
  include?: readonly string[];
  exclude?: readonly string[];
}): SyncTableName[] {
  return filterTables(
    SYNC_TABLES,
    options,
  ) as SyncTableName[];
}

export function getPullSyncTables(options?: {
  include?: readonly string[];
  exclude?: readonly string[];
}): PullSyncTableName[] {
  return filterTables(
    PULL_SYNC_TABLES,
    options,
  ) as PullSyncTableName[];
}

function filterTables(
  source: readonly string[],
  options?: {
    include?: readonly string[];
    exclude?: readonly string[];
  },
) {
  let tables = [...source];

  if (options?.include?.length) {
    const include = new Set(options.include);
    tables = tables.filter((table) =>
      include.has(table),
    );
  }

  if (options?.exclude?.length) {
    const exclude = new Set(options.exclude);
    tables = tables.filter((table) =>
      !exclude.has(table),
    );
  }

  return tables;
}

export type SyncTableRegistryValidation = {
  ok: boolean;
  missingTables: string[];
  multiplyClassifiedTables: string[];
  unknownClassifiedTables: string[];
  duplicateEntriesWithinLists: Record<string, string[]>;
  classificationByTable: Record<string, string[]>;
  issues: string[];
};

export function validateSyncTableRegistry():
  SyncTableRegistryValidation {
  const issues = validateTableRegistry();
  const classificationByTable: Record<
    string,
    string[]
  > = {};

  const groups: Array<[
    string,
    readonly string[],
  ]> = [
    ["local_first", LOCAL_FIRST_SYNC_TABLES],
    ["backend_cache", BACKEND_CACHE_TABLES],
    ["backend_only", BACKEND_ONLY_TABLES],
    ["local_only", LOCAL_ONLY_TABLES],
    ["blob", BLOB_TABLES],
  ];

  const duplicateEntriesWithinLists:
    Record<string, string[]> = {};

  for (const [name, tables] of groups) {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const table of tables) {
      (classificationByTable[table] ??= []).push(name);
      if (seen.has(table)) duplicates.add(table);
      seen.add(table);
    }

    if (duplicates.size) {
      duplicateEntriesWithinLists[name] = [
        ...duplicates,
      ].sort();
    }
  }

  const multiplyClassifiedTables =
    Object.entries(classificationByTable)
      .filter(([, owners]) => owners.length > 1)
      .map(([table]) => table)
      .sort();

  return {
    ok:
      issues.length === 0 &&
      multiplyClassifiedTables.length === 0 &&
      !Object.keys(duplicateEntriesWithinLists).length,
    missingTables: [],
    multiplyClassifiedTables,
    unknownClassifiedTables: [],
    duplicateEntriesWithinLists,
    classificationByTable,
    issues,
  };
}

export function assertValidSyncTableRegistry() {
  const result = validateSyncTableRegistry();

  if (!result.ok) {
    throw new Error(
      [
        "Invalid Eleeveon sync table registry:",
        ...result.issues.map((issue) => `- ${issue}`),
        ...result.multiplyClassifiedTables.map(
          (table) => `- ${table} is multiply classified.`,
        ),
      ].join("\\n"),
    );
  }

  return result;
}

export function warnIfSyncTableRegistryInvalid() {
  const result = validateSyncTableRegistry();

  if (!result.ok && typeof console !== "undefined") {
    console.error(
      "[sync] invalid table registry",
      result,
    );
  }

  return result;
}
