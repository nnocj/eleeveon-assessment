import { db } from "../db/db";
import { assertAccountId, getDeviceId } from "./syncConfig";
import { validatePushRecord, type SyncIntegrityIssue } from "./syncIntegrity";
import { serializeSyncPayload } from "./prepareSyncData";
import { PUSH_SYNC_TABLES } from "./syncTables";
import { shouldPush } from "./syncUtils";

export type PendingRecordAuditItem = {
  tableName: string;
  id: string;
  label: string;
  status: unknown;
  syncError?: string;
  issues: SyncIntegrityIssue[];
  repairable: boolean;
};

export type PendingRecordAuditReport = {
  accountId: string;
  checkedAt: number;
  total: number;
  valid: number;
  invalid: number;
  byTable: Record<string, PendingRecordAuditItem[]>;
};

function labelFor(row: Record<string, unknown>) {
  return String(row.name ?? row.title ?? row.subject ?? row.code ?? row.id ?? "Record");
}

const SAFE_REPAIR_CODES = new Set([
  "INVALID_VERSION",
  "INVALID_TIMESTAMP",
  "MISSING_SCHOOL_ID",
  "MISSING_BRANCH_ID",
  "INVALID_JSON_PAYLOAD",
]);

export async function auditPendingSyncRecords(): Promise<PendingRecordAuditReport> {
  const accountId = assertAccountId();
  const deviceId = getDeviceId();
  const byTable: Record<string, PendingRecordAuditItem[]> = {};
  let total = 0;
  let valid = 0;
  let invalid = 0;

  for (const tableName of PUSH_SYNC_TABLES) {
    const table = (db as any)[tableName];
    if (!table) continue;
    const rows = await table.toArray();

    for (const row of rows) {
      if (!shouldPush(row, tableName) || row.accountId !== accountId) continue;
      total += 1;
      const id = String(row.id ?? "").trim();
      let payload: Record<string, unknown> = {};
      let serializationIssue: SyncIntegrityIssue | null = null;

      try {
        payload = serializeSyncPayload({ ...row, accountId, deviceId }, { tableName, deviceId });
        delete payload.id;
      } catch (error) {
        serializationIssue = {
          code: "PAYLOAD_SERIALIZATION_ERROR",
          field: "payload",
          message: error instanceof Error ? error.message : String(error),
        };
      }

      const validation = validatePushRecord(
        {
          tableName,
          localId: id,
          cloudId: row.cloudId || undefined,
          accountId,
          deviceId: row.deviceId || deviceId,
          version: Number(row.version),
          updatedAt: Number(row.updatedAt),
          isDeleted: Boolean(row.isDeleted),
          payload,
        },
        accountId,
      );

      const issues = [...validation.issues, ...(serializationIssue ? [serializationIssue] : [])];
      if (issues.length) invalid += 1;
      else valid += 1;

      (byTable[tableName] ??= []).push({
        tableName,
        id,
        label: labelFor(row),
        status: row.synced,
        syncError: typeof row.syncError === "string" ? row.syncError : undefined,
        issues,
        repairable: issues.length > 0 && issues.every((issue) => SAFE_REPAIR_CODES.has(issue.code) || issue.code === "PAYLOAD_SERIALIZATION_ERROR"),
      });
    }
  }

  return { accountId, checkedAt: Date.now(), total, valid, invalid, byTable };
}
