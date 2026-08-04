/**
 * app/lib/db/modules/assessments.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the assessments and reporting module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { branchScopedIndexes } from "../core/indexes";

export const ASSESSMENT_TABLE_NAMES = [
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
] as const;

export const ASSESSMENT_STORES: Record<string, string> = {
  gradingSystems: branchScopedIndexes(
    "schoolId,branchId,organizationId,name,type,active,default,locked,updatedAt",
  ),
  gradeRules: branchScopedIndexes(
    "schoolId,branchId,gradingSystemId,minScore,maxScore,grade,order,active,updatedAt",
  ),
  assessmentStructures: branchScopedIndexes(
    "schoolId,branchId,organizationId,academicStructureId,name,active,locked,updatedAt",
  ),
  assessmentStructureItems: branchScopedIndexes(
    "schoolId,branchId,assessmentStructureId,parentItemId,level,path,itemType,aggregationMode,reportVisibility,entryMode,order,active,updatedAt,[assessmentStructureId+parentItemId],[assessmentStructureId+path]",
  ),
  assessmentApplicabilities: branchScopedIndexes(
    "schoolId,branchId,classSubjectId,assessmentStructureId,gradingSystemId,organizationId,active,locked,updatedAt",
  ),
  assessmentComponents: branchScopedIndexes(
    "schoolId,branchId,organizationId,classId,subjectId,academicPeriodId,assessmentStructureId,gradingSystemId,active,updatedAt",
  ),
  assessmentEntries: branchScopedIndexes(
    "schoolId,branchId,classSubjectId,organizationId,academicStructureId,academicPeriodId,gradingSystemId,assessmentStructureId,assessmentStructureItemId,studentId,classId,subjectId,published,locked,active,updatedAt,[studentId+subjectId+academicPeriodId+assessmentStructureItemId]",
  ),
  computedResults: branchScopedIndexes(
    "schoolId,branchId,organizationId,classSubjectId,studentId,classId,subjectId,academicStructureId,academicPeriodId,gradingSystemId,published,locked,updatedAt,[studentId+subjectId+academicPeriodId]",
  ),
  reportCards: branchScopedIndexes(
    "schoolId,branchId,studentId,classId,academicStructureId,academicPeriodId,published,updatedAt,[studentId+academicPeriodId]",
  ),
  reportCardItems: branchScopedIndexes(
    "schoolId,branchId,reportCardId,studentId,classId,academicStructureId,academicPeriodId,subjectId,teacherId,updatedAt,[reportCardId+subjectId]",
  ),
  reportCardTemplates: branchScopedIndexes(
    "schoolId,branchId,code,layoutKey,templateKey,reportType,isDefault,active,locked,updatedAt",
  ),
  reportCardTemplateSettings: branchScopedIndexes(
    "schoolId,branchId,templateId,templateCode,layoutKey,templateKey,reportType,name,active,locked,updatedAt",
  ),
  reportCardTemplateAssignments: branchScopedIndexes(
    "schoolId,branchId,templateId,templateSettingsId,scopeType,scopeId,academicStructureId,academicPeriodId,classId,studentId,level,active,updatedAt",
  ),
  studentReportSnapshots: branchScopedIndexes(
    "schoolId,branchId,studentId,classId,academicStructureId,academicPeriodId,reportCardId,createdAt,updatedAt",
  ),
  studentPromotions: branchScopedIndexes(
    "schoolId,branchId,studentId,fromClassId,toClassId,fromAcademicPeriodId,toAcademicPeriodId,status,updatedAt",
  ),
};
