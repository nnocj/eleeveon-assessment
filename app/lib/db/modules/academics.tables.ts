/**
 * app/lib/db/modules/academics.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the academic structure module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { branchScopedIndexes } from "../core/indexes";

export const ACADEMIC_TABLE_NAMES = [
  "academicStructures",
  "academicPeriods",
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
] as const;

export const ACADEMIC_STORES: Record<string, string> = {
  academicStructures: branchScopedIndexes(
    "schoolId,branchId,name,level,startDate,endDate,active,updatedAt",
  ),
  academicPeriods: branchScopedIndexes(
    "schoolId,branchId,academicStructureId,name,type,startDate,endDate,order,active,updatedAt",
  ),
  classes: branchScopedIndexes(
    "schoolId,branchId,organizationId,name,code,level,capacity,active,updatedAt",
  ),
  subjects: branchScopedIndexes(
    "schoolId,branchId,organizationId,name,code,category,active,updatedAt",
  ),
  programs: branchScopedIndexes(
    "schoolId,branchId,organizationId,name,code,awardType,active,updatedAt",
  ),
  curriculums: branchScopedIndexes(
    "schoolId,branchId,organizationId,programId,academicStructureId,name,code,curriculumVersion,active,locked,updatedAt",
  ),
  curriculumPathways: branchScopedIndexes(
    "schoolId,branchId,curriculumId,name,code,active,updatedAt",
  ),
  curriculumSubjects: branchScopedIndexes(
    "schoolId,branchId,curriculumId,subjectId,pathwayId,organizationId,type,orderIndex,active,updatedAt,[curriculumId+subjectId+pathwayId]",
  ),
  classSubjects: branchScopedIndexes(
    "schoolId,branchId,classId,subjectId,curriculumSubjectId,academicStructureId,academicPeriodId,teacherId,active,locked,updatedAt,[classId+subjectId]",
  ),
  subjectPrerequisites: branchScopedIndexes(
    "schoolId,branchId,curriculumSubjectId,prerequisiteSubjectId,type,groupCode,active,updatedAt",
  ),
  studentCurriculums: branchScopedIndexes(
    "schoolId,branchId,studentId,curriculumId,pathwayId,status,active,updatedAt",
  ),
  subjectOfferings: branchScopedIndexes(
    "schoolId,branchId,curriculumSubjectId,classSubjectId,subjectId,classId,academicPeriodId,teacherId,deliveryMode,active,updatedAt",
  ),
  assignments: branchScopedIndexes(
    "schoolId,branchId,teacherId,classId,subjectId,updatedAt,[teacherId+classId+subjectId]",
  ),
  classTeachers: branchScopedIndexes(
    "schoolId,branchId,classId,teacherId,updatedAt,[classId+teacherId]",
  ),
  studentEnrollments: branchScopedIndexes(
    "schoolId,branchId,studentId,classId,academicStructureId,academicPeriodId,status,startDate,endDate,updatedAt,[studentId+academicPeriodId]",
  ),
};
