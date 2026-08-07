/**
 * app/lib/db/modules/assessments.tables.ts
 * --------------------------------------------------------------------------
 * Canonical Dexie store definitions for assessments and reporting.
 *
 * Keep hierarchy indexes here. Schema composition must consume this map rather
 * than maintaining a second assessmentStructureItems definition elsewhere.
 *
 * Grading rename:
 * - gradingSystems -> gradingStructures
 * - gradingSystemId -> gradingStructureId
 */

import { branchScopedIndexes } from "../core/indexes";

export const ASSESSMENT_TABLE_NAMES = [
  "gradingStructures",
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
] as const;

export type AssessmentTableName =
  (typeof ASSESSMENT_TABLE_NAMES)[number];

export const ASSESSMENT_STORES: Record<
  AssessmentTableName,
  string
> = {
  gradingStructures: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "organizationId",
      "name",
      "type",
      "active",
      "default",
      "locked",
      "updatedAt",
    ].join(","),
  ),

  gradeRules: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "gradingStructureId",
      "minScore",
      "maxScore",
      "grade",
      "order",
      "active",
      "updatedAt",
    ].join(","),
  ),

  assessmentStructures: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "organizationId",
      "academicStructureId",
      "name",
      "active",
      "locked",
      "updatedAt",
    ].join(","),
  ),

  assessmentStructureItems: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "assessmentStructureId",
      "parentItemId",
      "level",
      "path",
      "itemType",
      "aggregationMode",
      "reportVisibility",
      "entryMode",
      "order",
      "active",
      "updatedAt",
      "[assessmentStructureId+parentItemId]",
      "[assessmentStructureId+parentItemId+order]",
      "[assessmentStructureId+path]",
    ].join(","),
  ),

  assessmentApplicabilities: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "classSubjectId",
      "assessmentStructureId",
      "gradingStructureId",
      "organizationId",
      "active",
      "locked",
      "updatedAt",
    ].join(","),
  ),

  assessmentComponents: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "organizationId",
      "classId",
      "subjectId",
      "academicPeriodId",
      "assessmentStructureId",
      "gradingStructureId",
      "active",
      "updatedAt",
    ].join(","),
  ),

  assessmentEntries: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "classSubjectId",
      "organizationId",
      "academicStructureId",
      "academicPeriodId",
      "gradingStructureId",
      "assessmentStructureId",
      "assessmentStructureItemId",
      "studentId",
      "classId",
      "subjectId",
      "published",
      "locked",
      "active",
      "updatedAt",
      "[studentId+subjectId+academicPeriodId+assessmentStructureItemId]",
    ].join(","),
  ),

  computedResults: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "organizationId",
      "classSubjectId",
      "studentId",
      "classId",
      "subjectId",
      "academicStructureId",
      "academicPeriodId",
      "gradingStructureId",
      "published",
      "locked",
      "updatedAt",
      "[studentId+subjectId+academicPeriodId]",
    ].join(","),
  ),

  reportCards: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "studentId",
      "classId",
      "academicStructureId",
      "academicPeriodId",
      "published",
      "updatedAt",
      "[studentId+academicPeriodId]",
    ].join(","),
  ),

  reportCardItems: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "reportCardId",
      "studentId",
      "classId",
      "academicStructureId",
      "academicPeriodId",
      "subjectId",
      "teacherId",
      "updatedAt",
      "[reportCardId+subjectId]",
    ].join(","),
  ),

  reportCardTemplates: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "code",
      "layoutKey",
      "templateKey",
      "reportType",
      "isDefault",
      "active",
      "locked",
      "updatedAt",
    ].join(","),
  ),

  reportCardTemplateSettings: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "templateId",
      "templateCode",
      "layoutKey",
      "templateKey",
      "reportType",
      "name",
      "active",
      "locked",
      "updatedAt",
    ].join(","),
  ),

  reportCardTemplateAssignments: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "templateId",
      "templateSettingsId",
      "scopeType",
      "scopeId",
      "academicStructureId",
      "academicPeriodId",
      "classId",
      "studentId",
      "level",
      "active",
      "updatedAt",
    ].join(","),
  ),

  studentReportSnapshots: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "studentId",
      "classId",
      "academicStructureId",
      "academicPeriodId",
      "reportCardId",
      "createdAt",
      "updatedAt",
    ].join(","),
  ),

  studentPromotions: branchScopedIndexes(
    [
      "schoolId",
      "branchId",
      "studentId",
      "fromClassId",
      "toClassId",
      "fromAcademicPeriodId",
      "toAcademicPeriodId",
      "status",
      "updatedAt",
    ].join(","),
  ),
};