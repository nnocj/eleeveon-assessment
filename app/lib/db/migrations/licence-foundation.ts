/** Platform V2 connected/offline licence cache normalization. */
import type { Transaction } from "dexie";
import type { DataRepairLog, LocalMigrationJournal } from "../db-migrations";

export const LICENCE_FOUNDATION_MIGRATION_NAME = "platform-v2-licence-foundation";
function now() { return Date.now(); }
function hasTable(tx: Transaction, name: string) { return tx.db.tables.some((t) => t.name === name); }
function text(v: unknown) { return typeof v === "string" && v.trim() ? v.trim() : undefined; }
async function logRepair(tx: Transaction, repair: Omit<DataRepairLog, "id">) { if (hasTable(tx, "dataRepairLogs")) await tx.table("dataRepairLogs").add(repair); }

export async function migrateLicenceFoundation(tx: Transaction): Promise<void> {
  const startedAt = now();
  let journalId: number | undefined;
  let affectedRecords = 0;

  if (hasTable(tx, "migrationJournal")) {
    journalId = await tx.table("migrationJournal").add({
      version: 3,
      name: LICENCE_FOUNDATION_MIGRATION_NAME,
      description: "Normalizes commercial plan, subscription and entitlement caches for connected and offline licences.",
      category: "data",
      startedAt,
      status: "running",
      affectedTables: ["commercialPlans", "subscriptionPlans", "accountSubscriptions", "accountEntitlements", "perpetualLicenses"],
      affectedRecords: 0,
      rollbackSupported: false,
    } satisfies LocalMigrationJournal);
  }

  const planTable = hasTable(tx, "commercialPlans") ? "commercialPlans" : hasTable(tx, "subscriptionPlans") ? "subscriptionPlans" : null;
  if (planTable) {
    await tx.table(planTable).toCollection().modify(async (record: Record<string, unknown>) => {
      const patch: Record<string, unknown> = {};
      if (!text(record.licenseModel)) patch.licenseModel = "subscription";
      if (!text(record.deploymentMode)) patch.deploymentMode = "connected";
      if (!text(record.syncPolicy)) patch.syncPolicy = "full";
      if (!text(record.updatePolicy)) patch.updatePolicy = "continuous";
      if (typeof record.priceOneTime !== "number") patch.priceOneTime = 0;
      if (typeof record.requiresPeriodicValidation !== "boolean") patch.requiresPeriodicValidation = false;
      if (typeof record.offlineGraceDays !== "number") patch.offlineGraceDays = 0;
      if (!Object.keys(patch).length) return;
      Object.assign(record, patch);
      affectedRecords += 1;
      await logRepair(tx, { migrationVersion: 3, migrationName: LICENCE_FOUNDATION_MIGRATION_NAME, tableName: planTable, entityId: text(record.id), repairType: "initialize-commercial-plan-policy", status: "applied", repairedAt: now(), repairedBy: "migration", newValue: patch });
    });
  }

  if (hasTable(tx, "accountEntitlements")) {
    await tx.table("accountEntitlements").toCollection().modify(async (record: Record<string, unknown>) => {
      const patch: Record<string, unknown> = {};
      const perpetual = text(record.source) === "perpetual_license";
      if (!text(record.licenseModel)) patch.licenseModel = perpetual ? "perpetual" : "subscription";
      if (!text(record.deploymentMode)) patch.deploymentMode = perpetual ? "offline" : "connected";
      if (!text(record.syncPolicy)) patch.syncPolicy = perpetual ? "platform_only" : "full";
      if (!text(record.updatePolicy)) patch.updatePolicy = perpetual ? "version_locked" : "continuous";
      if (!Object.keys(patch).length) return;
      Object.assign(record, patch);
      affectedRecords += 1;
      await logRepair(tx, { migrationVersion: 3, migrationName: LICENCE_FOUNDATION_MIGRATION_NAME, tableName: "accountEntitlements", entityId: text(record.id), repairType: "initialize-entitlement-access-policy", status: "applied", repairedAt: now(), repairedBy: "migration", newValue: patch });
    });
  }

  if (journalId !== undefined && hasTable(tx, "migrationJournal")) {
    const completedAt = now();
    await tx.table("migrationJournal").update(journalId, { status: "completed", completedAt, durationMs: completedAt - startedAt, affectedRecords });
  }
}
