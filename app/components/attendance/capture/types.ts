import type {
  AttendanceCaptureEvent,
  AttendanceCaptureMethod,
  AttendancePersonType,
  AttendanceStatus,
  AttendanceVerificationStatus,
} from "../../../lib/attendance";

import type {
  AttendanceDevice,
} from "../../../lib/db/db";

/**
 * Attendance only consumes the Identity scanner for attendance-related
 * operations. Identity continues to own camera access, QR/barcode decoding,
 * credential matching and verification.
 */
export type AttendanceIdentityPurpose =
  | "student_attendance"
  | "staff_clock_in"
  | "staff_clock_out";

export interface AttendanceIdentityResult {
  subjectId?: string | null;
  subjectType?: string | null;

  credentialId?: string | null;
  identityCredentialId?: string | null;

  identityActivityEventId?: string | null;
  identityDeviceId?: string | null;

  verificationStatus?:
    | AttendanceVerificationStatus
    | null;

  confidenceScore?: number | null;
  rawValue?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AttendanceCaptureDraft {
  personId: string;
  personType: AttendancePersonType;

  attendanceStatus: AttendanceStatus;
  captureMethod: AttendanceCaptureMethod;
  verificationStatus: AttendanceVerificationStatus;

  credentialId?: string | null;
  identityCredentialId?: string | null;

  identityActivityEventId?: string | null;
  identityDeviceId?: string | null;
  attendanceDeviceId?: string | null;

  confidenceScore?: number | null;
  note?: string | null;
}

export interface AttendanceCapturePerson {
  id: string;
  name: string;
  personType: AttendancePersonType;

  reference?: string | null;
  imageUrl?: string | null;
  subtitle?: string | null;
}

export interface AttendanceCaptureDisplayResult {
  event?: AttendanceCaptureEvent | null;
  person?: AttendanceCapturePerson | null;
  duplicate?: AttendanceCaptureEvent | null;

  message?: string | null;
  success?: boolean;
}

export interface AttendanceScannerAdapterProps {
  purpose: AttendanceIdentityPurpose;
  disabled?: boolean;

  onResult: (
    result: AttendanceIdentityResult,
  ) => void | Promise<void>;
}

export type {
  AttendanceCaptureEvent,
  AttendanceDevice,
};