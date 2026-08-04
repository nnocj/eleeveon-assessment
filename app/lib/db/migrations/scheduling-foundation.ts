/** Platform V2 scheduling relationship and default normalization. */
import type { Transaction } from "dexie";
import type { DataRepairLog, LocalMigrationJournal } from "../db-migrations";

export const SCHEDULING_FOUNDATION_MIGRATION_NAME = "platform-v2-scheduling-foundation";
function now() { return Date.now(); }
function hasTable(tx: Transaction, name: string) { return tx.db.tables.some((t) => t.name === name); }
function text(v: unknown) { return typeof v === "string" && v.trim() ? v.trim() : undefined; }
function relationId(prefix: string, sessionId: string, participantId: string) { return `${prefix}:${sessionId}:${participantId}`; }
async function exists(tx: Transaction, tableName: string, id: string) { return hasTable(tx, tableName) && Boolean(await tx.table(tableName).get(id)); }
async function logRepair(tx: Transaction, repair: Omit<DataRepairLog, "id">) { if (hasTable(tx, "dataRepairLogs")) await tx.table("dataRepairLogs").add(repair); }

export async function migrateSchedulingFoundation(tx: Transaction): Promise<void> {
  if (!hasTable(tx, "scheduleSessions")) return;
  const startedAt = now();
  let journalId: number | undefined;
  let affectedRecords = 0;

  if (hasTable(tx, "migrationJournal")) {
    journalId = await tx.table("migrationJournal").add({
      version: 3,
      name: SCHEDULING_FOUNDATION_MIGRATION_NAME,
      description: "Normalizes existing timetable sessions and creates explicit teacher/resource relationships.",
      category: "data",
      startedAt,
      status: "running",
      affectedTables: ["scheduleSessions", "scheduleSessionTeachers", "scheduleSessionResources"],
      affectedRecords: 0,
      rollbackSupported: false,
    } satisfies LocalMigrationJournal);
  }

  const sessions = await tx.table("scheduleSessions").toArray();
  for (const raw of sessions as Record<string, unknown>[]) {
    if (raw.isDeleted === true) continue;
    const sessionId = text(raw.id), accountId = text(raw.accountId), schoolId = text(raw.schoolId), branchId = text(raw.branchId);
    if (!sessionId || !accountId || !schoolId || !branchId) continue;
    const patch: Record<string, unknown> = {};
    if (!text(raw.status)) patch.status = "scheduled";
    if (typeof raw.active !== "boolean") patch.active = true;
    if (Object.keys(patch).length) {
      await tx.table("scheduleSessions").update(sessionId, patch);
      affectedRecords += 1;
      await logRepair(tx, { migrationVersion: 3, migrationName: SCHEDULING_FOUNDATION_MIGRATION_NAME, tableName: "scheduleSessions", entityId: sessionId, repairType: "initialize-scheduling-session-defaults", status: "applied", repairedAt: now(), repairedBy: "migration", newValue: patch });
    }

    const base = {
      accountId, schoolId, branchId, sessionId,
      active: true, isDeleted: false,
      createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now(),
      updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now(),
      version: 1,
      deviceId: text(raw.deviceId) ?? "migration",
      createdByDeviceId: text(raw.createdByDeviceId) ?? text(raw.deviceId) ?? "migration",
      updatedByDeviceId: text(raw.updatedByDeviceId) ?? text(raw.deviceId) ?? "migration",
      synced: raw.synced ?? 0,
    };

    const teacherId = text(raw.teacherId);
    if (teacherId && hasTable(tx, "scheduleSessionTeachers")) {
      const id = relationId("session-teacher", sessionId, teacherId);
      if (!(await exists(tx, "scheduleSessionTeachers", id))) {
        await tx.table("scheduleSessionTeachers").add({ id, ...base, teacherId, role: "primary", required: true });
        affectedRecords += 1;
      }
    }

    const resourceId = text(raw.resourceId);
    if (resourceId && hasTable(tx, "scheduleSessionResources")) {
      const id = relationId("session-resource", sessionId, resourceId);
      if (!(await exists(tx, "scheduleSessionResources", id))) {
        await tx.table("scheduleSessionResources").add({ id, ...base, resourceId, quantity: 1, required: true });
        affectedRecords += 1;
      }
    }
  }

  if (journalId !== undefined && hasTable(tx, "migrationJournal")) {
    const completedAt = now();
    await tx.table("migrationJournal").update(journalId, { status: "completed", completedAt, durationMs: completedAt - startedAt, affectedRecords });
  }
}
