/**
 * app/lib/db/modules/index.ts
 * --------------------------------------------------------------------------
 * Aggregates every Eleeveon Schools Dexie module store map.
 */

export * from "./accounts.tables";
export * from "./academics.tables";
export * from "./assessments.tables";
export * from "./attendance.tables";
export * from "./billing.tables";
export * from "./communications.tables";
export * from "./feedback.tables";
export * from "./identity.tables";
export * from "./localization.tables";
export * from "./media.tables";
export * from "./scheduling.tables";
export * from "./schools.tables";
export * from "./websites.tables";

import { ACCOUNT_STORES } from "./accounts.tables";
import { ACADEMIC_STORES } from "./academics.tables";
import { ASSESSMENT_STORES } from "./assessments.tables";
import { ATTENDANCE_STORES } from "./attendance.tables";
import { BILLING_STORES } from "./billing.tables";
import { COMMUNICATION_STORES } from "./communications.tables";
import { FEEDBACK_STORES } from "./feedback.tables";
import { IDENTITY_STORES } from "./identity.tables";
import { LOCALIZATION_STORES } from "./localization.tables";
import { MEDIA_STORES } from "./media.tables";
import { SCHEDULING_STORES } from "./scheduling.tables";
import { SCHOOL_STORES } from "./schools.tables";
import { WEBSITE_STORES } from "./websites.tables";

export const DOMAIN_STORES: Record<string, string> = {
  ...ACCOUNT_STORES,
  ...SCHOOL_STORES,
  ...ACADEMIC_STORES,
  ...ASSESSMENT_STORES,
  ...ATTENDANCE_STORES,
  ...IDENTITY_STORES,
  ...BILLING_STORES,
  ...COMMUNICATION_STORES,
  ...FEEDBACK_STORES,
  ...LOCALIZATION_STORES,
  ...MEDIA_STORES,
  ...SCHEDULING_STORES,
  ...WEBSITE_STORES,
};

export function findDuplicateModuleStores(): string[] {
  const modules = [
    ACCOUNT_STORES,
    SCHOOL_STORES,
    ACADEMIC_STORES,
    ASSESSMENT_STORES,
    ATTENDANCE_STORES,
    IDENTITY_STORES,
    BILLING_STORES,
    COMMUNICATION_STORES,
    FEEDBACK_STORES,
    LOCALIZATION_STORES,
    MEDIA_STORES,
    SCHEDULING_STORES,
    WEBSITE_STORES,
  ];

  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const stores of modules) {
    for (const tableName of Object.keys(stores)) {
      if (seen.has(tableName)) duplicates.add(tableName);
      seen.add(tableName);
    }
  }

  return [...duplicates].sort();
}
