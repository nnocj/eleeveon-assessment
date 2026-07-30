import type {
  IdentityCredentialStatus,
  IdentityCredentialType,
  IdentityDeviceCapability,
  IdentityPurpose,
  IdentitySubjectType,
} from "./types";

export const IDENTITY_TOKEN_PREFIX = "ELEEVEON-ID";
export const IDENTITY_QR_VERSION = 1;
export const IDENTITY_DEFAULT_GEOFENCE_RADIUS_METERS = 75;
export const IDENTITY_DEFAULT_DUPLICATE_WINDOW_MS = 30_000;
export const IDENTITY_DEVICE_OFFLINE_AFTER_MS = 5 * 60_000;

export const IDENTITY_SUBJECT_TYPES = [
  "student",
  "teacher",
  "staff",
  "parent",
  "guardian",
  "visitor",
] as const satisfies readonly IdentitySubjectType[];

export const IDENTITY_CREDENTIAL_TYPES = [
  "qr_code",
  "nfc_card",
  "rfid_card",
  "fingerprint",
  "face_profile",
  "student_id",
  "staff_id",
  "parent_pass",
  "visitor_pass",
  "mobile_pass",
] as const satisfies readonly IdentityCredentialType[];

export const IDENTITY_CREDENTIAL_STATUSES = [
  "pending",
  "active",
  "suspended",
  "expired",
  "revoked",
  "replaced",
] as const satisfies readonly IdentityCredentialStatus[];

export const IDENTITY_PURPOSES = [
  "student_attendance",
  "staff_clock_in",
  "staff_clock_out",
  "identity_card_verification",
  "parent_pickup",
  "visitor_entry",
  "visitor_exit",
  "transport_board",
  "transport_arrival",
  "transport_alight",
  "emergency_roll_call",
] as const satisfies readonly IdentityPurpose[];

export const CAPABILITY_BY_CREDENTIAL_TYPE: Partial<
  Record<IdentityCredentialType, IdentityDeviceCapability>
> = {
  qr_code: "qr_scan",
  nfc_card: "nfc_read",
  rfid_card: "rfid_read",
  fingerprint: "fingerprint_match",
  face_profile: "face_match",
  mobile_pass: "qr_scan",
  parent_pass: "qr_scan",
  visitor_pass: "qr_scan",
  student_id: "barcode_scan",
  staff_id: "barcode_scan",
};

export const TERMINAL_CREDENTIAL_STATUSES =
  new Set<IdentityCredentialStatus>([
    "expired",
    "revoked",
    "replaced",
  ]);
