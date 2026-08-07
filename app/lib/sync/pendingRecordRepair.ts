import { db } from "../db/db";
import {
  assertAccountId,
  createFallbackUuid,
  getDeviceId,
  SYNC_STATUS_VALUE,
} from "./syncConfig";
import { auditPendingSyncRecords } from "./pendingRecordAudit";

export type PendingRecordRepairResult = {
  accountId: string;
  repaired: number;
  skipped: number;
  errors: string[];
  changedTables: string[];
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validUuid = (value: unknown) => UUID_PATTERN.test(String(value ?? "").trim());

async function inferAssessmentScope(row: any) {
  const structureId = String(row.assessmentStructureId ?? row.id ?? "").trim();
  if (!structureId) return {};
  const structure = await (db as any).assessmentStructures?.get(structureId).catch(() => null);
  return structure ? { schoolId: structure.schoolId, branchId: structure.branchId } : {};
}

async function inferBranchScope(accountId: string, row: any) {
  if (validUuid(row.branchId)) {
    const branch = await (db as any).branches?.get(row.branchId).catch(() => null);
    return branch ? { branchId: branch.id, schoolId: branch.schoolId } : {};
  }
  const branches = await (db as any).branches?.where("accountId").equals(accountId).toArray().catch(() => []);
  const active = branches.filter((branch: any) => !branch.isDeleted && branch.active !== false);
  return active.length === 1 ? { branchId: active[0].id, schoolId: active[0].schoolId } : {};
}

export async function repairPendingSyncRecords(): Promise<PendingRecordRepairResult> {
  const accountId = assertAccountId();
  const deviceId = getDeviceId();
  const audit = await auditPendingSyncRecords();
  const changedTables = new Set<string>();
  const errors: string[] = [];
  let repaired = 0;
  let skipped = 0;

  for (const [tableName, items] of Object.entries(audit.byTable)) {
    const table = (db as any)[tableName];
    if (!table) continue;

    for (const item of items) {
      const row = await table.get(item.id).catch(() => null);
      if (!row) { skipped += 1; continue; }
      if (!validUuid(row.id)) {
        skipped += 1;
        errors.push(`${tableName} #${row.id}: invalid entity UUID requires a relationship-aware migration.`);
        continue;
      }

      const patch: Record<string, unknown> = {};
      if (!validUuid(row.accountId)) patch.accountId = accountId;
      if (!Number.isFinite(Number(row.updatedAt)) || Number(row.updatedAt) <= 0) patch.updatedAt = Date.now();
      if (!Number.isFinite(Number(row.createdAt)) || Number(row.createdAt) <= 0) patch.createdAt = Date.now();
      if (!Number.isFinite(Number(row.version)) || Number(row.version) <= 0) patch.version = 1;
      if (!String(row.deviceId ?? "").trim()) patch.deviceId = deviceId;
      if (!String(row.createdByDeviceId ?? "").trim()) patch.createdByDeviceId = deviceId;
      patch.updatedByDeviceId = deviceId;

      if (tableName === "assessmentStructureItems") {
        Object.assign(patch, await inferAssessmentScope(row));
      }
      if (tableName === "assessmentStructures" && !validUuid(row.schoolId)) {
        const schools = await (db as any).schools?.where("accountId").equals(accountId).toArray().catch(() => []);
        const active = schools.filter((school: any) => !school.isDeleted && school.active !== false);
        if (active.length === 1) patch.schoolId = active[0].id;
      }
      if (tableName === "schoolBranchSettings") {
        Object.assign(patch, await inferBranchScope(accountId, row));
      }
      if (tableName === "mediaAssets") {
        const ownerId = String(row.ownerId ?? row.ownerLocalId ?? "").trim();
        const ownerTempKey = String(row.ownerTempKey ?? "").trim();
        if (ownerId) patch.ownerId = ownerId;
        const ownerIdentity = ownerId || ownerTempKey;
        if (row.accountId && row.ownerTable && ownerIdentity && row.fieldKey) {
          patch.ownerIdentityKey = [row.accountId, row.ownerTable, ownerIdentity, row.fieldKey].join(":");
          patch.identityVersion = 1;
        }
      }

      patch.synced = SYNC_STATUS_VALUE.PENDING;
      patch.syncError = undefined;
      patch.updatedAt = Date.now();
      patch.version = Math.max(1, Number(row.version || 0) + 1);

      try {
        await table.update(row.id, patch);
        repaired += 1;
        changedTables.add(tableName);
      } catch (error) {
        skipped += 1;
        errors.push(`${tableName} #${row.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  return { accountId, repaired, skipped, errors, changedTables: [...changedTables] };
}
