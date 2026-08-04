/**
 * app/lib/db/modules/websites.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the public school websites module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { schoolScopedIndexes } from "../core/indexes";

export const WEBSITE_TABLE_NAMES = [
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
] as const;

export const WEBSITE_STORES: Record<string, string> = {
  websiteSettings: schoolScopedIndexes(
    "schoolId,branchId,eleeveonSlug,status,templateKey,primaryDomainId,homePageId,defaultLanguage,publishedAt,updatedAt",
  ),
  websiteTemplateSettings: schoolScopedIndexes(
    "schoolId,branchId,websiteSettingId,templateKey,templateVersion,active,updatedAt",
  ),
  websiteTemplateAssignments: schoolScopedIndexes(
    "schoolId,branchId,websiteSettingId,templateSettingId,scopeType,scopeId,active,updatedAt",
  ),
  websitePages: schoolScopedIndexes(
    "schoolId,branchId,websiteSettingId,parentPageId,title,slug,status,isHomePage,displayOrder,publishedAt,updatedAt",
  ),
  websiteSections: schoolScopedIndexes(
    "schoolId,branchId,websiteSettingId,pageId,sectionType,sourceType,status,displayOrder,publishedAt,updatedAt",
  ),
  websiteNavigationItems: schoolScopedIndexes(
    "schoolId,branchId,websiteSettingId,parentItemId,label,targetType,pageId,sectionId,displayOrder,active,updatedAt",
  ),
  websiteDomains: schoolScopedIndexes(
    "schoolId,branchId,websiteSettingId,domain,domainType,status,sslStatus,isPrimary,verifiedAt,updatedAt",
  ),
  websiteDomainAliases: schoolScopedIndexes(
    "schoolId,branchId,websiteSettingId,domainId,alias,status,updatedAt",
  ),
  websiteForms: schoolScopedIndexes(
    "schoolId,branchId,websiteSettingId,name,formType,status,active,updatedAt",
  ),
  websiteFormSubmissions: schoolScopedIndexes(
    "schoolId,branchId,websiteSettingId,formId,status,submittedAt,respondedAt,updatedAt",
  ),
  websiteRevisions: schoolScopedIndexes(
    "schoolId,branchId,websiteSettingId,entityType,entityId,revisionNumber,status,createdAt,updatedAt",
  ),
};
