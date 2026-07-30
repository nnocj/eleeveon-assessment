import type {
  Attendance,
  AttendanceCaptureEvent,
  AttendanceCaptureMethod,
  AttendanceEvidenceAsset,
  AttendancePersonType,
  AttendanceSession,
  AttendanceSessionStatus,
  AttendanceStatus,
  AttendanceSummaryEntryMode,
  AttendanceVerificationStatus,
  StudentAttendanceSummary,
  TeacherAttendance,
} from "../db/db";

import type {
  IdentityActivityEvent,
  IdentityMutationContext,
  IdentityScanPayload,
} from "../identity";

export type {
  Attendance,
  AttendanceCaptureEvent,
  AttendanceCaptureMethod,
  AttendanceEvidenceAsset,
  AttendancePersonType,
  AttendanceSession,
  AttendanceSessionStatus,
  AttendanceStatus,
  AttendanceSummaryEntryMode,
  AttendanceVerificationStatus,
  IdentityActivityEvent,
  IdentityMutationContext,
  IdentityScanPayload,
  StudentAttendanceSummary,
  TeacherAttendance,
};

export interface AttendanceScope {
  accountId: string;
  schoolId: string;
  branchId: string;
  academicStructureId?: string | null;
  academicPeriodId?: string | null;
  classId?: string | null;
}

export interface AttendanceRecordInput {
  studentId: string;
  classId: string;
  academicStructureId: string;
  academicPeriodId: string;
  date: string;
  status: AttendanceStatus;
  sessionId?: string | null;
  captureEventId?: string | null;
  identityActivityEventId?: string | null;
  credentialId?: string | null;
  attendanceDeviceId?: string | null;
  captureMethod?: AttendanceCaptureMethod;
  verificationStatus?: AttendanceVerificationStatus;
  capturedAt?: number | null;
  capturedByUserId?: string | null;
  verifiedAt?: number | null;
  verifiedByUserId?: string | null;
  note?: string | null;
}

export interface BulkAttendanceInput {
  classId: string;
  academicStructureId: string;
  academicPeriodId: string;
  date: string;
  sessionId?: string | null;
  records: readonly {
    studentId: string;
    status: AttendanceStatus;
    note?: string | null;
  }[];
}

export interface AttendanceCaptureInput {
  sessionId?: string | null;
  personType: AttendancePersonType;
  personId?: string | null;
  rawValue: string;
  captureMethod: AttendanceCaptureMethod;
  purpose?: "student_attendance" | "staff_clock_in" | "staff_clock_out";
  attendanceStatus?: AttendanceStatus | null;
  identityDeviceId?: string | null;
  attendanceDeviceId?: string | null;
  accessPointId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}

export interface StudentAttendanceTotals {
  daysPresent: number;
  daysOpened: number;
  daysAbsent: number;
  timesLate: number;
  attendancePercent: number;
}

export interface AttendanceBreakdown {
  total: number;
  byStatus: Record<string, number>;
  presentEquivalent: number;
  absentEquivalent: number;
  attendancePercent: number;
}

export interface AttendanceTrendPoint {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  attendancePercent: number;
}

export interface TeacherClockResult {
  record: TeacherAttendance;
  action: "clock_in" | "clock_out" | "unchanged";
}

export interface AttendanceReportRow {
  studentId: string;
  studentName?: string;
  daysPresent: number;
  daysOpened: number;
  daysAbsent: number;
  timesLate: number;
  attendancePercent: number;
}

export interface AttendanceReport {
  schoolId: string;
  branchId: string;
  academicPeriodId: string;
  classId?: string | null;
  generatedAt: number;
  rows: AttendanceReportRow[];
  totals: StudentAttendanceTotals;
}
