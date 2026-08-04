/**
 * app/lib/db/modules/schools.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the school structure and people module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { branchScopedIndexes, schoolScopedIndexes } from "../core/indexes";

export const SCHOOL_TABLE_NAMES = [
  "schools",
  "branches",
  "organizations",
  "students",
  "teachers",
  "parents",
  "studentParents",
] as const;

export const SCHOOL_STORES: Record<string, string> = {
  schools: schoolScopedIndexes(
    "name,email,phone,country,countryCode,active,updatedAt",
  ),
  branches: schoolScopedIndexes(
    "schoolId,name,code,city,country,countryCode,active,updatedAt,[accountId+schoolId]",
  ),
  organizations: branchScopedIndexes(
    "schoolId,branchId,parentOrganizationId,name,type,active,updatedAt",
  ),
  students: branchScopedIndexes(
    "schoolId,branchId,organizationId,currentClassId,admissionNumber,fullName,email,status,active,updatedAt,[accountId+branchId+currentClassId]",
  ),
  teachers: branchScopedIndexes(
    "schoolId,branchId,organizationId,fullName,email,phone,role,active,updatedAt",
  ),
  parents: branchScopedIndexes(
    "schoolId,branchId,fullName,email,phone,relationship,active,updatedAt",
  ),
  studentParents: branchScopedIndexes(
    "schoolId,branchId,studentId,parentId,relationship,isPrimary,active,updatedAt,[studentId+parentId]",
  ),
};
