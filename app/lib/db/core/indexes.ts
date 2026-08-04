/**
 * app/lib/db/core/indexes.ts
 * --------------------------------------------------------------------------
 * Reusable Dexie index fragments and safe composition helpers.
 *
 * Dexie store definitions are strings. These helpers keep frequently repeated
 * identity/scope/index groups consistent across domain schema modules.
 */

// ======================================================
// INDEX FRAGMENTS
// ======================================================

export const INDEX_FRAGMENTS = {
  primaryId: ["id"],

  syncIdentity: [
    "accountId",
    "updatedAt",
    "synced",
    "isDeleted",
  ],

  schoolScope: [
    "accountId",
    "schoolId",
  ],

  branchScope: [
    "accountId",
    "schoolId",
    "branchId",
  ],

  lifecycle: [
    "active",
    "createdAt",
    "updatedAt",
  ],

  platformCache: [
    "accountId",
    "createdAt",
    "updatedAt",
  ],
} as const;

// ======================================================
// COMPOSITION
// ======================================================

export type DexieIndexInput =
  | string
  | readonly string[]
  | null
  | undefined
  | false;

/**
 * Joins index fragments while removing blank and duplicate indexes.
 *
 * Compound indexes such as "[accountId+branchId]" are treated as one index.
 */
export function composeIndexes(
  ...inputs: DexieIndexInput[]
): string {
  const indexes: string[] = [];
  const seen = new Set<string>();

  for (const input of inputs) {
    if (!input) continue;

    const values =
      typeof input === "string"
        ? input.split(",")
        : input;

    for (const raw of values) {
      const index = raw.trim();
      if (!index || seen.has(index)) continue;

      seen.add(index);
      indexes.push(index);
    }
  }

  return indexes.join(",");
}

export function syncedIndexes(
  ...extra: DexieIndexInput[]
): string {
  return composeIndexes(
    INDEX_FRAGMENTS.primaryId,
    INDEX_FRAGMENTS.syncIdentity,
    ...extra,
  );
}

export function schoolScopedIndexes(
  ...extra: DexieIndexInput[]
): string {
  return syncedIndexes(
    INDEX_FRAGMENTS.schoolScope,
    "[accountId+schoolId]",
    ...extra,
  );
}

export function branchScopedIndexes(
  ...extra: DexieIndexInput[]
): string {
  return syncedIndexes(
    INDEX_FRAGMENTS.branchScope,
    "[accountId+branchId]",
    "[accountId+schoolId+branchId]",
    ...extra,
  );
}

export function platformCacheIndexes(
  ...extra: DexieIndexInput[]
): string {
  return composeIndexes(
    INDEX_FRAGMENTS.primaryId,
    INDEX_FRAGMENTS.platformCache,
    ...extra,
  );
}

// ======================================================
// VALIDATION / INSPECTION
// ======================================================

export interface ParsedDexieIndex {
  raw: string;
  fields: string[];
  compound: boolean;
  unique: boolean;
  multiEntry: boolean;
  autoIncrement: boolean;
}

export function parseDexieIndexes(
  definition: string,
): ParsedDexieIndex[] {
  return definition
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((raw) => {
      const autoIncrement = raw.startsWith("++");
      const unique =
        raw.startsWith("&") ||
        raw.startsWith("++&");
      const multiEntry = raw.startsWith("*");

      const normalized = raw
        .replace(/^\+\+/, "")
        .replace(/^&/, "")
        .replace(/^\*/, "");

      const compound =
        normalized.startsWith("[") &&
        normalized.endsWith("]");

      const fields = compound
        ? normalized
            .slice(1, -1)
            .split("+")
            .map((field) => field.trim())
            .filter(Boolean)
        : [normalized];

      return {
        raw,
        fields,
        compound,
        unique,
        multiEntry,
        autoIncrement,
      };
    });
}

export function validateStoreDefinition(
  tableName: string,
  definition: string,
): string[] {
  const problems: string[] = [];
  const parsed = parseDexieIndexes(definition);

  if (!parsed.length) {
    problems.push(
      `${tableName} has no primary key or indexes.`,
    );
    return problems;
  }

  const primary = parsed[0];

  if (!primary.fields[0]) {
    problems.push(
      `${tableName} has an invalid primary-key definition.`,
    );
  }

  const duplicates = new Set<string>();
  const seen = new Set<string>();

  for (const index of parsed) {
    if (seen.has(index.raw)) {
      duplicates.add(index.raw);
    }
    seen.add(index.raw);
  }

  for (const duplicate of duplicates) {
    problems.push(
      `${tableName} repeats index ${duplicate}.`,
    );
  }

  return problems;
}

export function validateStoreMap(
  stores: Record<string, string>,
): string[] {
  return Object.entries(stores).flatMap(
    ([tableName, definition]) =>
      validateStoreDefinition(
        tableName,
        definition,
      ),
  );
}
