/**
 * app/lib/db/modules/attendance.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the attendance module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { branchScopedIndexes } from "../core/indexes";

export const ATTENDANCE_TABLE_NAMES = [
  "attendance",
  "studentAttendanceSummaries",
  "teacherAttendance",
  "attendanceSessions",
  "attendanceDevices",
  "attendanceCredentials",
  "attendanceCredentialEvents",
  "attendanceCaptureEvents",
  "attendanceEvidenceAssets",
] as const;

export const ATTENDANCE_STORES: Record<string, string> = {
  attendance: branchScopedIndexes(
    "schoolId,branchId,studentId,classId,academicStructureId,academicPeriodId,date,status,sessionId,captureEventId,captureMethod,verificationStatus,updatedAt,[studentId+date]",
  ),
  studentAttendanceSummaries: branchScopedIndexes(
    "schoolId,branchId,studentId,classId,academicStructureId,academicPeriodId,entryMode,updatedAt,[studentId+academicPeriodId]",
  ),
  teacherAttendance: branchScopedIndexes(
    "schoolId,branchId,teacherId,date,status,sessionId,attendanceDeviceId,verificationStatus,updatedAt,[teacherId+date]",
  ),
  attendanceSessions: branchScopedIndexes(
    "schoolId,branchId,academicStructureId,academicPeriodId,classId,teacherId,scopeType,scopeId,date,status,active,updatedAt",
  ),
  attendanceDevices: branchScopedIndexes(
    "schoolId,branchId,identityDeviceId,name,deviceType,provider,providerDeviceId,serialNumber,active,lastSeenAt,lastSyncAt,updatedAt",
  ),
  attendanceCredentials: branchScopedIndexes(
    "schoolId,branchId,identityCredentialId,personType,personId,credentialType,status,serialNumber,expiresAt,lastUsedAt,updatedAt",
  ),
  attendanceCredentialEvents: branchScopedIndexes(
    "schoolId,branchId,credentialId,personType,personId,eventType,occurredAt,attendanceDeviceId,updatedAt",
  ),
  attendanceCaptureEvents: branchScopedIndexes(
    "schoolId,branchId,sessionId,personType,personId,credentialId,attendanceDeviceId,captureMethod,capturedAt,verificationStatus,attendanceStatus,attendanceRecordId,updatedAt",
  ),
  attendanceEvidenceAssets: branchScopedIndexes(
    "schoolId,branchId,captureEventId,mediaAssetId,evidenceType,retainedUntil,active,updatedAt",
  ),
};
