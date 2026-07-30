import type {
  AttendanceCaptureMethod,
  AttendanceStatus,
} from "./types";

export const ATTENDANCE_PRESENT_STATUSES = new Set<AttendanceStatus>([
  "present",
  "late",
  "remote",
  "sports",
  "trip",
]);

export const ATTENDANCE_ABSENT_STATUSES = new Set<AttendanceStatus>([
  "absent",
  "suspended",
]);

export const ATTENDANCE_NEUTRAL_STATUSES = new Set<AttendanceStatus>([
  "excused",
  "medical",
  "holiday",
]);

export const ATTENDANCE_CAPTURE_METHODS = [
  "manual",
  "teacher_device",
  "student_device",
  "student_id",
  "qr_code",
  "fingerprint",
  "face",
  "nfc",
  "gps",
  "api",
  "import",
] as const satisfies readonly AttendanceCaptureMethod[];

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "excused",
  "medical",
  "sports",
  "trip",
  "holiday",
  "remote",
  "suspended",
] as const satisfies readonly AttendanceStatus[];

export const DEFAULT_ATTENDANCE_STATUS: AttendanceStatus = "present";
export const DEFAULT_STUDENT_CAPTURE_METHOD: AttendanceCaptureMethod = "qr_code";
export const DEFAULT_TEACHER_CAPTURE_METHOD: AttendanceCaptureMethod = "qr_code";
export const DEFAULT_LATE_AFTER_MINUTE = 15;
export const DEFAULT_ABSENT_AFTER_MINUTE = 60;
export const DEFAULT_ATTENDANCE_DUPLICATE_WINDOW_MS = 30_000;

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
  medical: "Medical",
  sports: "Sports",
  trip: "Trip",
  holiday: "Holiday",
  remote: "Remote",
  suspended: "Suspended",
};
