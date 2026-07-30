import type {
  EmergencyRollCallEntry,
  EmergencyRollCallEntryStatus,
  EmergencyRollCallSession,
  IdentityAccessPoint,
  IdentityActivityEvent,
  IdentityActivityOutcome,
  IdentityCredential,
  IdentityCredentialEvent,
  IdentityCredentialEventType,
  IdentityCredentialStatus,
  IdentityCredentialType,
  IdentityDevice,
  IdentityDeviceCapability,
  IdentityPurpose,
  IdentitySubjectType,
  IdentityVerificationStatus,
  MapLocationFields,
  PickupAuthorization,
  Role,
  SchoolVehicle,
  StudentIdentityCard,
  StudentPickupEvent,
  TransportJourney,
  TransportJourneyEvent,
  TransportJourneyEventType,
  TransportRoute,
  TransportStop,
  VisitorProfile,
  VisitorVisit,
} from "../db/db";

export type {
  EmergencyRollCallEntry,
  EmergencyRollCallEntryStatus,
  EmergencyRollCallSession,
  IdentityAccessPoint,
  IdentityActivityEvent,
  IdentityActivityOutcome,
  IdentityCredential,
  IdentityCredentialEvent,
  IdentityCredentialEventType,
  IdentityCredentialStatus,
  IdentityCredentialType,
  IdentityDevice,
  IdentityDeviceCapability,
  IdentityPurpose,
  IdentitySubjectType,
  IdentityVerificationStatus,
  MapLocationFields,
  PickupAuthorization,
  Role,
  SchoolVehicle,
  StudentIdentityCard,
  StudentPickupEvent,
  TransportJourney,
  TransportJourneyEvent,
  TransportJourneyEventType,
  TransportRoute,
  TransportStop,
  VisitorProfile,
  VisitorVisit,
};

export interface IdentityMutationContext {
  accountId: string;
  schoolId: string;
  branchId?: string | null;
  deviceId: string;
  userId?: string | null;
  now?: number;
}

export interface IdentityScope {
  accountId: string;
  schoolId: string;
  branchId?: string | null;
}

export interface IdentitySubjectRef {
  subjectType: IdentitySubjectType;
  subjectId: string;
}

export interface IdentityScanPayload {
  rawValue: string;
  credentialType?: IdentityCredentialType;
  purpose: IdentityPurpose;
  identityDeviceId?: string | null;
  accessPointId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  occurredAt?: number;
  capturedByUserId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CredentialVerificationResult {
  ok: boolean;
  status: IdentityVerificationStatus;
  outcome: IdentityActivityOutcome;
  credential?: IdentityCredential;
  failureCode?: string;
  message?: string;
}

export interface GeofenceResult {
  inside: boolean;
  distanceMeters: number;
  radiusMeters: number;
}

export interface IdentityAnalyticsSnapshot {
  totalActivities: number;
  acceptedActivities: number;
  deniedActivities: number;
  failedActivities: number;
  pendingActivities: number;
  uniqueSubjects: number;
  byPurpose: Record<string, number>;
  byOutcome: Record<string, number>;
  bySubjectType: Record<string, number>;
}

export interface IdentityPermissionContext {
  role: Role | string;
  userId?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
}

export type IdentityPermissionAction =
  | "credential.read"
  | "credential.issue"
  | "credential.suspend"
  | "credential.revoke"
  | "device.manage"
  | "accessPoint.manage"
  | "activity.read"
  | "activity.capture"
  | "card.issue"
  | "card.print"
  | "pickup.authorize"
  | "pickup.release"
  | "visitor.manage"
  | "transport.manage"
  | "transport.capture"
  | "emergency.manage"
  | "emergency.confirm"
  | "analytics.read";
