/** Backend-owned, account-scoped platform-cache application. */

import { db } from "../db/db";
import {
  assertAccountId,
  type CachePullRecord,
  getDeviceId,
  getLastPlatformCacheAt,
  type PlatformCacheResponse,
  setLastPlatformCacheAt,
  SYNC_ENDPOINTS,
} from "./syncConfig";
import { syncHttp } from "./syncHttp";
import { isBackendCacheTable } from "./syncTables";

export type PlatformCacheResult = {
  updated: number;
  skipped: number;
  errors: string[];
  changedTables: string[];
};

const SENSITIVE_FIELDS = new Set([
  "passwordHash",
  "secret",
  "secretHash",
  "apiKey",
  "apiKeyHash",
  "token",
  "refreshToken",
  "accessToken",
  "privateKey",
  "licenseSecret",
]);

function sanitizeCacheValue(
  value: unknown,
  seen = new WeakSet<object>(),
): unknown {
  if (value == null) return value;
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeCacheValue(item, seen));
  }
  if (typeof value !== "object") return undefined;
  if (seen.has(value as object)) return undefined;
  seen.add(value as object);

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key)) continue;
    const safe = sanitizeCacheValue(child, seen);
    if (safe !== undefined) output[key] = safe;
  }
  return output;
}

function normalizeCachePayload(
  record: CachePullRecord,
  activeAccountId: string,
) {
  const raw = sanitizeCacheValue(record.payload || {});
  const payload =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? { ...(raw as Record<string, unknown>) }
      : {};

  const id =
    record.id ??
    record.cloudId ??
    payload.id ??
    payload.accountId;

  if (id != null) payload.id = String(id);

  const recordAccountId =
    record.accountId ?? payload.accountId;

  if (
    recordAccountId != null &&
    String(recordAccountId) !== activeAccountId
  ) {
    throw new Error(
      `Rejected platform-cache record for another account (${String(recordAccountId)}).`,
    );
  }

  if (!payload.accountId) payload.accountId = activeAccountId;
  if (record.updatedAt != null && payload.updatedAt == null) {
    payload.updatedAt = Number(record.updatedAt);
  }

  return payload;
}

export async function applyPlatformCacheRecords(
  records: CachePullRecord[] = [],
): Promise<PlatformCacheResult> {
  const accountId = assertAccountId();
  const errors: string[] = [];
  const changedTables = new Set<string>();
  let updated = 0;
  let skipped = 0;

  const accepted = records.filter(
    (record) =>
      Boolean(record?.tableName) &&
      isBackendCacheTable(record.tableName),
  );

  await db.transaction(
    "rw",
    [...new Set(accepted.map((record) => record.tableName))]
      .map((name) => db.tables.find((table) => table.name === name))
      .filter(Boolean) as typeof db.tables,
    async () => {
      for (const record of records) {
        try {
          if (!record?.tableName || !isBackendCacheTable(record.tableName)) {
            skipped += 1;
            continue;
          }

          const table = db.tables.find(
            (candidate) => candidate.name === record.tableName,
          );

          if (!table) {
            skipped += 1;
            errors.push(`${record.tableName}: registered cache table is missing from Dexie.`);
            continue;
          }

          const payload = normalizeCachePayload(record, accountId);
          const id = payload.id;

          if (!id) {
            skipped += 1;
            errors.push(`${record.tableName}: cache record has no stable id.`);
            continue;
          }

          if (record.isDeleted) {
            await table.delete(id as string);
          } else {
            await table.put(payload);
          }

          updated += 1;
          changedTables.add(record.tableName);
        } catch (error) {
          errors.push(
            `${record?.tableName || "unknown"}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    },
  );

  return {
    updated,
    skipped,
    errors,
    changedTables: [...changedTables],
  };
}

function responseRecords(response: PlatformCacheResponse) {
  return [
    ...(response.records || []),
    ...(response.cacheRecords || []),
    ...(response.platformRecords || []),
  ];
}

export async function refreshPlatformCache(options?: {
  silent?: boolean;
}): Promise<PlatformCacheResult> {
  try {
    const accountId = assertAccountId();
    const response = await syncHttp<PlatformCacheResponse>(
      SYNC_ENDPOINTS.PLATFORM_CACHE,
      {
        method: "POST",
        body: {
          accountId,
          deviceId: getDeviceId(),
          since: getLastPlatformCacheAt(),
        },
      },
    );

    const result = await applyPlatformCacheRecords(responseRecords(response));
    if (response.serverTime && !result.errors.length) {
      setLastPlatformCacheAt(Number(response.serverTime));
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options?.silent || /404|not found|Cannot POST|Cannot GET/i.test(message)) {
      return { updated: 0, skipped: 0, errors: [], changedTables: [] };
    }
    return { updated: 0, skipped: 0, errors: [message], changedTables: [] };
  }
}

export async function bootstrapAccountContext(options?: { silent?: boolean }) {
  try {
    const accountId = assertAccountId();
    const response = await syncHttp<PlatformCacheResponse>(
      SYNC_ENDPOINTS.BOOTSTRAP,
      {
        method: "POST",
        body: { accountId, deviceId: getDeviceId() },
      },
    );
    return applyPlatformCacheRecords(responseRecords(response));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options?.silent || /404|not found|Cannot POST|Cannot GET/i.test(message)) {
      return { updated: 0, skipped: 0, errors: [], changedTables: [] };
    }
    return { updated: 0, skipped: 0, errors: [message], changedTables: [] };
  }
}
