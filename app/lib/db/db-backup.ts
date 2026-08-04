import {
  APP_DB_NAME,
  APP_DB_VERSION,
  RECOVERY_BACKUP_STORE,
  RECOVERY_DB_NAME,
  RECOVERY_DB_VERSION,
} from "./db-version";
import type {
  DatabaseRecoveryBackup,
  RecoveryBackupStatus,
} from "./db-migrations";

export interface RecoveryTableSnapshot {
  tableName: string;
  records: unknown[];
  recordCount: number;
  mode: "full" | "unsynced_only";
}

export interface ExternalDatabaseBackup
  extends Omit<
    DatabaseRecoveryBackup,
    "tableNames" | "byteEstimate" | "metadata"
  > {
  tables: RecoveryTableSnapshot[];
  storageEntries: Record<string, string>;
  byteEstimate?: number;
  metadata?: Record<string, unknown>;
}

const CRITICAL_TABLES = [
  // Core people and academics.
  "schools",
  "branches",
  "academicStructures",
  "academicPeriods",
  "organizations",
  "students",
  "teachers",
  "parents",
  "studentParents",
  "classes",
  "subjects",
  "programs",
  "curriculums",
  "curriculumPathways",
  "curriculumSubjects",
  "classSubjects",
  "studentEnrollments",

  // Hierarchical assessments and reporting.
  "gradingSystems",
  "gradeRules",
  "assessmentStructures",
  "assessmentStructureItems",
  "assessmentApplicabilities",
  "assessmentComponents",
  "assessmentEntries",
  "computedResults",
  "reportCards",
  "reportCardItems",
  "reportCardTemplates",
  "reportCardTemplateSettings",
  "reportCardTemplateAssignments",
  "studentReportSnapshots",
  "studentPromotions",

  // Attendance.
  "attendance",
  "studentAttendanceSummaries",
  "teacherAttendance",
  "attendanceSessions",
  "attendanceDevices",
  "attendanceCredentials",

  // Advanced scheduling.
  "scheduleTimetables",
  "scheduleSessions",
  "scheduleResources",
  "scheduleConflicts",
  "schedulePeriodTemplates",
  "schedulePeriodTemplateAssignments",
  "schedulePeriodSlots",
  "scheduleSharedBlocks",
  "scheduleSharedBlockGroups",
  "scheduleSharedBlockTeachers",
  "scheduleGroups",
  "scheduleGroupMembers",
  "scheduleTeacherAvailability",
  "scheduleTeacherWorkloadRules",
  "scheduleSubjectRequirements",
  "scheduleRequirementGroups",
  "scheduleRequirementTeachers",
  "scheduleResourceRequirements",
  "scheduleConstraintRules",
  "scheduleSessionGroups",
  "scheduleSessionTeachers",
  "scheduleSessionResources",
  "scheduleGenerationRuns",
  "scheduleDrafts",
  "scheduleDraftSessions",
  "scheduleDraftSessionGroups",
  "scheduleDraftSessionTeachers",
  "scheduleDraftSessionResources",
  "scheduleGenerationIssues",
  "scheduleGenerationSuggestions",
  "scheduleSuggestionRequirements",
  "scheduleSuggestionGroups",
  "scheduleSuggestionTeachers",
  "scheduleSuggestionResources",
  "schedulePublishEvents",
  "scheduleVersionSnapshots",

  // Finance records.
  "payments",
  "incomes",
  "expenses",
  "studentFeeInvoices",
  "studentFeeInvoiceItems",
  "studentFeePayments",

  // Configuration, websites and media.
  "schoolBranchSettings",
  "websiteSites",
  "websitePages",
  "websiteSections",
  "websiteNavigationItems",
  "websiteDomains",
  "websiteFormSubmissions",
  "mediaAssets",
  "mediaBlobs",

  // Local receipts and user-generated platform communication.
  "platformAnnouncementReceipts",
  "platformFeedback",
  "platformFeedbackAttachments",
  "platformFeedbackMessages",

  // Migration protection records.
  "migrationJournal",
  "databaseRecoveryBackups",
  "syncQuarantine",
  "migrationHealthReports",
  "dataRepairLogs",
  "databaseVersionSnapshots",
] as const;

/**
 * Backend-owned caches that may be restored from the server and are not
 * required in every pre-upgrade backup. They are still included when they
 * contain unsynced/local changes.
 */
const RECREATABLE_PLATFORM_CACHE_TABLES = new Set([
  "commercialPlans",
  "accountSubscriptions",
  "subscriptionPeriods",
  "subscriptionChangeOrders",
  "privateOffers",
  "privateOfferAssignments",
  "pricingOverrides",
  "accountUsageSnapshots",
  "accountEntitlements",
  "perpetualLicenses",
  "licenseActivations",
  "licenseValidationEvents",
  "licenseUpgradeOffers",
  "supportedLocales",
  "accountLocaleSettings",
  "userLocalePreferences",
  "membershipLocalePreferences",
  "platformReleases",
  "platformReleaseNotes",
  "platformAnnouncements",
]);

const SYNC_STATE_KEY_PARTS = [
  "last_sync",
  "last_platform_cache",
  "sync_lock",
  "bootstrap",
  "account_id",
  "device_id",
  "active_membership",
  "active_role",
  "active_school",
  "active_branch",
  "locale",
  "language",
  "entitlement",
  "license",
] as const;

function readRelevantStorageEntries() {
  const entries: Record<string, string> = {};
  if (typeof window === "undefined") return entries;

  for (const storage of [
    window.localStorage,
    window.sessionStorage,
  ]) {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;

      const normalized = key.toLowerCase();

      if (!normalized.includes("eleeveon")) continue;

      if (
        !SYNC_STATE_KEY_PARTS.some((part) =>
          normalized.includes(part),
        )
      ) {
        continue;
      }

      const value = storage.getItem(key);
      if (value !== null) entries[key] = value;
    }
  }

  return entries;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ||
          new Error("IndexedDB request failed"),
      );
  });
}

function transactionDone(
  transaction: IDBTransaction,
): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();

    transaction.onerror = () =>
      reject(
        transaction.error ||
          new Error("IndexedDB transaction failed"),
      );

    transaction.onabort = () =>
      reject(
        transaction.error ||
          new Error("IndexedDB transaction aborted"),
      );
  });
}

async function databaseExists(name: string) {
  if (!("databases" in indexedDB)) return true;

  const databases = await indexedDB.databases();
  return databases.some((item) => item.name === name);
}

async function openExistingDatabase(
  name: string,
): Promise<IDBDatabase | null> {
  if (!(await databaseExists(name))) return null;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    let createdByMistake = false;

    request.onupgradeneeded = (event) => {
      createdByMistake =
        (event as IDBVersionChangeEvent).oldVersion === 0;

      request.transaction?.abort();
    };

    request.onsuccess = () => {
      if (createdByMistake) {
        request.result.close();
        indexedDB.deleteDatabase(name);
        resolve(null);
        return;
      }

      resolve(request.result);
    };

    request.onerror = () => {
      if (
        request.error?.name === "AbortError" &&
        createdByMistake
      ) {
        resolve(null);
      } else {
        reject(
          request.error ||
            new Error(`Failed to open ${name}`),
        );
      }
    };
  });
}

async function openRecoveryDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      RECOVERY_DB_NAME,
      RECOVERY_DB_VERSION,
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(
          RECOVERY_BACKUP_STORE,
        )
      ) {
        const store = database.createObjectStore(
          RECOVERY_BACKUP_STORE,
          { keyPath: "id" },
        );

        store.createIndex("createdAt", "createdAt");
        store.createIndex("status", "status");
        store.createIndex("databaseName", "databaseName");
        store.createIndex("sourceVersion", "sourceVersion");
        store.createIndex("targetVersion", "targetVersion");
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () =>
      reject(
        request.error ||
          new Error("Failed to open recovery database"),
      );
  });
}

async function readTable(
  database: IDBDatabase,
  tableName: string,
): Promise<unknown[]> {
  if (!database.objectStoreNames.contains(tableName)) {
    return [];
  }

  const transaction = database.transaction(
    tableName,
    "readonly",
  );

  const request = transaction
    .objectStore(tableName)
    .getAll();

  const records = await requestResult(request);
  await transactionDone(transaction);

  return records;
}

async function saveBackup(
  backup: ExternalDatabaseBackup,
) {
  const database = await openRecoveryDatabase();

  try {
    const transaction = database.transaction(
      RECOVERY_BACKUP_STORE,
      "readwrite",
    );

    transaction
      .objectStore(RECOVERY_BACKUP_STORE)
      .put(backup);

    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

function accountIdsFromTables(
  tables: RecoveryTableSnapshot[],
) {
  const values = new Set<string>();

  for (const table of tables) {
    for (const record of table.records) {
      const accountId = (
        record as { accountId?: unknown } | null
      )?.accountId;

      if (
        typeof accountId === "string" &&
        accountId.trim()
      ) {
        values.add(accountId.trim());
      }
    }
  }

  return [...values];
}

function estimateStructuredCloneBytes(value: unknown): number {
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch {
    return 0;
  }
}

function unsyncedRecords(records: unknown[]) {
  return records.filter((record) => {
    const status = (
      record as { synced?: unknown } | null
    )?.synced;

    return (
      status === 0 ||
      status === 2 ||
      status === "pending" ||
      status === "failed"
    );
  });
}

function createBackupShell(
  sourceVersion: number,
): ExternalDatabaseBackup {
  return {
    id:
      `${APP_DB_NAME}:v${sourceVersion}` +
      `-to-v${APP_DB_VERSION}:${Date.now()}`,

    databaseName: APP_DB_NAME,

    sourceVersion,
    targetVersion: APP_DB_VERSION,

    createdAt: Date.now(),

    status: "creating",

    tables: [],
    recordCount: 0,
    accountIds: [],

    storageEntries: readRelevantStorageEntries(),

    metadata: {
      backupFormatVersion: 2,
      platformVersion: "v2",
      preservesBlobs: true,
      criticalTableCount: CRITICAL_TABLES.length,
    },
  };
}

/**
 * Creates an external structured-clone backup before Dexie opens or upgrades.
 *
 * Blob values from mediaBlobs remain intact because the backup is stored in
 * another IndexedDB database instead of JSON or localStorage.
 */
export async function createPreUpgradeBackup(): Promise<
  ExternalDatabaseBackup | null
> {
  if (typeof indexedDB === "undefined") return null;

  const source = await openExistingDatabase(APP_DB_NAME);
  if (!source) return null;

  const sourceVersion = source.version;

  if (sourceVersion >= APP_DB_VERSION) {
    source.close();
    return null;
  }

  const backup = createBackupShell(sourceVersion);

  try {
    await saveBackup(backup);

    const captured = new Set<string>();

    for (const tableName of CRITICAL_TABLES) {
      const records = await readTable(source, tableName);

      backup.tables.push({
        tableName,
        records,
        recordCount: records.length,
        mode: "full",
      });

      backup.recordCount += records.length;
      backup.byteEstimate =
        (backup.byteEstimate ?? 0) +
        estimateStructuredCloneBytes(records);

      captured.add(tableName);
    }

    /**
     * Preserve unsynced work from every remaining application store.
     *
     * Backend-owned cache tables are skipped when they contain no local work
     * because they can be restored from platform cache after migration.
     */
    for (const tableName of Array.from(
      source.objectStoreNames,
    )) {
      if (captured.has(tableName)) continue;

      const records = await readTable(source, tableName);
      const unsynced = unsyncedRecords(records);

      if (!unsynced.length) {
        if (
          RECREATABLE_PLATFORM_CACHE_TABLES.has(tableName)
        ) {
          continue;
        }

        continue;
      }

      backup.tables.push({
        tableName,
        records: unsynced,
        recordCount: unsynced.length,
        mode: "unsynced_only",
      });

      backup.recordCount += unsynced.length;

      backup.byteEstimate =
        (backup.byteEstimate ?? 0) +
        estimateStructuredCloneBytes(unsynced);
    }

    backup.accountIds = accountIdsFromTables(
      backup.tables,
    );

    backup.status = "completed";
    backup.completedAt = Date.now();

    backup.metadata = {
      ...(backup.metadata ?? {}),
      completedTableCount: backup.tables.length,
      fullTableCount: backup.tables.filter(
        (table) => table.mode === "full",
      ).length,
      unsyncedOnlyTableCount: backup.tables.filter(
        (table) => table.mode === "unsynced_only",
      ).length,
    };

    await saveBackup(backup);

    return backup;
  } catch (error) {
    backup.status = "failed";
    backup.completedAt = Date.now();

    backup.error =
      error instanceof Error
        ? error.message
        : String(error);

    await saveBackup(backup).catch(() => undefined);

    throw error;
  } finally {
    source.close();
  }
}

export async function listRecoveryBackups(): Promise<
  ExternalDatabaseBackup[]
> {
  if (typeof indexedDB === "undefined") return [];

  const database = await openRecoveryDatabase();

  try {
    const transaction = database.transaction(
      RECOVERY_BACKUP_STORE,
      "readonly",
    );

    const backups = await requestResult(
      transaction
        .objectStore(RECOVERY_BACKUP_STORE)
        .getAll(),
    );

    await transactionDone(transaction);

    return (
      backups as ExternalDatabaseBackup[]
    ).sort((a, b) => b.createdAt - a.createdAt);
  } finally {
    database.close();
  }
}

export async function getRecoveryBackup(
  id: string,
): Promise<ExternalDatabaseBackup | null> {
  if (typeof indexedDB === "undefined") return null;

  const database = await openRecoveryDatabase();

  try {
    const transaction = database.transaction(
      RECOVERY_BACKUP_STORE,
      "readonly",
    );

    const backup = await requestResult(
      transaction
        .objectStore(RECOVERY_BACKUP_STORE)
        .get(id),
    );

    await transactionDone(transaction);

    return (
      backup as ExternalDatabaseBackup | undefined
    ) ?? null;
  } finally {
    database.close();
  }
}

export async function deleteRecoveryBackup(
  id: string,
): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  const database = await openRecoveryDatabase();

  try {
    const transaction = database.transaction(
      RECOVERY_BACKUP_STORE,
      "readwrite",
    );

    transaction
      .objectStore(RECOVERY_BACKUP_STORE)
      .delete(id);

    await transactionDone(transaction);
  } finally {
    database.close();
  }
}
