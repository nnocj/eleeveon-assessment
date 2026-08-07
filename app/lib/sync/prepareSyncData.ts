/**
 * app/lib/sync/prepareSyncData.ts
 * --------------------------------------------------------------------------
 * Produces a JSON-safe transport payload. Local-record metadata is prepared by
 * syncUtils.prepareSyncData(); this file only serializes records for transport.
 */

import { getDeviceId } from "./syncConfig";

const LOCAL_ONLY_FIELDS = new Set([
  "blob", "file", "files", "fileBlob", "arrayBuffer", "buffer", "binary",
  "bytes", "localBlob", "localBlobData", "localBlobId", "localObjectUrl",
  "objectUrl", "previewUrl", "localPreviewUrl", "originalFile",
  "optimizedFile", "rawFile", "base64", "dataUrl",
]);

function jsonSafe(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === undefined) return undefined;
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    return typeof value === "number" && !Number.isFinite(value) ? undefined : value;
  }
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (typeof Blob !== "undefined" && value instanceof Blob) return undefined;
  if (typeof File !== "undefined" && value instanceof File) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => jsonSafe(item, seen)).filter((item) => item !== undefined);
  }
  if (typeof value === "object") {
    if (seen.has(value as object)) return undefined;
    seen.add(value as object);
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (LOCAL_ONLY_FIELDS.has(key)) continue;
      const safe = jsonSafe(child, seen);
      if (safe !== undefined) output[key] = safe;
    }
    return output;
  }
  return undefined;
}

function clean(value: unknown) {
  const result = String(value ?? "").trim();
  return result || undefined;
}

export function serializeSyncPayload<T extends Record<string, unknown>>(
  row: T,
  options?: { tableName?: string; deviceId?: string },
): Record<string, unknown> {
  const payload = (jsonSafe(row) || {}) as Record<string, unknown>;
  const tableName = options?.tableName;

  if (tableName === "mediaAssets") {
    const accountId = clean(payload.accountId);
    const ownerTable = clean(payload.ownerTable);
    const fieldKey = clean(payload.fieldKey);
    const ownerId = clean(payload.ownerId) ?? clean(payload.ownerLocalId);
    const ownerTempKey = clean(payload.ownerTempKey);
    const ownerIdentity = ownerId ?? ownerTempKey;

    payload.deviceId = clean(payload.deviceId) ?? clean(options?.deviceId) ?? getDeviceId();
    if (ownerId) payload.ownerId = ownerId;

    if (!payload.isDeleted && payload.active !== false) {
      const missing = [
        !accountId && "accountId",
        !ownerTable && "ownerTable",
        !fieldKey && "fieldKey",
        !ownerIdentity && "ownerId/ownerTempKey",
      ].filter(Boolean);

      if (missing.length) {
        throw new Error(`Cannot sync active media asset; missing ${missing.join(", ")}.`);
      }
    }

    payload.ownerIdentityKey =
      accountId && ownerTable && ownerIdentity && fieldKey
        ? [accountId, ownerTable, ownerIdentity, fieldKey].join(":")
        : undefined;
    payload.identityVersion = 1;

    delete payload.localObjectUrl;
    delete payload.previewUrl;
    if (String(payload.previewDataUrl || "").startsWith("blob:")) delete payload.previewDataUrl;
    if (String(payload.thumbnailDataUrl || "").startsWith("blob:")) delete payload.thumbnailDataUrl;
  }

  return payload;
}

/** @deprecated Use serializeSyncPayload(). */
export const prepareSyncData = serializeSyncPayload;
export default serializeSyncPayload;
