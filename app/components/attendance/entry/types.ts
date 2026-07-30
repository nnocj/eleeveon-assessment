import type {
  Attendance,
  AttendanceStatus,
} from "../../../lib/attendance";

export interface AttendanceStudent {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  studentId?: string | null;
  admissionNumber?: string | null;
  imageUrl?: string | null;
  className?: string | null;
  gender?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AttendanceDraft {
  studentId: string;
  status: AttendanceStatus;
  note?: string | null;
  dirty?: boolean;
}

export interface AttendanceEntryChange {
  student: AttendanceStudent;
  attendance?: Attendance;
  draft: AttendanceDraft;
}

export type AttendanceEntryViewMode =
  | "cards"
  | "table";

export interface AttendanceEntrySummary {
  total: number;
  entered: number;
  unentered: number;
  changed: number;
  byStatus: Record<string, number>;
}
