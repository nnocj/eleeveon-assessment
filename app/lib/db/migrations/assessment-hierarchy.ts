/** Platform V2 assessment hierarchy normalization. */
import type { Transaction } from "dexie";
import type { DataRepairLog, LocalMigrationJournal } from "../db-migrations";

export const ASSESSMENT_HIERARCHY_MIGRATION_NAME = "platform-v2-assessment-hierarchy";

function now() { return Date.now(); }
function hasTable(tx: Transaction, name: string) { return tx.db.tables.some((t) => t.name === name); }
function text(v: unknown) { return typeof v === "string" && v.trim() ? v.trim() : undefined; }

async function logRepair(tx: Transaction, repair: Omit<DataRepairLog, "id">) {
  if (hasTable(tx, "dataRepairLogs")) await tx.table("dataRepairLogs").add(repair);
}

export async function migrateAssessmentHierarchy(tx: Transaction): Promise<void> {
  if (!hasTable(tx, "assessmentStructureItems")) return;
  const startedAt = now();
  let journalId: number | undefined;
  let affectedRecords = 0;

  if (hasTable(tx, "migrationJournal")) {
    journalId = await tx.table("migrationJournal").add({
      version: 3,
      name: ASSESSMENT_HIERARCHY_MIGRATION_NAME,
      description: "Initializes hierarchical fields on existing assessment structure items.",
      category: "data",
      startedAt,
      status: "running",
      affectedTables: ["assessmentStructureItems"],
      affectedRecords: 0,
      rollbackSupported: false,
    } satisfies LocalMigrationJournal);
  }

  await tx.table("assessmentStructureItems").toCollection().modify(async (record: Record<string, unknown>) => {
    const itemId = text(record.id);
    const structureId = text(record.assessmentStructureId);
    if (!itemId || !structureId) return;
    const patch: Record<string, unknown> = {};
    if (record.parentItemId === undefined) patch.parentItemId = null;
    if (typeof record.level !== "number" || record.level < 0) patch.level = 0;
    if (!text(record.path)) patch.path = `${structureId}/${itemId}`;
    if (!text(record.itemType)) patch.itemType = "scored_item";
    if (!text(record.aggregationMode)) patch.aggregationMode = "sum";
    if (!text(record.reportVisibility)) patch.reportVisibility = "show";
    if (!text(record.entryMode)) patch.entryMode = "direct";
    if (typeof record.allowChildEntry !== "boolean") patch.allowChildEntry = false;
    if (typeof record.showChildrenOnReport !== "boolean") patch.showChildrenOnReport = false;
    if (typeof record.showParentOnReport !== "boolean") patch.showParentOnReport = true;
    if (typeof record.contributionWeight !== "number") patch.contributionWeight = typeof record.weight === "number" ? record.weight : 0;
    if (!Object.keys(patch).length) return;
    Object.assign(record, patch);
    affectedRecords += 1;
    await logRepair(tx, {
      migrationVersion: 3,
      migrationName: ASSESSMENT_HIERARCHY_MIGRATION_NAME,
      tableName: "assessmentStructureItems",
      entityId: itemId,
      repairType: "initialize-assessment-hierarchy-root",
      status: "applied",
      repairedAt: now(),
      repairedBy: "migration",
      newValue: patch,
    });
  });

  if (journalId !== undefined && hasTable(tx, "migrationJournal")) {
    const completedAt = now();
    await tx.table("migrationJournal").update(journalId, { status: "completed", completedAt, durationMs: completedAt - startedAt, affectedRecords });
  }
}
