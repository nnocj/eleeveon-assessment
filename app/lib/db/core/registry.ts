/**
 * app/lib/db/core/registry.ts
 * --------------------------------------------------------------------------
 * Canonical table-behaviour registry for Eleeveon Schools.
 *
 * This file describes how each table participates in persistence and sync.
 * It does not define Dexie indexes; schema modules remain responsible for that.
 */

// ======================================================
// CLASSIFICATIONS
// ======================================================

export type DatabaseTableKind =
  | "local_first"
  | "backend_cache"
  | "backend_only"
  | "local_only"
  | "blob";

export interface DatabaseTableRegistration {
  name: string;
  kind: DatabaseTableKind;

  push: boolean;
  pull: boolean;
  bootstrap: boolean;

  platformCache: boolean;
  preserveBeforeUpgrade: boolean;

  description?: string;
}

// ======================================================
// LOCAL-FIRST TABLES
// ======================================================

export const LOCAL_FIRST_SYNC_TABLES = [
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
  "subjectPrerequisites",
  "studentCurriculums",
  "subjectOfferings",
  "assignments",
  "classTeachers",
  "studentEnrollments",

  "gradingStructures",
  "gradeRules",
  "assessmentStructures",
  "assessmentStructureItems",
  "assessmentApplicabilities",
  "assessmentComponents",
  "assessmentEntries",
  "computedResults",

  "attendance",
  "studentAttendanceSummaries",
  "teacherAttendance",
  "attendanceSessions",
  "attendanceDevices",
  "attendanceCredentials",
  "attendanceCredentialEvents",
  "attendanceCaptureEvents",
  "attendanceEvidenceAssets",

  "identityCredentials",
  "identityCredentialDesignSettings",
  "identityCredentialEvents",
  "identityDevices",
  "identityAccessPoints",
  "identityActivityEvents",
  "identityEvidenceAssets",
  "studentIdentityCards",
  "pickupAuthorizations",
  "studentPickupEvents",
  "visitorProfiles",
  "visitorVisits",
  "schoolVehicles",
  "transportRoutes",
  "transportStops",
  "studentTransportAssignments",
  "transportJourneys",
  "transportJourneyEvents",
  "emergencyRollCallSessions",
  "emergencyRollCallEntries",

  "reportCards",
  "reportCardItems",
  "reportCardTemplates",
  "reportCardTemplateSettings",
  "reportCardTemplateAssignments",
  "studentReportSnapshots",
  "studentPromotions",
  "schoolBranchSettings",

  "currencies",
  "schoolCurrencySettings",
  "paymentIntents",
  "paymentTransactions",
  "paymentRefunds",
  "paymentSettlements",
  "withdrawalRequests",
  "schoolPayoutSettings",
  "studentFeeInvoices",
  "studentFeeInvoiceItems",
  "studentFeePayments",
  "staffPayrollProfiles",
  "payrollRuns",
  "payrollItems",
  "staffPaymentRecords",
  "feeStructures",
  "payments",
  "incomes",
  "expenses",

  "portalHighlights",
  "websiteSettings",
  "websiteTemplateSettings",
  "websiteTemplateAssignments",
  "websitePages",
  "websiteSections",
  "websiteNavigationItems",
  "websiteDomains",
  "websiteDomainAliases",
  "websiteForms",
  "websiteFormSubmissions",
  "websiteRevisions",

  "announcements",
  "announcementRecipients",
  "messageThreads",
  "messages",
  "calendarEvents",
  "calendarEventParticipants",
  "calendarEventReminders",
  "calendarEventResponses",
  "communicationLogs",
  "notificationTemplates",

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

  "mediaAssets",

  "platformAnnouncementReceipts",
  "platformFeedback",
  "platformFeedbackAttachments",
  "platformFeedbackMessages",
] as const;

// ======================================================
// PLATFORM CACHE TABLES
// ======================================================

export const BACKEND_CACHE_TABLES = [
  "accounts",
  "appUsers",
  "userMemberships",
  "permissionRules",
  "userSessions",

  "commercialPlans",
  "subscriptionPlans",
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

  "invoices",
  "appPayments",
  "billingEvents",

  "syncDevices",
  "syncConflicts",

  "apiClients",
  "apiKeys",
  "webhooks",
  "webhookLogs",
  "integrationMappings",
  "auditLogs",
  "backgroundJobs",
  "storageUsages",
  "accountFeatureFlags",
  "accountSystemSettings",
  "notificationDeliveryLogs",
] as const;

// ======================================================
// BACKEND-ONLY TABLES
// ======================================================

/**
 * Server-owned resources that should never become ordinary writable Dexie
 * school tables. Names are included here for policy checks and documentation.
 */
export const BACKEND_ONLY_TABLES = [
  "paymentProviderEvents",
  "billingReconciliationEvents",
  "subscriptionJobs",
  "subscriptionReconciliations",
  "licenseSecrets",
  "licenseActivationChallenges",
  "developerPricingAudit",
  "platformFeedbackAdministration",
  "platformAnnouncementTargetingJobs",
] as const;

// ======================================================
// LOCAL-ONLY / BLOB TABLES
// ======================================================

export const LOCAL_ONLY_TABLES = [
  "migrationJournal",
  "databaseRecoveryBackups",
  "syncQuarantine",
  "migrationLocks",
  "migrationHealthReports",
  "migrationTasks",
  "dataRepairLogs",
  "databaseVersionSnapshots",
] as const;

export const BLOB_TABLES = [
  "mediaBlobs",
] as const;

// ======================================================
// DERIVED REGISTRIES
// ======================================================

export const PUSH_SYNC_TABLES = [
  ...LOCAL_FIRST_SYNC_TABLES,
] as const;

export const PULL_SYNC_TABLES = [
  ...LOCAL_FIRST_SYNC_TABLES,
] as const;

export const PLATFORM_CACHE_TABLES = [
  ...BACKEND_CACHE_TABLES,
] as const;

export const ALL_REGISTERED_TABLES = [
  ...LOCAL_FIRST_SYNC_TABLES,
  ...BACKEND_CACHE_TABLES,
  ...BACKEND_ONLY_TABLES,
  ...LOCAL_ONLY_TABLES,
  ...BLOB_TABLES,
] as const;

export type RegisteredTableName =
  (typeof ALL_REGISTERED_TABLES)[number];

const localFirstSet = new Set<string>(
  LOCAL_FIRST_SYNC_TABLES,
);
const backendCacheSet = new Set<string>(
  BACKEND_CACHE_TABLES,
);
const backendOnlySet = new Set<string>(
  BACKEND_ONLY_TABLES,
);
const localOnlySet = new Set<string>(
  LOCAL_ONLY_TABLES,
);
const blobSet = new Set<string>(BLOB_TABLES);

// ======================================================
// POLICY HELPERS
// ======================================================

export function tableKind(
  tableName: string,
): DatabaseTableKind | null {
  if (localFirstSet.has(tableName)) {
    return "local_first";
  }

  if (backendCacheSet.has(tableName)) {
    return "backend_cache";
  }

  if (backendOnlySet.has(tableName)) {
    return "backend_only";
  }

  if (localOnlySet.has(tableName)) {
    return "local_only";
  }

  if (blobSet.has(tableName)) {
    return "blob";
  }

  return null;
}

export function isRegisteredTable(
  tableName: string,
): tableName is RegisteredTableName {
  return tableKind(tableName) !== null;
}

export function shouldPushTable(
  tableName: string,
): boolean {
  return localFirstSet.has(tableName);
}

export function shouldPullTable(
  tableName: string,
): boolean {
  return localFirstSet.has(tableName);
}

export function isPlatformCacheTable(
  tableName: string,
): boolean {
  return backendCacheSet.has(tableName);
}

export function isBackendOnlyTable(
  tableName: string,
): boolean {
  return backendOnlySet.has(tableName);
}

export function isLocalOnlyTable(
  tableName: string,
): boolean {
  return localOnlySet.has(tableName);
}

export function isBlobTable(
  tableName: string,
): boolean {
  return blobSet.has(tableName);
}

export function shouldPreserveBeforeUpgrade(
  tableName: string,
): boolean {
  return (
    localFirstSet.has(tableName) ||
    localOnlySet.has(tableName) ||
    blobSet.has(tableName)
  );
}

export function registrationFor(
  tableName: string,
): DatabaseTableRegistration | null {
  const kind = tableKind(tableName);
  if (!kind) return null;

  return {
    name: tableName,
    kind,
    push: kind === "local_first",
    pull: kind === "local_first",
    bootstrap:
      kind === "local_first" ||
      kind === "backend_cache",
    platformCache: kind === "backend_cache",
    preserveBeforeUpgrade:
      kind === "local_first" ||
      kind === "local_only" ||
      kind === "blob",
  };
}

/**
 * Detects accidental overlap between registry groups.
 */
export function validateTableRegistry(): string[] {
  const groups: Array<
    readonly [string, readonly string[]]
  > = [
    ["local_first", LOCAL_FIRST_SYNC_TABLES],
    ["backend_cache", BACKEND_CACHE_TABLES],
    ["backend_only", BACKEND_ONLY_TABLES],
    ["local_only", LOCAL_ONLY_TABLES],
    ["blob", BLOB_TABLES],
  ];

  const owners = new Map<string, string>();
  const issues: string[] = [];

  for (const [groupName, tables] of groups) {
    for (const tableName of tables) {
      const previous = owners.get(tableName);

      if (previous) {
        issues.push(
          `${tableName} appears in both ${previous} and ${groupName}.`,
        );
      } else {
        owners.set(tableName, groupName);
      }
    }
  }

  return issues;
}
