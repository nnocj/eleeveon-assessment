/**
 * app/lib/db/core/base.ts
 * --------------------------------------------------------------------------
 * Shared database contracts for the Eleeveon Schools Dexie database.
 *
 * Keep this file dependency-light. Domain modules may import these types,
 * but this file must not import domain modules or the database instance.
 */

import type { SyncStatus } from "../../constants/syncStatus";

// ======================================================
// PRIMITIVES
// ======================================================

export type EntityId = string;
export type AccountId = string;
export type SchoolId = string;
export type BranchId = string;
export type DeviceId = string;
export type UserId = string;
export type MembershipId = string;

export type UnixTimestamp = number;
export type IsoDateString = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type UnknownRecord = Record<string, unknown>;

// ======================================================
// SYNCED RECORD CONTRACTS
// ======================================================

/**
 * Canonical identity shared by all local-first records.
 *
 * Existing domain interfaces may continue to declare these fields directly;
 * extending this contract is preferred for new Platform V2 records.
 */
export interface SyncRecordBase {
  id: EntityId;
  accountId: AccountId;

  createdAt: UnixTimestamp;
  updatedAt: UnixTimestamp;

  version: number;

  deviceId: DeviceId;
  createdByDeviceId: DeviceId;
  updatedByDeviceId: DeviceId;

  synced: SyncStatus;
  isDeleted: boolean;
}

export interface SchoolScopedRecord {
  schoolId: SchoolId;
}

export interface BranchScopedRecord extends SchoolScopedRecord {
  branchId: BranchId;
}

export interface OptionalSchoolScope {
  schoolId?: SchoolId | null;
}

export interface OptionalBranchScope extends OptionalSchoolScope {
  branchId?: BranchId | null;
}

export interface ActiveRecord {
  active?: boolean;
}

export interface LockableRecord {
  locked?: boolean;
}

export interface PublishableRecord {
  published?: boolean;
  publishedAt?: UnixTimestamp | null;
  publishedByUserId?: UserId | null;
}

export interface SortableRecord {
  order?: number;
  displayOrder?: number;
}

export interface MetadataRecord {
  metadata?: Record<string, unknown> | null;
}

export interface LocalQueueRecord {
  queuedAt?: UnixTimestamp | null;
  lastAttemptAt?: UnixTimestamp | null;
  attemptCount?: number;
  lastError?: string | null;
}

// ======================================================
// BACKEND CACHE CONTRACTS
// ======================================================

/**
 * Backend-owned records cached locally for offline UI access.
 *
 * These records are not normal local-first entities and should not be pushed
 * through the school-data sync endpoint.
 */
export interface PlatformCacheRecord {
  id: EntityId;
  accountId?: AccountId | null;

  createdAt?: IsoDateString | null;
  updatedAt?: IsoDateString | null;

  cacheReceivedAt?: UnixTimestamp;
  cacheVersion?: number;
  cacheSource?: string;
}

/**
 * Local-only records must never be sent to the backend.
 */
export interface LocalOnlyRecord {
  localOnly?: true;
}

// ======================================================
// TYPE HELPERS
// ======================================================

export type NewSyncRecord<T extends SyncRecordBase> = Omit<
  T,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "version"
  | "deviceId"
  | "createdByDeviceId"
  | "updatedByDeviceId"
  | "synced"
  | "isDeleted"
> &
  Partial<
    Pick<
      T,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "version"
      | "deviceId"
      | "createdByDeviceId"
      | "updatedByDeviceId"
      | "synced"
      | "isDeleted"
    >
  >;

export type SyncPatch<T extends SyncRecordBase> = Partial<
  Omit<
    T,
    | "id"
    | "accountId"
    | "createdAt"
    | "createdByDeviceId"
  >
>;

export type EntityReference = {
  tableName: string;
  entityId: EntityId;
};

export type ScopedEntityReference = EntityReference & {
  accountId: AccountId;
  schoolId?: SchoolId | null;
  branchId?: BranchId | null;
};

// ======================================================
// RUNTIME GUARDS
// ======================================================

export function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

export function isPositiveTimestamp(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

export function isPositiveVersion(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );
}

export function hasSyncIdentity(
  value: unknown,
): value is SyncRecordBase {
  if (!value || typeof value !== "object") return false;

  const record = value as UnknownRecord;

  return (
    isNonEmptyString(record.id) &&
    isNonEmptyString(record.accountId) &&
    isPositiveTimestamp(record.createdAt) &&
    isPositiveTimestamp(record.updatedAt) &&
    isPositiveVersion(record.version) &&
    isNonEmptyString(record.deviceId) &&
    isNonEmptyString(record.createdByDeviceId) &&
    isNonEmptyString(record.updatedByDeviceId) &&
    typeof record.isDeleted === "boolean" &&
    record.synced !== undefined
  );
}

export function recordKey(
  tableName: string,
  id: string,
): string {
  return `${tableName}:${id}`;
}
