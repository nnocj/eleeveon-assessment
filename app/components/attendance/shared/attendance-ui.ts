import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUSES,
  type AttendanceCaptureMethod,
  type AttendanceSessionStatus,
  type AttendanceStatus,
  type AttendanceVerificationStatus,
} from "../../../lib/attendance";

export type AttendanceTone =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "muted";

export const ATTENDANCE_STATUS_ICONS: Record<
  AttendanceStatus,
  string
> = {
  present: "✓",
  absent: "×",
  late: "◷",
  excused: "E",
  medical: "+",
  sports: "S",
  trip: "T",
  holiday: "H",
  remote: "R",
  suspended: "!",
};

export const ATTENDANCE_STATUS_TONES: Record<
  AttendanceStatus,
  AttendanceTone
> = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "info",
  medical: "info",
  sports: "success",
  trip: "info",
  holiday: "muted",
  remote: "success",
  suspended: "danger",
};

export const ATTENDANCE_CAPTURE_METHOD_LABELS: Record<
  AttendanceCaptureMethod,
  string
> = {
  manual: "Manual",
  teacher_device: "Teacher device",
  student_device: "Student device",
  student_id: "Student ID",
  qr_code: "QR code",
  fingerprint: "Fingerprint",
  face: "Face",
  nfc: "NFC",
  gps: "GPS",
  api: "API",
  import: "Import",
};

export const ATTENDANCE_CAPTURE_METHOD_ICONS: Record<
  AttendanceCaptureMethod,
  string
> = {
  manual: "✎",
  teacher_device: "▣",
  student_device: "▤",
  student_id: "ID",
  qr_code: "⌗",
  fingerprint: "◉",
  face: "☺",
  nfc: ")))",
  gps: "⌖",
  api: "↔",
  import: "⇩",
};

export const ATTENDANCE_VERIFICATION_LABELS: Record<
  AttendanceVerificationStatus,
  string
> = {
  verified: "Verified",
  pending: "Pending",
  rejected: "Rejected",
  overridden: "Overridden",
};
export const ATTENDANCE_SESSION_STATUS_LABELS: Record<
  AttendanceSessionStatus,
  string
> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  cancelled: "Cancelled",
};

export function attendanceStatusLabel(
  status: AttendanceStatus,
): string {
  return ATTENDANCE_STATUS_LABELS[status] ?? status;
}

export function attendanceStatusTone(
  status: AttendanceStatus,
): AttendanceTone {
  return ATTENDANCE_STATUS_TONES[status] ?? "neutral";
}

export function attendanceToneStyles(
  tone: AttendanceTone,
): {
  background: string;
  color: string;
  borderColor: string;
} {
  switch (tone) {
    case "success":
      return {
        background:
          "var(--success-soft, rgba(22,163,74,.11))",
        color: "var(--success, #15803d)",
        borderColor:
          "var(--success-border, rgba(22,163,74,.25))",
      };

    case "danger":
      return {
        background:
          "var(--danger-soft, rgba(220,38,38,.10))",
        color: "var(--danger, #dc2626)",
        borderColor:
          "var(--danger-border, rgba(220,38,38,.24))",
      };

    case "warning":
      return {
        background:
          "var(--warning-soft, rgba(217,119,6,.11))",
        color: "var(--warning, #b45309)",
        borderColor:
          "var(--warning-border, rgba(217,119,6,.25))",
      };

    case "info":
      return {
        background:
          "var(--info-soft, rgba(37,99,235,.10))",
        color: "var(--primary, #2563eb)",
        borderColor:
          "var(--info-border, rgba(37,99,235,.22))",
      };

    case "muted":
      return {
        background:
          "var(--muted, rgba(148,163,184,.14))",
        color:
          "var(--muted-foreground, #64748b)",
        borderColor:
          "var(--border, rgba(15,23,42,.12))",
      };

    case "neutral":
    default:
      return {
        background: "var(--background, #fff)",
        color: "var(--foreground, #0f172a)",
        borderColor:
          "var(--border, rgba(15,23,42,.12))",
      };
  }
}

export { ATTENDANCE_STATUSES };
