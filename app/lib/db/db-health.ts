import type Dexie from "dexie";
import { SyncStatus } from "../constants/syncStatus";
import { APP_DB_NAME, APP_DB_VERSION } from "./db-version";
import {
  PLATFORM_SCHEMA_VERSION,
  type MigrationHealthReport,
  type MigrationHealthIssue,
} from "./db-migrations";

export type DatabaseHealthSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

export interface DatabaseHealthIssue {
  code: string;
  severity: DatabaseHealthSeverity;
  message: string;
  tableName?: string;
  recordId?: string | number;
  details?: Record<string, unknown>;
}

export interface DatabaseTableHealth {
  tableName: string;
  recordCount: number;
  pendingRecords: number;
  failedRecords: number;
  invalidRecords: number;
  checkedAt: number;
}

export interface DatabaseHealthReport {
  id: string;
  ok: boolean;
  status: "healthy" | "warning" | "failed";
  checkedAt: number;
  completedAt: number;
  durationMs: number;

  databaseName: string;
  databaseVersion: number;
  expectedVersion: number;
  platformSchemaVersion: number;

  tableCount: number;
  expectedStoreCount: number;
  missingStores: string[];

  pendingRecords: number;
  failedRecords: number;
  invalidRecords: number;

  orphanRecords: number;
  brokenRelationships: number;
  duplicateIds: number;
  deletedReferences: number;

  tables: DatabaseTableHealth[];
  issues: DatabaseHealthIssue[];
}

/**
 * Stores that must exist for Platform V2 to be considered healthy.
 *
 * This includes the local protection stores introduced in db-migrations.ts,
 * the hierarchical assessment foundation, the advanced scheduling foundation,
 * and the platform cache/support stores.
 */
const REQUIRED_STORES = [
  // Core school data.
  "students",
  "teachers",
  "parents",
  "assessmentEntries",
  "computedResults",
  "schoolBranchSettings",

  // Media and reports.
  "mediaAssets",
  "mediaBlobs",
  "reportCardTemplates",
  "reportCardTemplateSettings",
  "reportCardTemplateAssignments",

  // Platform V2 assessment hierarchy.
  "assessmentStructures",
  "assessmentStructureItems",

  // Platform V2 scheduling foundation.
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

  // Platform access, locales, notices and feedback.
  "commercialPlans",
  "perpetualLicenses",
  "licenseActivations",
  "licenseValidationEvents",
  "licenseUpgradeOffers",
  "accountEntitlements",
  "supportedLocales",
  "accountLocaleSettings",
  "userLocalePreferences",
  "membershipLocalePreferences",
  "platformReleases",
  "platformReleaseNotes",
  "platformAnnouncements",
  "platformAnnouncementReceipts",
  "platformFeedback",
  "platformFeedbackAttachments",
  "platformFeedbackMessages",

  // Local protection/runtime.
  "migrationJournal",
  "databaseRecoveryBackups",
  "syncQuarantine",
  "migrationLocks",
  "migrationHealthReports",
  "migrationTasks",
  "dataRepairLogs",
  "databaseVersionSnapshots",
] as const;

/**
 * Tables sampled for sync identity checks.
 *
 * Platform cache and local-only protection stores are intentionally excluded.
 */
const SYNC_TABLES_TO_SAMPLE = [
  "students",
  "teachers",
  "parents",
  "assessmentStructures",
  "assessmentStructureItems",
  "assessmentEntries",
  "computedResults",
  "reportCardTemplates",
  "reportCardTemplateSettings",
  "reportCardTemplateAssignments",
  "mediaAssets",
  "scheduleTimetables",
  "scheduleSessions",
  "schedulePeriodTemplates",
  "schedulePeriodSlots",
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
  "scheduleGenerationIssues",
  "scheduleGenerationSuggestions",
  "schedulePublishEvents",
  "scheduleVersionSnapshots",
  "platformAnnouncementReceipts",
  "platformFeedback",
  "platformFeedbackAttachments",
  "platformFeedbackMessages",
] as const;

function nowId(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

function recordId(
  record: Record<string, unknown>,
): string | number | undefined {
  const value = record.id;
  return typeof value === "string" || typeof value === "number"
    ? value
    : undefined;
}

function permanentId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function isDeletedOrInactive(row: Record<string, unknown>) {
  return row.isDeleted === true || row.active === false;
}

function addIssue(
  issues: DatabaseHealthIssue[],
  issue: DatabaseHealthIssue,
) {
  issues.push(issue);
}

async function countSyncState(
  table: Dexie.Table,
  status: unknown,
): Promise<number> {
  return table
    .filter((row: Record<string, unknown>) => row.synced === status)
    .count();
}

async function findDuplicateIds(
  table: Dexie.Table,
  limit = 25,
): Promise<Array<string | number>> {
  const rows = (await table.toArray()) as Record<string, unknown>[];
  const seen = new Set<string>();
  const duplicates: Array<string | number> = [];

  for (const row of rows) {
    const id = recordId(row);
    if (id === undefined) continue;
    const key = String(id);
    if (seen.has(key)) {
      duplicates.push(id);
      if (duplicates.length >= limit) break;
    } else {
      seen.add(key);
    }
  }

  return duplicates;
}

async function checkAssessmentHierarchy(
  database: Dexie,
  available: Set<string>,
  issues: DatabaseHealthIssue[],
) {
  if (!available.has("assessmentStructureItems")) return 0;

  const rows = (await database
    .table("assessmentStructureItems")
    .toArray()) as Record<string, unknown>[];

  const ids = new Set(
    rows
      .map((row) => permanentId(row.id))
      .filter((id): id is string => Boolean(id)),
  );

  let broken = 0;

  for (const row of rows) {
    if (isDeletedOrInactive(row)) continue;

    const id = permanentId(row.id);
    const parentId = permanentId(row.parentItemId);
    const level = asNumber(row.level);

    if (parentId && !ids.has(parentId)) {
      broken += 1;
      addIssue(issues, {
        code: "ORPHAN_ASSESSMENT_PARENT",
        severity: "warning",
        tableName: "assessmentStructureItems",
        recordId: recordId(row),
        message: `Assessment item points to missing parent ${parentId}.`,
      });
    }

    if (id && parentId === id) {
      broken += 1;
      addIssue(issues, {
        code: "SELF_REFERENCING_ASSESSMENT_ITEM",
        severity: "error",
        tableName: "assessmentStructureItems",
        recordId: recordId(row),
        message: "Assessment item references itself as its parent.",
      });
    }

    if (level !== undefined && level < 0) {
      addIssue(issues, {
        code: "INVALID_ASSESSMENT_LEVEL",
        severity: "warning",
        tableName: "assessmentStructureItems",
        recordId: recordId(row),
        message: "Assessment hierarchy level cannot be negative.",
      });
    }
  }

  return broken;
}

async function checkSchedulingRelationships(
  database: Dexie,
  available: Set<string>,
  issues: DatabaseHealthIssue[],
) {
  const sessionIds = available.has("scheduleSessions")
    ? new Set(
        (
          (await database.table("scheduleSessions").toArray()) as Record<
            string,
            unknown
          >[]
        )
          .map((row) => permanentId(row.id))
          .filter((id): id is string => Boolean(id)),
      )
    : new Set<string>();

  const relationshipTables = [
    "scheduleSessionGroups",
    "scheduleSessionTeachers",
    "scheduleSessionResources",
  ] as const;

  let broken = 0;

  for (const tableName of relationshipTables) {
    if (!available.has(tableName)) continue;

    const rows = (await database.table(tableName).toArray()) as Record<
      string,
      unknown
    >[];

    for (const row of rows) {
      if (isDeletedOrInactive(row)) continue;

      const sessionId = permanentId(row.sessionId);
      if (!sessionId || !sessionIds.has(sessionId)) {
        broken += 1;
        addIssue(issues, {
          code: "ORPHAN_SCHEDULE_SESSION_RELATION",
          severity: "warning",
          tableName,
          recordId: recordId(row),
          message: sessionId
            ? `${tableName} points to missing session ${sessionId}.`
            : `${tableName} is missing sessionId.`,
        });
      }
    }
  }

  return broken;
}

async function checkReportTemplateRelationships(
  database: Dexie,
  available: Set<string>,
  issues: DatabaseHealthIssue[],
) {
  if (
    !available.has("reportCardTemplates") ||
    !available.has("reportCardTemplateSettings") ||
    !available.has("reportCardTemplateAssignments")
  ) {
    return 0;
  }

  const templateIds = new Set<string>(
    (
      (await database
        .table("reportCardTemplates")
        .toArray()) as Record<string, unknown>[]
    )
      .map((row) => permanentId(row.id))
      .filter((id): id is string => Boolean(id)),
  );

  const settingIds = new Set<string>(
    (
      (await database
        .table("reportCardTemplateSettings")
        .toArray()) as Record<string, unknown>[]
    )
      .map((row) => permanentId(row.id))
      .filter((id): id is string => Boolean(id)),
  );

  const assignments = (await database
    .table("reportCardTemplateAssignments")
    .toArray()) as Record<string, unknown>[];

  let broken = 0;

  for (const assignment of assignments) {
    if (isDeletedOrInactive(assignment)) continue;

    const templateId = permanentId(assignment.templateId);
    const settingsId = permanentId(assignment.templateSettingsId);

    if (!templateId || !templateIds.has(templateId)) {
      broken += 1;
      addIssue(issues, {
        code: templateId
          ? "ORPHAN_TEMPLATE_ASSIGNMENT"
          : "MISSING_TEMPLATE_REFERENCE",
        severity: "warning",
        tableName: "reportCardTemplateAssignments",
        recordId: recordId(assignment),
        message: templateId
          ? `Template assignment points to missing template ${templateId}.`
          : "Template assignment is missing templateId.",
      });
    }

    if (!settingsId || !settingIds.has(settingsId)) {
      broken += 1;
      addIssue(issues, {
        code: settingsId
          ? "ORPHAN_TEMPLATE_SETTINGS"
          : "MISSING_TEMPLATE_SETTINGS_REFERENCE",
        severity: "warning",
        tableName: "reportCardTemplateAssignments",
        recordId: recordId(assignment),
        message: settingsId
          ? `Template assignment points to missing settings ${settingsId}.`
          : "Template assignment is missing templateSettingsId.",
      });
    }
  }

  return broken;
}

async function persistHealthReport(
  database: Dexie,
  report: DatabaseHealthReport,
) {
  const available = new Set(database.tables.map((table) => table.name));
  if (!available.has("migrationHealthReports")) return;

  const migrationIssues: MigrationHealthIssue[] = report.issues.map(
    (issue) => ({
      code: issue.code,
      message: issue.message,
      tableName: issue.tableName,
      entityId:
        issue.recordId === undefined ? undefined : String(issue.recordId),
      severity:
        issue.severity === "info"
          ? "info"
          : issue.severity === "warning"
            ? "warning"
            : issue.severity === "critical"
              ? "critical"
              : "error",
      details: issue.details,
    }),
  );

  const migrationReport: MigrationHealthReport = {
    id: report.id,
    databaseName: report.databaseName,
    databaseVersion: report.databaseVersion,
    createdAt: report.checkedAt,
    completedAt: report.completedAt,
    status: report.status,
    tablesChecked: report.tables.map((table) => table.tableName),
    recordsChecked: report.tables.reduce(
      (sum, table) => sum + table.recordCount,
      0,
    ),
    orphanRecords: report.orphanRecords,
    missingIndexes: 0,
    brokenRelationships: report.brokenRelationships,
    duplicateIds: report.duplicateIds,
    deletedReferences: report.deletedReferences,
    invalidRecords: report.invalidRecords,
    warnings: report.issues
      .filter((issue) => issue.severity === "warning")
      .map((issue) => issue.message),
    issues: migrationIssues,
    metadata: {
      expectedVersion: report.expectedVersion,
      platformSchemaVersion: report.platformSchemaVersion,
      missingStores: report.missingStores,
      pendingRecords: report.pendingRecords,
      failedRecords: report.failedRecords,
    },
  };

  await database.table("migrationHealthReports").put(migrationReport);
}

export async function checkDatabaseHealth(
  database: Dexie,
  options?: {
    persist?: boolean;
    duplicateScan?: boolean;
  },
): Promise<DatabaseHealthReport> {
  const startedAt = Date.now();
  const issues: DatabaseHealthIssue[] = [];
  const available = new Set(database.tables.map((table) => table.name));

  const missingStores: string[] = [];

  for (const tableName of REQUIRED_STORES) {
    if (!available.has(tableName)) {
      missingStores.push(tableName);
      addIssue(issues, {
        code: "MISSING_STORE",
        severity: "error",
        tableName,
        message: `Required IndexedDB store ${tableName} is missing.`,
      });
    }
  }

  if (database.verno !== APP_DB_VERSION) {
    addIssue(issues, {
      code: "VERSION_MISMATCH",
      severity: "error",
      message: `Database opened at version ${database.verno}; expected ${APP_DB_VERSION}.`,
      details: {
        databaseName: APP_DB_NAME,
        actualVersion: database.verno,
        expectedVersion: APP_DB_VERSION,
      },
    });
  }

  if (APP_DB_VERSION !== PLATFORM_SCHEMA_VERSION) {
    addIssue(issues, {
      code: "PLATFORM_VERSION_CONSTANT_MISMATCH",
      severity: "critical",
      message:
        `APP_DB_VERSION is ${APP_DB_VERSION}, but ` +
        `PLATFORM_SCHEMA_VERSION is ${PLATFORM_SCHEMA_VERSION}.`,
    });
  }

  let pendingRecords = 0;
  let failedRecords = 0;
  let invalidRecords = 0;
  let duplicateIds = 0;
  let deletedReferences = 0;

  const tableReports: DatabaseTableHealth[] = [];

  for (const tableName of SYNC_TABLES_TO_SAMPLE) {
    if (!available.has(tableName)) continue;

    const table = database.table(tableName);
    const checkedAt = Date.now();
    const recordCount = await table.count();

    const tablePending = await countSyncState(
      table,
      SyncStatus.PENDING,
    );

    const tableFailed = await countSyncState(
      table,
      SyncStatus.FAILED,
    );

    pendingRecords += tablePending;
    failedRecords += tableFailed;

    const invalid = await table
      .filter((row: Record<string, unknown>) => {
        if (row.isDeleted === true) return false;

        return (
          !permanentId(row.id) ||
          !permanentId(row.accountId) ||
          typeof row.updatedAt !== "number" ||
          row.updatedAt <= 0 ||
          typeof row.version !== "number" ||
          row.version <= 0 ||
          !permanentId(row.deviceId)
        );
      })
      .limit(50)
      .toArray();

    invalidRecords += invalid.length;

    for (const row of invalid as Record<string, unknown>[]) {
      addIssue(issues, {
        code: "INVALID_SYNC_IDENTITY",
        severity: "warning",
        tableName,
        recordId: recordId(row),
        message:
          `${tableName} contains a record missing its permanent id, ` +
          "accountId, updatedAt, version, or deviceId.",
      });
    }

    if (options?.duplicateScan !== false) {
      const duplicates = await findDuplicateIds(table);
      duplicateIds += duplicates.length;

      for (const duplicateId of duplicates) {
        addIssue(issues, {
          code: "DUPLICATE_RECORD_ID",
          severity: "error",
          tableName,
          recordId: duplicateId,
          message: `${tableName} contains duplicate id ${duplicateId}.`,
        });
      }
    }

    tableReports.push({
      tableName,
      recordCount,
      pendingRecords: tablePending,
      failedRecords: tableFailed,
      invalidRecords: invalid.length,
      checkedAt,
    });
  }

  if (available.has("mediaAssets")) {
    const invalidMedia = await database
      .table("mediaAssets")
      .filter((row: Record<string, unknown>) => {
        if (isDeletedOrInactive(row)) return false;
        return (
          !permanentId(row.ownerTable) ||
          !permanentId(row.ownerId) ||
          !permanentId(row.fieldKey)
        );
      })
      .limit(50)
      .toArray();

    for (const row of invalidMedia as Record<string, unknown>[]) {
      addIssue(issues, {
        code: "INVALID_MEDIA_OWNER",
        severity: "warning",
        tableName: "mediaAssets",
        recordId: recordId(row),
        message:
          "Active media asset has incomplete permanent owner identity.",
      });
    }
  }

  const reportRelationshipIssues =
    await checkReportTemplateRelationships(database, available, issues);

  const assessmentRelationshipIssues =
    await checkAssessmentHierarchy(database, available, issues);

  const scheduleRelationshipIssues =
    await checkSchedulingRelationships(database, available, issues);

  const brokenRelationships =
    reportRelationshipIssues +
    assessmentRelationshipIssues +
    scheduleRelationshipIssues;

  const completedAt = Date.now();
  const hasCritical = issues.some(
    (issue) =>
      issue.severity === "error" || issue.severity === "critical",
  );
  const hasWarning = issues.some(
    (issue) => issue.severity === "warning",
  );

  const report: DatabaseHealthReport = {
    id: nowId("db-health"),
    ok: !hasCritical,
    status: hasCritical
      ? "failed"
      : hasWarning
        ? "warning"
        : "healthy",
    checkedAt: startedAt,
    completedAt,
    durationMs: completedAt - startedAt,

    databaseName: APP_DB_NAME,
    databaseVersion: database.verno,
    expectedVersion: APP_DB_VERSION,
    platformSchemaVersion: PLATFORM_SCHEMA_VERSION,

    tableCount: database.tables.length,
    expectedStoreCount: REQUIRED_STORES.length,
    missingStores,

    pendingRecords,
    failedRecords,
    invalidRecords,

    orphanRecords: brokenRelationships,
    brokenRelationships,
    duplicateIds,
    deletedReferences,

    tables: tableReports,
    issues,
  };

  if (options?.persist !== false) {
    await persistHealthReport(database, report);
  }

  return report;
}
