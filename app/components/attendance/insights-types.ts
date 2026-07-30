export type AttendanceStatus = "present" | "absent" | "late";
export type AttendanceRiskLevel = "low" | "medium" | "high" | "critical";

export interface AttendanceTotals {
  daysOpened: number;
  daysPresent: number;
  daysAbsent: number;
  timesLate: number;
  attendancePercent: number;
}

export interface AttendanceStatusBreakdown {
  present: number;
  absent: number;
  late: number;
  unmarked?: number;
}

export interface AttendanceSummaryData extends AttendanceTotals {
  totalStudents?: number;
  markedStudents?: number;
  unmarkedStudents?: number;
}

export interface AttendanceRiskItem {
  id: string;
  studentId?: string;
  studentName: string;
  admissionNumber?: string | null;
  className?: string | null;
  attendancePercent: number;
  daysAbsent: number;
  timesLate: number;
  riskLevel?: AttendanceRiskLevel;
  photoUrl?: string | null;
}

export interface StudentAttendanceRow extends AttendanceTotals {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string | null;
  classId?: string | null;
  className?: string | null;
  photoUrl?: string | null;
  note?: string | null;
}

export interface ClassAttendanceRow extends AttendanceTotals {
  id: string;
  classId: string;
  className: string;
  totalStudents: number;
  atRiskStudents?: number;
}

export interface AttendanceTrendPoint {
  id?: string;
  label: string;
  date?: string;
  present: number;
  absent: number;
  late: number;
  attendancePercent: number;
}

export interface AttendanceReportFiltersValue {
  academicStructureId?: string;
  academicPeriodId?: string;
  classId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
  status?: "all" | AttendanceStatus;
  risk?: "all" | AttendanceRiskLevel;
  query?: string;
}

export interface AttendanceFilterOption {
  value: string;
  label: string;
}

export interface AttendanceReportMeta {
  schoolName?: string;
  branchName?: string;
  reportTitle?: string;
  periodLabel?: string;
  className?: string;
  dateRangeLabel?: string;
  generatedAt?: string | number | Date;
  generatedBy?: string;
}
