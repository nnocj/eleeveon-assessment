import { db } from "../db/db";

import {
  ALL_REGISTERED_TABLES,
  tableKind,
  validateTableRegistry,
} from "../db/core/registry";

export interface SyncRegistryDatabaseAudit {
  ok: boolean;
  dexieTables: string[];
  registeredTables: string[];
  unregisteredDexieTables: string[];
  registeredButMissingDexieTables: string[];
  registryIssues: string[];
}

export function auditSyncRegistryAgainstDatabase():
  SyncRegistryDatabaseAudit {
  const dexieTables: string[] =
    db.tables
      .map((table) => table.name)
      .sort();

  /**
   * Convert the readonly literal-name registry into a normal string array.
   *
   * Without the explicit string type, TypeScript preserves the complete
   * union of registered table-name literals and Set.has() refuses a general
   * string from the runtime Dexie table list.
   */
  const registeredTables: string[] = [
    ...ALL_REGISTERED_TABLES,
  ]
    .map(String)
    .sort();

  const dexieSet = new Set<string>(
    dexieTables,
  );

  const registeredSet =
    new Set<string>(
      registeredTables,
    );

  const unregisteredDexieTables =
    dexieTables.filter(
      (tableName) =>
        !registeredSet.has(
          tableName,
        ),
    );

  const registeredButMissingDexieTables =
    registeredTables.filter(
      (tableName) =>
        !dexieSet.has(
          tableName,
        ) &&
        tableKind(
          tableName,
        ) !== "backend_only",
    );

  const registryIssues =
    validateTableRegistry();

  return {
    ok:
      unregisteredDexieTables.length ===
        0 &&
      registeredButMissingDexieTables.length ===
        0 &&
      registryIssues.length === 0,

    dexieTables,
    registeredTables,
    unregisteredDexieTables,
    registeredButMissingDexieTables,
    registryIssues,
  };
}

export function assertSyncRegistryMatchesDatabase():
  SyncRegistryDatabaseAudit {
  const report =
    auditSyncRegistryAgainstDatabase();

  if (!report.ok) {
    const messages = [
      "The Dexie schema and sync registry do not match.",

      report
        .unregisteredDexieTables
        .length
        ? `Unregistered Dexie tables: ${report.unregisteredDexieTables.join(
            ", ",
          )}.`
        : "",

      report
        .registeredButMissingDexieTables
        .length
        ? `Registered tables missing from Dexie: ${report.registeredButMissingDexieTables.join(
            ", ",
          )}.`
        : "",

      ...report.registryIssues,
    ].filter(Boolean);

    throw new Error(
      messages.join(" "),
    );
  }

  return report;
}