/**
 * app/lib/db/db-migrations.ts
 * --------------------------------------------------------------------------
 * Eleeveon Schools local database migration infrastructure.
 *
 * Platform V2 responsibilities:
 * - journals schema/data migrations;
 * - coordinates safe single-run migration ownership across tabs/devices;
 * - records recovery backups and rollback metadata;
 * - quarantines unsafe sync payloads;
 * - records data repairs and post-migration health checks;
 * - stores version snapshots and registered migration tasks;
 * - exposes the local-only Dexie store definitions consumed by db.ts.
 */

export type MigrationStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "rolled_back";

export type MigrationCategory =
  | "schema"
  | "data"
  | "repair"
  | "cleanup"
  | "platform";

export type RecoveryBackupStatus = "creating" | "completed" | "failed";
export type QuarantineSource = "pull" | "push" | "health-check" | "manual";
export type QuarantineSeverity = "warning" | "error" | "critical";
export type HealthCheckStatus = "healthy" | "warning" | "failed";
export type RepairStatus = "planned" | "applied" | "failed" | "reverted";

export const PLATFORM_SCHEMA_VERSION = 3;
export const PLATFORM_MIGRATION_NAME =
  "Eleeveon Schools Platform V2 Foundation";
export const DEFAULT_MIGRATION_LOCK_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_QUARANTINE_RETRY_LIMIT = 3;

export interface LocalMigrationJournal {
  id?: number;
  version: number;
  name: string;
  description?: string;
  category?: MigrationCategory;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  status: MigrationStatus;
  appVersion?: string;
  databaseVersion?: number;
  migrationChecksum?: string;
  affectedTables?: string[];
  affectedRecords?: number;
  rollbackSupported?: boolean;
  rolledBackAt?: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface DatabaseRecoveryBackup {
  id: string;
  databaseName: string;
  sourceVersion: number;
  targetVersion: number;
  appVersion?: string;
  createdAt: number;
  completedAt?: number;
  status: RecoveryBackupStatus;
  accountIds: string[];
  tableNames: string[];
  recordCount: number;
  byteEstimate?: number;
  compressed?: boolean;
  checksum?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SyncQuarantineRecord {
  id?: number;
  accountId?: string;
  tableName: string;
  entityId?: string;
  reason: string;
  severity?: QuarantineSeverity;
  payload?: unknown;
  source: QuarantineSource;
  retryCount?: number;
  lastRetryAt?: number;
  quarantinedAt: number;
  resolvedAt?: number;
  resolution?: string;
}

export interface MigrationLock {
  id: "global" | string;
  databaseName: string;
  ownerDeviceId: string;
  ownerTabId?: string;
  appVersion?: string;
  sourceVersion: number;
  targetVersion: number;
  acquiredAt: number;
  heartbeatAt: number;
  expiresAt: number;
  releasedAt?: number;
  releaseReason?: string;
  metadata?: Record<string, unknown>;
}

export interface MigrationHealthIssue {
  code: string;
  message: string;
  tableName?: string;
  entityId?: string;
  severity: "info" | "warning" | "error" | "critical";
  details?: Record<string, unknown>;
}

export interface MigrationHealthReport {
  id: string;
  databaseName: string;
  databaseVersion: number;
  appVersion?: string;
  createdAt: number;
  completedAt?: number;
  status: HealthCheckStatus;
  tablesChecked: string[];
  recordsChecked: number;
  orphanRecords: number;
  missingIndexes: number;
  brokenRelationships: number;
  duplicateIds: number;
  deletedReferences: number;
  invalidRecords?: number;
  warnings: string[];
  issues?: MigrationHealthIssue[];
  metadata?: Record<string, unknown>;
}

export interface MigrationTask {
  id: string;
  version: number;
  name: string;
  description: string;
  category: MigrationCategory;
  runOrder: number;
  enabled: boolean;
  required: boolean;
  affectedTables?: string[];
  rollbackSupported?: boolean;
  checksum?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface DataRepairLog {
  id?: number;
  migrationVersion?: number;
  migrationName?: string;
  tableName: string;
  entityId?: string;
  repairType: string;
  status: RepairStatus;
  repairedAt: number;
  repairedBy?: "migration" | "health-check" | "manual";
  previousValue?: unknown;
  newValue?: unknown;
  error?: string;
  details?: Record<string, unknown>;
}

export interface DatabaseVersionSnapshot {
  id: string;
  databaseName: string;
  version: number;
  appVersion?: string;
  createdAt: number;
  checksum?: string;
  tableNames: string[];
  recordCount: number;
  accountIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface MigrationContext {
  databaseName: string;
  fromVersion: number;
  toVersion: number;
  migrationName: string;
  appVersion?: string;
  deviceId?: string;
  tabId?: string;
  startedAt: number;
  affectedTables?: string[];
  metadata?: Record<string, unknown>;
}

export interface MigrationResult {
  version: number;
  name: string;
  status: Extract<MigrationStatus, "completed" | "failed" | "rolled_back">;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  affectedTables: string[];
  affectedRecords: number;
  backupId?: string;
  healthReportId?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export const LOCAL_SYSTEM_STORE_NAMES = {
  migrationJournal: "migrationJournal",
  databaseRecoveryBackups: "databaseRecoveryBackups",
  syncQuarantine: "syncQuarantine",
  migrationLocks: "migrationLocks",
  migrationHealthReports: "migrationHealthReports",
  migrationTasks: "migrationTasks",
  dataRepairLogs: "dataRepairLogs",
  databaseVersionSnapshots: "databaseVersionSnapshots",
} as const;

export type LocalSystemStoreName =
  (typeof LOCAL_SYSTEM_STORE_NAMES)[keyof typeof LOCAL_SYSTEM_STORE_NAMES];

export const LOCAL_PROTECTION_STORES: Record<string, string> = {
  migrationJournal:
    "++id,&[version+name],version,name,category,status,startedAt,completedAt",
  databaseRecoveryBackups:
    "&id,databaseName,sourceVersion,targetVersion,status,createdAt,completedAt",
  syncQuarantine:
    "++id,accountId,tableName,entityId,source,severity,quarantinedAt,resolvedAt",
  migrationLocks:
    "&id,databaseName,ownerDeviceId,sourceVersion,targetVersion,acquiredAt,heartbeatAt,expiresAt,releasedAt",
  migrationHealthReports:
    "&id,databaseName,databaseVersion,status,createdAt,completedAt",
  migrationTasks:
    "&id,version,name,category,runOrder,enabled,required,createdAt,updatedAt",
  dataRepairLogs:
    "++id,migrationVersion,tableName,entityId,repairType,status,repairedAt",
  databaseVersionSnapshots:
    "&id,databaseName,version,appVersion,createdAt",
};

export const LOCAL_SYSTEM_STORES = LOCAL_PROTECTION_STORES;

export function isMigrationTerminal(
  status: MigrationStatus
): status is "completed" | "failed" | "rolled_back" {
  return (
    status === "completed" ||
    status === "failed" ||
    status === "rolled_back"
  );
}

export function isMigrationLockExpired(
  lock: Pick<MigrationLock, "expiresAt">,
  now = Date.now()
): boolean {
  return lock.expiresAt <= now;
}

export function createMigrationLock(input: {
  databaseName: string;
  ownerDeviceId: string;
  ownerTabId?: string;
  appVersion?: string;
  sourceVersion: number;
  targetVersion: number;
  now?: number;
  ttlMs?: number;
  metadata?: Record<string, unknown>;
}): MigrationLock {
  const now = input.now ?? Date.now();
  const ttlMs = input.ttlMs ?? DEFAULT_MIGRATION_LOCK_TTL_MS;

  return {
    id: "global",
    databaseName: input.databaseName,
    ownerDeviceId: input.ownerDeviceId,
    ownerTabId: input.ownerTabId,
    appVersion: input.appVersion,
    sourceVersion: input.sourceVersion,
    targetVersion: input.targetVersion,
    acquiredAt: now,
    heartbeatAt: now,
    expiresAt: now + ttlMs,
    metadata: input.metadata,
  };
}

export function createMigrationJournalEntry(input: {
  version: number;
  name: string;
  description?: string;
  category?: MigrationCategory;
  appVersion?: string;
  databaseVersion?: number;
  migrationChecksum?: string;
  affectedTables?: string[];
  rollbackSupported?: boolean;
  details?: Record<string, unknown>;
  startedAt?: number;
}): LocalMigrationJournal {
  return {
    version: input.version,
    name: input.name,
    description: input.description,
    category: input.category ?? "schema",
    startedAt: input.startedAt ?? Date.now(),
    status: "running",
    appVersion: input.appVersion,
    databaseVersion: input.databaseVersion,
    migrationChecksum: input.migrationChecksum,
    affectedTables: input.affectedTables ?? [],
    affectedRecords: 0,
    rollbackSupported: input.rollbackSupported ?? false,
    details: input.details,
  };
}

export function completeMigrationJournalEntry(
  journal: LocalMigrationJournal,
  input?: {
    completedAt?: number;
    affectedRecords?: number;
    details?: Record<string, unknown>;
  }
): LocalMigrationJournal {
  const completedAt = input?.completedAt ?? Date.now();

  return {
    ...journal,
    status: "completed",
    completedAt,
    durationMs: Math.max(0, completedAt - journal.startedAt),
    affectedRecords: input?.affectedRecords ?? journal.affectedRecords ?? 0,
    details: {
      ...(journal.details ?? {}),
      ...(input?.details ?? {}),
    },
    error: undefined,
  };
}

export function failMigrationJournalEntry(
  journal: LocalMigrationJournal,
  error: unknown,
  completedAt = Date.now()
): LocalMigrationJournal {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown migration error";

  return {
    ...journal,
    status: "failed",
    completedAt,
    durationMs: Math.max(0, completedAt - journal.startedAt),
    error: message,
  };
}