/** Historical Eleeveon database version 1 to version 2 migration. */
import type { Transaction } from "dexie";
import type { DataRepairLog, LocalMigrationJournal } from "../db-migrations";

export const V1_TO_V2_MIGRATION_NAME = "v1-to-v2-website-template-foundation";

function now() { return Date.now(); }
function hasTable(tx: Transaction, name: string) { return tx.db.tables.some((t) => t.name === name); }

async function addRepair(tx: Transaction, repair: Omit<DataRepairLog, "id">) {
  if (hasTable(tx, "dataRepairLogs")) await tx.table("dataRepairLogs").add(repair);
}

export async function migrateV1ToV2(tx: Transaction): Promise<void> {
  const startedAt = now();
  let journalId: number | undefined;
  let affectedRecords = 0;

  if (hasTable(tx, "migrationJournal")) {
    journalId = await tx.table("migrationJournal").add({
      version: 2,
      name: V1_TO_V2_MIGRATION_NAME,
      description: "Normalizes website settings and portal highlights for schema version 2.",
      category: "data",
      startedAt,
      status: "running",
      affectedTables: ["websiteSettings", "portalHighlights", "websiteTemplateSettings", "websiteTemplateAssignments"],
      affectedRecords: 0,
      rollbackSupported: false,
    } satisfies LocalMigrationJournal);
  }

  if (hasTable(tx, "websiteSettings")) {
    await tx.table("websiteSettings").toCollection().modify(async (record: Record<string, unknown>) => {
      const patch: Record<string, unknown> = {};
      if (!record.status) patch.status = "draft";
      if (!record.defaultLanguage) patch.defaultLanguage = "en";
      if (!Array.isArray(record.supportedLanguages)) patch.supportedLanguages = ["en"];
      if (typeof record.searchEngineIndexing !== "boolean") patch.searchEngineIndexing = true;
      if (!Object.keys(patch).length) return;
      Object.assign(record, patch);
      affectedRecords += 1;
      await addRepair(tx, {
        migrationVersion: 2,
        migrationName: V1_TO_V2_MIGRATION_NAME,
        tableName: "websiteSettings",
        entityId: typeof record.id === "string" ? record.id : undefined,
        repairType: "initialize-v2-website-defaults",
        status: "applied",
        repairedAt: now(),
        repairedBy: "migration",
        newValue: patch,
      });
    });
  }

  if (hasTable(tx, "portalHighlights")) {
    await tx.table("portalHighlights").toCollection().modify(async (record: Record<string, unknown>) => {
      const patch: Record<string, unknown> = {};
      if (!record.placement) patch.placement = "hero";
      if (!record.status) patch.status = "draft";
      if (typeof record.displayOrder !== "number") patch.displayOrder = 0;
      if (typeof record.durationSeconds !== "number") patch.durationSeconds = 8;
      if (typeof record.active !== "boolean") patch.active = true;
      if (!Object.keys(patch).length) return;
      Object.assign(record, patch);
      affectedRecords += 1;
      await addRepair(tx, {
        migrationVersion: 2,
        migrationName: V1_TO_V2_MIGRATION_NAME,
        tableName: "portalHighlights",
        entityId: typeof record.id === "string" ? record.id : undefined,
        repairType: "initialize-v2-highlight-defaults",
        status: "applied",
        repairedAt: now(),
        repairedBy: "migration",
        newValue: patch,
      });
    });
  }

  if (journalId !== undefined && hasTable(tx, "migrationJournal")) {
    const completedAt = now();
    await tx.table("migrationJournal").update(journalId, {
      status: "completed",
      completedAt,
      durationMs: completedAt - startedAt,
      affectedRecords,
    });
  }
}
