import Dexie, { Table } from "dexie";
import { SyncStatus } from "../constants/syncStatus";
import { APP_DB_VERSION, APP_DB_NAME } from "./db-version";
import { LOCAL_PROTECTION_STORES, type DatabaseRecoveryBackup, type LocalMigrationJournal, type SyncQuarantineRecord } from "./db-migrations";

// ======================================================
// GLOBAL TYPES
// ======================================================

export type Role =
  
  | "developer"
  | "platform_team"
  | "owner"
  | "super_admin"
  | "branch_admin"
  | "admin"
  | "teacher"
  | "student"
  | "accountant"
  | "parent";

export type TermType =
  | "Term 1"
  | "Term 2"
  | "Term 3"
  | "Semester 1"
  | "Semester 2"
  | "Quarter 1"
  | "Quarter 2"
  | "Quarter 3"
  | "Quarter 4"

export type SystemMode =
  | "active"
  | "locked"
  | "promotion";

export type AcademicLevel =
  | "nursery"
  | "primary"
  | "junior_high"
  | "senior_high"
  | "tertiary";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "excused"
  | "medical"
  | "sports"
  | "trip"
  | "holiday"
  | "remote"
  | "suspended";

export type AttendanceSummaryEntryMode =
  | "calculated"
  | "manual";


export type AttendancePersonType = "student" | "teacher" | "staff";

export type AttendanceCaptureMethod =
  | "manual"
  | "teacher_device"
  | "student_device"
  | "student_id"
  | "qr_code"
  | "fingerprint"
  | "face"
  | "nfc"
  | "gps"
  | "api"
  | "import";

export type AttendanceVerificationStatus =
  | "verified"
  | "pending"
  | "rejected"
  | "overridden";

export type AttendanceCredentialType =
  | "qr_code"
  | "fingerprint"
  | "face_profile"
  | "nfc_card"
  | "student_id"
  | "device_passkey";

export type AttendanceCredentialStatus =
  | "pending"
  | "active"
  | "expired"
  | "revoked"
  | "replaced";

export type AttendanceCredentialEventType =
  | "generated"
  | "printed"
  | "enrolled"
  | "activated"
  | "verified"
  | "failed_verification"
  | "revoked"
  | "expired"
  | "replaced"
  | "reissued";

export type AttendanceSessionStatus =
  | "draft"
  | "open"
  | "closed"
  | "cancelled";

/* ============================================================================
 * SHARED IDENTITY, SAFETY & MOVEMENT TYPES
 * --------------------------------------------------------------------------
 * Attendance remains backward compatible. These broader identity contracts
 * power student/staff attendance, identity cards, authorized pickup, visitors,
 * school transport and emergency roll calls.
 * ========================================================================== */

export type IdentitySubjectType =
  | "student"
  | "teacher"
  | "staff"
  | "parent"
  | "guardian"
  | "visitor";

export type IdentityCredentialType =
  | "qr_code"
  | "nfc_card"
  | "rfid_card"
  | "fingerprint"
  | "face_profile"
  | "student_id"
  | "staff_id"
  | "parent_pass"
  | "visitor_pass"
  | "mobile_pass";

export type IdentityCredentialStatus =
  | "pending"
  | "active"
  | "suspended"
  | "expired"
  | "revoked"
  | "replaced";

export type IdentityCredentialTemplateKey =
  | "modern_clean"
  | "classic_school"
  | "compact_qr_pass"
  | "premium_gradient"
  | "custom";

export type IdentityCredentialCardOrientation = "portrait" | "landscape";
export type IdentityCredentialCardSides = "front_only" | "front_and_back";
export type IdentityCredentialPhotoShape = "circle" | "rounded" | "square";
export type IdentityCredentialQrPosition =
  | "front_left"
  | "front_right"
  | "front_center"
  | "back_left"
  | "back_right"
  | "back_center";
export type IdentityCredentialQrSize = "small" | "medium" | "large";
export type IdentityCredentialBorderStyle =
  | "none"
  | "solid"
  | "double"
  | "accent";

export type IdentityCredentialEventType =
  | "generated"
  | "printed"
  | "issued"
  | "enrolled"
  | "activated"
  | "verified"
  | "verification_failed"
  | "used"
  | "suspended"
  | "reactivated"
  | "revoked"
  | "expired"
  | "replaced"
  | "reissued";

export type IdentityDeviceType =
  | "phone"
  | "tablet"
  | "computer"
  | "kiosk"
  | "qr_scanner"
  | "barcode_scanner"
  | "fingerprint_scanner"
  | "face_terminal"
  | "nfc_reader"
  | "rfid_reader"
  | "vehicle_gateway"
  | "gps_tracker"
  | "api_gateway"
  | "other";

export type IdentityDeviceCapability =
  | "qr_scan"
  | "barcode_scan"
  | "nfc_read"
  | "rfid_read"
  | "fingerprint_match"
  | "face_match"
  | "gps_capture"
  | "photo_capture"
  | "signature_capture";

export type IdentityAccessPointType =
  | "school_gate"
  | "branch_gate"
  | "classroom"
  | "staff_office"
  | "reception"
  | "pickup_desk"
  | "bus"
  | "bus_stop"
  | "assembly_point"
  | "custom";

export type IdentityPurpose =
  | "student_attendance"
  | "staff_clock_in"
  | "staff_clock_out"
  | "identity_card_verification"
  | "parent_pickup"
  | "visitor_entry"
  | "visitor_exit"
  | "transport_board"
  | "transport_arrival"
  | "transport_alight"
  | "emergency_roll_call";

export type IdentityVerificationStatus =
  | "verified"
  | "pending"
  | "rejected"
  | "overridden";

export type IdentityActivityOutcome =
  | "accepted"
  | "pending"
  | "denied"
  | "failed"
  | "duplicate"
  | "overridden"
  | "cancelled";

export type StudentIdentityCardStatus =
  | "draft"
  | "issued"
  | "printed"
  | "active"
  | "expired"
  | "revoked"
  | "replaced";

export type PickupAuthorizationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "revoked"
  | "expired";

export type StudentPickupStatus =
  | "requested"
  | "verified"
  | "approved"
  | "released"
  | "denied"
  | "cancelled";

export type VisitorVisitStatus =
  | "expected"
  | "pending"
  | "approved"
  | "checked_in"
  | "checked_out"
  | "denied"
  | "cancelled";

export type TransportJourneyStatus =
  | "scheduled"
  | "boarding"
  | "in_transit"
  | "arrived"
  | "completed"
  | "cancelled";

export type TransportJourneyEventType =
  | "boarded"
  | "arrived_school"
  | "boarded_home"
  | "alighted"
  | "missed"
  | "denied";

export type EmergencyRollCallEntryStatus =
  | "unconfirmed"
  | "safe"
  | "missing"
  | "injured"
  | "evacuated"
  | "not_expected"
  | "unknown";

export type PaymentMethod =
  | "cash"
  | "momo"
  | "bank"
  | "card";

export type TransactionType =
  | "income"
  | "expense";

export type CurriculumSubjectType =
  | "core"
  | "elective"
  | "optional";

export type DeliveryMode =
  | "physical"
  | "online"
  | "hybrid";

export type ExpenseSourceType =
  | "utilities"
  | "salary"
  | "transport"
  | "feeding"
  | "maintenance"
  | "procurement"
  | "events"
  | "academic"
  | "administration"
  | "technology"
  | "marketing"
  | "security"
  | "other";

export type CurrencyCode =
  | "GHS"
  | "USD"
  | "EUR"
  | "GBP"
  | "NGN"
  | "KES"
  | "ZAR"
  | "XOF"
  | "XAF"
  | string;

export type PaymentChannel =
  | "cash"
  | "momo"
  | "bank"
  | "card"
  | "manual";

export type PaymentProvider =
  | "paystack"
  | "hubtel"
  | "flutterwave"
  | "manual"
  | "cash"
  | "bank"
  | string;

export type PaymentStatus =
  | "draft"
  | "pending"
  | "processing"
  | "paid"
  | "part_paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "reversed";

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "part_paid"
  | "paid"
  | "overdue"
  | "cancelled"
  | "void";

export type PayrollRunStatus =
  | "draft"
  | "review"
  | "approved"
  | "processing"
  | "paid"
  | "cancelled";

export type PayrollItemStatus =
  | "pending"
  | "approved"
  | "paid"
  | "failed"
  | "cancelled";

export type StaffPayType =
  | "monthly"
  | "weekly"
  | "daily"
  | "hourly"
  | "contract"
  | "commission";

export type CommunicationChannel =
  | "in_app"
  | "sms"
  | "email"
  | "whatsapp"
  | "push";

export type AnnouncementAudience =
  | "all"
  | "staff"
  | "teachers"
  | "parents"
  | "students"
  | "class"
  | "organization"
  | "custom";

export type MessageRecipientType =
  | "user"
  | "teacher"
  | "student"
  | "parent"
  | "staff"
  | "class"
  | "organization";

export type DeliveryStatus =
  | "draft"
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type NotificationPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

// ======================================================
// PORTAL HOME / SCHOOL EXPERIENCE
// ======================================================

export type PortalHighlightMediaType = "image" | "video";

export type PortalHighlightAudience =
  | "all"
  | "branch_admin"
  | "admin"
  | "teacher"
  | "student"
  | "parent"
  | "accountant";

export type PortalHighlightActionType =
  | "none"
  | "portal_route"
  | "external_url"
  | "announcement"
  | "calendar_event";

export type PortalHighlightTransition =
  | "fade"
  | "slide"
  | "crossfade";

export type PortalHighlightStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "expired"
  | "archived";

// ======================================================
// PUBLIC SCHOOL WEBSITE / TEMPLATE SYSTEM
// ======================================================

export type WebsiteStatus = "draft" | "published" | "unpublished" | "archived";
export type WebsitePageStatus = "draft" | "published" | "hidden" | "archived";
export type WebsiteSectionStatus = "draft" | "published" | "hidden" | "archived";
export type WebsiteDomainType = "eleeveon_subdomain" | "custom";
export type WebsiteDomainStatus =
  | "pending"
  | "verifying"
  | "verified"
  | "active"
  | "failed"
  | "disabled";
export type WebsiteSslStatus =
  | "pending"
  | "provisioning"
  | "active"
  | "failed"
  | "expired";
export type WebsiteSectionSourceType =
  | "manual"
  | "school"
  | "branches"
  | "programs"
  | "subjects"
  | "organizations"
  | "teachers"
  | "announcements"
  | "calendar_events"
  | "portal_highlights"
  | "media_gallery"
  | "custom";
export type WebsiteNavigationTarget = "page" | "section" | "external_url" | "portal_login";
export type WebsiteFormType = "contact" | "admissions_enquiry" | "newsletter" | "custom";
export type WebsiteSubmissionStatus = "new" | "reviewing" | "responded" | "closed" | "spam";

export type MediaAssetKind =
  | "image"
  | "document"
  | "audio"
  | "video"
  | "other";

export type MediaUploadStatus =
  | "local"
  | "queued"
  | "uploading"
  | "uploaded"
  | "failed";

export type MediaOwnerTable = string;
export type MediaFieldKey = string;




// ======================================================
// SHARED ADDRESS / MAP LOCATION
// ======================================================

export type LocationSource = "manual" | "device_gps" | "geocoded" | "imported";
export type LocationPrecision = "exact" | "approximate" | "area_only";
export type PersonLocationType =
  | "home"
  | "boarding"
  | "pickup_point"
  | "dropoff_point"
  | "workplace"
  | "other";

export interface AddressFields {
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  locality?: string | null;
  city?: string | null;
  district?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  countryCode?: string | null;
}

export interface MapLocationFields {
  latitude?: number | null;
  longitude?: number | null;
  altitudeMeters?: number | null;
  accuracyMeters?: number | null;
  geohash?: string | null;
  locationLabel?: string | null;
  formattedAddress?: string | null;
  locationSource?: LocationSource | null;
  locationPrecision?: LocationPrecision | null;
  locationCapturedAt?: number | null;
  mapVisible?: boolean;
}

export interface PersonMapLocationFields extends MapLocationFields {
  locationType?: PersonLocationType | null;
  locationConsentGiven?: boolean;
  locationConsentAt?: number | null;
  locationRestricted?: boolean;
}

// ======================================================
// BASE SYNC
// ======================================================

export interface BaseSync {
  id: string;
  accountId: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  deviceId: string;
  createdByDeviceId: string;
  updatedByDeviceId: string;
  synced: SyncStatus;
  isDeleted: boolean;
}

// ======================================================
// MEDIA ASSETS (LOCAL-FIRST FILE / IMAGE SYSTEM)
// ======================================================
//
// Keep large file/blob data out of normal school records so sync payloads
// stay small. Records such as Student, Teacher, Parent, School, Branch,
// Announcement, Income, Expense, etc. may keep their old string fields for
// backwards compatibility, but new uploads should be stored here and linked
// by accountId + ownerTable + ownerId + fieldKey.
//
// ownerTempKey prevents unsaved upload collisions. New records do not yet
// have a local id, so Students, Teachers, Parents, Classes, Settings, etc.
// can attach media with a temporary form/session key first, then clear it
// after the owner permanent ID is known.

export interface MediaAsset extends BaseSync {
  schoolId?: string | null;
  branchId?: string | null;
  ownerTable: MediaOwnerTable;
  ownerId: string;
  ownerTempKey?: string | null;
  fieldKey: MediaFieldKey;
  ownerIdentityKey: string;
  identityVersion: number;
  fileName: string;
  originalFileName?: string | null;
  extension?: string | null;
  mimeType: string;
  assetKind: MediaAssetKind;
  sizeBytes: number;
  originalSizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  checksum?: string | null;
  localBlobId?: number | null;
  localObjectUrl?: string | null;
  thumbnailDataUrl?: string | null;
  previewDataUrl?: string | null;
  remoteUrl?: string | null;
  publicUrl?: string | null;
  remoteKey?: string | null;
  remoteProvider?: string | null;
  uploadStatus: MediaUploadStatus;
  uploadedAt?: string | null;
  lastUploadAttemptAt?: string | null;
  uploadError?: string | null;
  metadata?: any;
  active?: boolean;
}

export interface MediaBlob {
  id?: number;
  accountId: string;
  assetId: string;
  mimeType: string;
  sizeBytes: number;
  blob: Blob;
  createdAt: number;
  updatedAt: number;
}

// ======================================================
// ACCOUNT ACCESS (CLOUD AUTH CACHE)
// ======================================================
//
// These records mirror the backend Prisma AppUser, UserMembership,
// and PermissionRule models for offline/PWA context.
// They do NOT replace the school people records such as Teacher,
// Student, and Parent. Instead, memberships link login users to
// those permanent records through teacherId, studentId and parentId.

export interface LocalAppUser {
  id: string;           // cloud UUID from AppUser
  accountId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: Role;
  active: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalUserMembership {
  id: string;           // cloud UUID from UserMembership
  accountId: string;
  userId: string;
  role: Role;

  schoolId?: string | null;
  branchId?: string | null;

  teacherId?: string | null;
  studentId?: string | null;
  parentId?: string | null;

  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalPermissionRule {
  id: string;           // cloud UUID from PermissionRule
  accountId: string;

  moduleKey: string;
  moduleLabel: string;

  developer: "yes" | "no";
  owner: "yes" | "no";
  admin: "yes" | "no";
  branch: "yes" | "no";
  teacher: "yes" | "no";
  student: "yes" | "no";
  parent: "yes" | "no";
  accountant: "yes" | "no";

  locked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ======================================================
// PLATFORM / BACKEND CACHE TABLES
// ======================================================
//
// These tables mirror the upgraded Prisma platform schema for local UI access.
// Some of them are backend-owned, so the frontend should normally treat them
// as read-only cache records unless a specific module intentionally writes them.

export type AccountStatus =
  | "active"
  | "suspended"
  | "closed"
  | string;

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "expired"
  | "cancelled"
  | "suspended"
  | string;

export type BillingCycle =
  | "monthly"
  | "yearly"
  | "manual"
  | string;

export type PlatformJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | string;

export type PlatformJobPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent"
  | string;

export interface LocalAccount {
  id: string; // cloud UUID from Account
  name: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  currency?: string | null;
  status: AccountStatus;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalUserSession {
  id: string; // cloud UUID from UserSession
  accountId: string;
  userId: string;
  refreshTokenHash?: string | null;
  deviceId?: string | null;
  deviceName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: string;
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalSubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description?: string | null;

  currency?: string;
  priceMonthly: number;
  priceYearly: number;

  maxSchools?: number | null;
  maxBranches?: number | null;
  maxUsers?: number | null;
  maxStudents?: number | null;
  maxTeachers?: number | null;
  maxStorageMb?: number | null;

  offlineSync?: boolean;
  cloudBackup?: boolean;
  reports?: boolean;
  finance?: boolean;
  parentPortal?: boolean;
  studentPortal?: boolean;
  teacherPortal?: boolean;
  advancedAnalytics?: boolean;
  apiAccess?: boolean;

  features?: string[];
  metadata?: any;

  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalAccountSubscription {
  id: string;
  accountId: string;
  planId: string;

  status: SubscriptionStatus;
  billingCycle: BillingCycle;

  trialStartedAt?: string | null;
  trialEndsAt?: string | null;

  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  nextBillingDate?: string | null;

  cancelledAt?: string | null;
  cancelReason?: string | null;

  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalInvoice {
  id: string;
  accountId: string;
  subscriptionId?: string | null;

  invoiceNumber: string;
  currency?: string;

  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;

  status: "draft" | "issued" | "paid" | "void" | "overdue" | string;
  dueDate?: string | null;
  paidAt?: string | null;

  note?: string | null;
  metadata?: any;

  createdAt?: string;
  updatedAt?: string;
}

export interface LocalAppPayment {
  id: string;
  accountId: string;
  subscriptionId?: string | null;
  invoiceId?: string | null;

  amount: number;
  currency?: string;

  method: PaymentChannel | string;
  provider?: PaymentProvider | null;

  status: PaymentStatus | string;

  providerReference?: string | null;
  receiptNumber?: string | null;
  payerName?: string | null;
  payerPhone?: string | null;
  payerEmail?: string | null;

  paidAt?: string | null;
  note?: string | null;
  metadata?: any;

  createdAt?: string;
  updatedAt?: string;
}

export interface LocalBillingEvent {
  id: string;
  accountId: string;
  type: string;
  message: string;
  metadata?: any;
  createdAt?: string;
}

export interface LocalSyncDevice {
  id: string;
  accountId: string;
  deviceId: string;
  userId?: string | null;
  deviceName?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  lastSeenAt?: string | null;
  active?: boolean;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalSyncConflict {
  id: string;
  accountId: string;
  tableName: string;
  localId?: string | null;
  deviceId?: string | null;
  status: "open" | "resolved" | "ignored" | string;
  resolution?: "server_wins" | "client_wins" | "manual_merge" | string | null;
  clientPayload?: any;
  serverPayload?: any;
  resolvedPayload?: any;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalApiClient {
  id: string;
  accountId: string;
  name: string;
  description?: string | null;
  clientId: string;
  allowedOrigins?: string[];
  scopes?: string[];
  active?: boolean;
  lastUsedAt?: string | null;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalApiKey {
  id: string;
  accountId: string;
  apiClientId?: string | null;
  name: string;
  keyPrefix: string;
  scopes?: string[];
  active?: boolean;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  createdByUserId?: string | null;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalWebhook {
  id: string;
  accountId: string;
  name: string;
  url: string;
  events: string[];
  secret?: string | null;
  active?: boolean;
  lastTriggeredAt?: string | null;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalWebhookLog {
  id: string;
  accountId: string;
  webhookId?: string | null;
  eventType: string;
  targetUrl: string;
  status: "pending" | "success" | "failed" | string;
  statusCode?: number | null;
  requestPayload?: any;
  responseBody?: string | null;
  error?: string | null;
  attempts?: number;
  deliveredAt?: string | null;
  createdAt?: string;
}

export interface LocalIntegrationMapping {
  id: string;
  accountId: string;
  integrationKey: string; // eleeveon_learn | external_lms | external_sms etc.
  localTable: string;
  localId?: string | null;
  externalTable?: string | null;
  externalId: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalAuditLog {
  id: string;
  accountId: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
  before?: any;
  after?: any;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: string;
}

export interface LocalBackgroundJob {
  id: string;
  accountId: string;
  type: string;
  status: PlatformJobStatus;
  priority?: PlatformJobPriority;
  payload?: any;
  result?: any;
  error?: string | null;
  attempts?: number;
  maxAttempts?: number;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalStorageUsage {
  id: string;
  accountId: string;
  usedMb: number;
  limitMb?: number | null;
  fileCount?: number;
  imageCount?: number;
  documentCount?: number;
  videoCount?: number;
  lastCalculatedAt?: string | null;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalAccountFeatureFlag {
  id: string;
  accountId: string;
  key: string;
  enabled: boolean;
  value?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalAccountSystemSetting {
  id: string;
  accountId: string;
  key: string;
  value: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocalNotificationDeliveryLog {
  id: string;
  accountId: string;
  channel: CommunicationChannel | string;
  purpose: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  status: DeliveryStatus | string;
  provider?: string | null;
  providerReference?: string | null;
  subject?: string | null;
  body?: string | null;
  metadata?: any;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}



// ======================================================
// CORE (SCHOOL STRUCTURE)
// ======================================================

export interface School extends BaseSync, AddressFields, MapLocationFields {
  name: string;
  logo?: string;
  logoMediaId?: string;
  motto?: string;
  phone?: string;
  email?: string;
  address?: string | null;
  website?: string;
  photo?: string;
  photoMediaId?: string;
  bannerImage?: string;
  bannerImageMediaId?: string;
  galleryImages?: string[];
  galleryMediaIds?: number[];
}

export interface Branch extends BaseSync, AddressFields, MapLocationFields {
  schoolId: string;
  name: string;
  code?: string;
  logo?: string;
  logoMediaId?: string;
  phone?: string;
  email?: string;
  address?: string | null;
  city?: string | null;
  photo?: string;
  photoMediaId?: string;
  bannerImage?: string;
  bannerImageMediaId?: string;
  active?: boolean;
}

export interface AcademicStructure extends BaseSync {
  schoolId: string;
  branchId: string;
  name: string;
  level: AcademicLevel;
  startDate: string;
  endDate: string;
  photo?: string;
  photoMediaId?: string;
  bannerImage?: string;
  bannerImageMediaId?: string;
  active?: boolean;
}

export interface AcademicPeriod extends BaseSync {
  schoolId: string;
  branchId: string;
  academicStructureId: string;
  name: string;
  type?: TermType;
  startDate: string;
  endDate: string;
  photo?: string;
  photoMediaId?: string;
  order: number;
  active?: boolean;
}

export interface Organization extends BaseSync {
  schoolId: string;
  branchId: string;
  parentOrganizationId?: string;
  name: string;
  type:
    | "department"
    | "faculty"
    | "house"
    | "club"
    | "committee"
    | "administration";
  description?: string;
  photo?: string;
  photoMediaId?: string;
  bannerImage?: string;
  bannerImageMediaId?: string;
  active?: boolean;
}

// ======================================================
// PEOPLE
// ======================================================

export interface Student extends BaseSync, AddressFields, PersonMapLocationFields {
  schoolId: string;
  branchId: string;
  organizationId?: string;
  currentClassId?: string;
  admissionNumber?: string;
  fullName: string;
  email?: string;
  gender?: string;
  age?: number;
  dateOfBirth?: string;
  photo?: string;
  photoMediaId?: string;
  coverPhoto?: string;
  coverPhotoMediaId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string | null;
  status?: "active" | "graduated" | "transferred" | "withdrawn";
}

export interface Teacher extends BaseSync, AddressFields, PersonMapLocationFields {
  schoolId: string;
  branchId: string;
  organizationId?: string;
  fullName: string;
  title: string;
  gender?: string;
  age?: number;
  photo?: string;
  photoMediaId?: string;
  coverPhoto?: string;
  coverPhotoMediaId?: string;
  email?: string;
  phone?: string;
  relativePhone?: string;
  employmentDate?: string;
  salary?: number;
  role: "teacher" | "head_teacher" | "lecturer" | "principal";
  qualification?: string;
  signature?: string;
  signatureMediaId?: string;
  active?: boolean;
}

export interface Parent extends BaseSync, AddressFields, PersonMapLocationFields {
  schoolId: string;
  branchId: string;
  fullName: string;
  title: string;
  phone: string;
  photo?: string;
  photoMediaId?: string;
  coverPhoto?: string;
  coverPhotoMediaId?: string;
  email?: string;
  address?: string | null;
  occupation?: string;
  emergencyContact?: string;
  relationship?: "father" | "mother" | "guardian";
}

export interface StudentParent extends BaseSync {
  schoolId: string;
  branchId: string;
  studentId: string;
  parentId: string;
  relationship: "father" | "mother" | "guardian" | "other";
  isPrimary?: boolean;
}

// ======================================================
// ACADEMIC STRUCTURE
// ======================================================

export interface Class extends BaseSync {
  schoolId: string;
  branchId: string;
  organizationId?: string;
  name: string;
  code?: string;
  level?: string;
  photo?: string;
  photoMediaId?: string;
  bannerImage?: string;
  bannerImageMediaId?: string;
  capacity?: number;
  active?: boolean;
}

export interface Subject extends BaseSync {
  schoolId: string;
  branchId: string;
  organizationId?: string;
  name: string;
  code?: string;
  description?: string;
  photo?: string;
  photoMediaId?: string;
  bannerImage?: string;
  bannerImageMediaId?: string;
  credits?: number;
  category?: "academic" | "technical" | "vocational" | "elective" | "core";
  active?: boolean;
}

export interface Program extends BaseSync {
  schoolId: string;
  branchId: string;
  organizationId?: string;
  name: string;
  code?: string;
  photo?: string;
  photoMediaId?: string;
  bannerImage?: string;
  bannerImageMediaId?: string;
  awardType?: string;
  durationYears?: number;
  description?: string;
  active?: boolean;
}

export interface Curriculum extends BaseSync {
  schoolId: string;
  branchId: string;
  organizationId?: string;
  programId?: string;
  academicStructureId: string;
  name: string;
  code?: string;
  photo?: string;
  photoMediaId?: string;
  bannerImage?: string;
  bannerImageMediaId?: string;
  description?: string;
  curriculumVersion?: string;
  totalCredits?: number;
  durationPeriods?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  active?: boolean;
  locked?: boolean;
}

export interface CurriculumPathway extends BaseSync {
  schoolId: string;
  branchId: string;
  curriculumId: string;
  name: string;
  code?: string;
  photo?: string;
  photoMediaId?: string;
  bannerImage?: string;
  bannerImageMediaId?: string;
  description?: string;
  active?: boolean;
}

export interface CurriculumSubject extends BaseSync {
  schoolId: string;
  branchId: string;

  curriculumId: string;
  subjectId: string;

  pathwayId?: string;

  organizationId?: string;

  // =========================
  // ACADEMIC RULES (GLOBAL)
  // =========================
  type?: CurriculumSubjectType;

  credits?: number;
  contactHours?: number;

  minimumPassScore?: number;

  orderIndex?: number;

  active?: boolean;
}

export interface ClassSubject extends BaseSync {
  schoolId: string;
  branchId: string;

  classId: string;
  subjectId: string;

  curriculumSubjectId: string;

  // =========================
  // ACADEMIC CONTEXT
  // =========================
  academicStructureId: string;
  academicPeriodId?: string;

  // =========================
  // TEACHING ASSIGNMENT
  // =========================
  teacherId?: string;

  // =========================
  // OVERRIDES (ONLY IF NEEDED)
  // =========================
  name?: string;
  code?: string;

  // override curriculum defaults if school customizes
  credits?: number;
  contactHours?: number;
  type?: CurriculumSubjectType;

  compulsory?: boolean;
  elective?: boolean;

  // =========================
  // MEDIA
  // =========================
  photo?: string;
  photoMediaId?: string;
  bannerImage?: string;
  bannerImageMediaId?: string;

  // =========================
  // STATUS
  // =========================
  active?: boolean;
  locked?: boolean;
}

export interface SubjectPrerequisite extends BaseSync {
  schoolId: string;
  branchId: string;
  curriculumSubjectId: string;
  prerequisiteSubjectId: string;
  minimumGrade?: string;
  minimumScore?: number;
  type?: "prerequisite" | "corequisite" | "recommended";
  groupCode?: string;
  active?: boolean;
}

export interface StudentCurriculum extends BaseSync {
  schoolId: string;
  branchId: string;
  studentId: string;
  curriculumId: string;
  pathwayId?: string;
  startAcademicPeriodId?: string;
  endAcademicPeriodId?: string;
  status?: "active" | "completed" | "withdrawn";
  active?: boolean;
}

export interface SubjectOffering extends BaseSync {
  schoolId: string;
  branchId: string;
  curriculumSubjectId?: string;
  classSubjectId?: string;
  subjectId: string;
  classId?: string;
  academicPeriodId?: string;
  organizationId?: string;
  teacherId?: string;
  room?: string;
  deliveryMode?: DeliveryMode;
  capacity?: number;
  compulsory?: boolean;
  active?: boolean;
}

export interface Assignment extends BaseSync {
  schoolId: string;
  branchId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
}

export interface ClassTeacher extends BaseSync {
  schoolId: string;
  branchId: string;
  classId: string;
  teacherId: string;
}

export interface StudentEnrollment extends BaseSync {
  schoolId: string;
  branchId: string;
  studentId: string;
  classId: string;
  academicStructureId: string;
  academicPeriodId: string;
  startDate: string;
  endDate?: string;
  status: "active" | "completed" | "promoted" | "withdrawn";
}

// ======================================================
// ASSESSMENT ACTIVATION ENGINE
// ======================================================

export interface AssessmentApplicability extends BaseSync {
  schoolId: string;
  branchId: string;

  classSubjectId: string; // 🔥 ONLY source of truth

  assessmentStructureId: string;
  gradingSystemId?: string;

  organizationId?: string;

  active: boolean;
  locked?: boolean;

  // optional metadata (NOT relational)
  isElective?: boolean;
  groupCode?: string;
}

// ======================================================
// GRADING & ASSESSMENT
// ======================================================

export type GradingSystemType =
  | "percentage"
  | "gpa"
  | "competency"
  | "custom";

export interface GradingSystem extends BaseSync {
  schoolId: string;
  branchId: string;
  organizationId?: string;
  name: string;
  type: GradingSystemType;
  description?: string;
  photo?: string;
  photoMediaId?: string;
  active?: boolean;
  default?: boolean;
  locked?: boolean;
}

export interface GradeRule extends BaseSync {
  schoolId: string;
  branchId: string;
  gradingSystemId: string;
  minScore: number;
  maxScore: number;
  grade: string;
  remark?: string;
  gpa?: number;
  color?: string;
  order: number;
  active?: boolean;
}

export interface AssessmentStructure extends BaseSync {
  schoolId: string;
  branchId: string;
  organizationId?: string;
  academicStructureId: string;
  name: string;
  description?: string;
  photo?: string;
  photoMediaId?: string;
  bannerImage?: string;
  bannerImageMediaId?: string;
  totalScore?: number;
  active?: boolean;
  locked?: boolean;
}

export interface AssessmentStructureItem extends BaseSync {
  schoolId: string;
  branchId: string;
  assessmentStructureId: string;
  name: string;
  weight: number;
  maxScore: number;
  order: number;
  compulsory?: boolean;
  active?: boolean;
}

// ======================================================
// ASSESSMENT EXECUTION
// ======================================================

export interface AssessmentComponent extends BaseSync {
  schoolId: string;
  branchId: string;
  organizationId?: string;
  classId: string;
  subjectId: string;
  academicPeriodId: string;
  assessmentStructureId: string;
  gradingSystemId?: string;
  active: boolean;
}

export interface AssessmentEntry extends BaseSync {
  schoolId: string;
  branchId: string;

  classSubjectId?: string;

  organizationId?: string;
  academicStructureId?: string;
  academicPeriodId: string;

  gradingSystemId?: string;
  assessmentStructureId?: string;
  assessmentStructureItemId: string;

  studentId: string;
  classId: string;
  subjectId: string;

  score: number;
  grade?: string;
  remark?: string;

  published?: boolean;
  locked?: boolean;
  active?: boolean;
}

export interface ComputedResult extends BaseSync {
 
  branchId: string;
  organizationId?: string;
 schoolId: string;
  classSubjectId?: string;

  studentId: string;
  classId: string;
  subjectId: string;

  academicStructureId: string;
  academicPeriodId: string;

  gradingSystemId?: string;

  total: number;
  average?: number;
  percentage?: number;

  grade: string;
  remark?: string;
  gpa?: number;
  position?: number;

  published?: boolean;
  locked?: boolean;
}

// ======================================================
// ATTENDANCE
// ======================================================

export interface Attendance extends BaseSync {
  schoolId: string;
  branchId: string;
  studentId: string;
  classId: string;
  academicStructureId: string;
  academicPeriodId: string;
  date: string;
  status: AttendanceStatus;

  // Optional links keep existing manual attendance records fully compatible.
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
  note?: string;
}

export interface StudentAttendanceSummary extends BaseSync {
  schoolId: string;
  branchId: string;
  studentId: string;
  classId: string;
  academicStructureId: string;
  academicPeriodId: string;

  entryMode: AttendanceSummaryEntryMode;

  daysPresent: number;
  daysOpened: number;
  daysAbsent: number;
  timesLate?: number;

  attendancePercent: number;

  sourceAttendanceUpdatedAt?: number;
  calculatedAt?: number;
  manuallyUpdatedAt?: number;
  note?: string;
}

export interface TeacherAttendance extends BaseSync {
  schoolId: string;
  branchId: string;
  teacherId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;

  sessionId?: string | null;
  clockInCaptureEventId?: string | null;
  clockOutCaptureEventId?: string | null;
  clockInIdentityActivityEventId?: string | null;
  clockOutIdentityActivityEventId?: string | null;
  clockInMethod?: AttendanceCaptureMethod;
  clockOutMethod?: AttendanceCaptureMethod;
  clockInCredentialId?: string | null;
  clockOutCredentialId?: string | null;
  attendanceDeviceId?: string | null;
  verificationStatus?: AttendanceVerificationStatus;
  status?: AttendanceStatus | "on_leave" | "annual_leave" | "sick_leave" | "workshop" | "meeting" | "official_duty";
  lateMinutes?: number;
  earlyDepartureMinutes?: number;
  workingMinutes?: number;
  overtimeMinutes?: number;
  note?: string;
}

/** A lightweight attendance window for a class, branch, teacher or custom scope. */
export interface AttendanceSession extends BaseSync {
  schoolId: string;
  branchId: string;
  academicStructureId?: string | null;
  academicPeriodId?: string | null;
  classId?: string | null;
  teacherId?: string | null;
  scopeType: "branch" | "class" | "teacher" | "staff" | "custom";
  scopeId?: string | null;
  date: string;
  name?: string;
  openedAt: number;
  closedAt?: number | null;
  openedByUserId?: string | null;
  closedByUserId?: string | null;
  defaultStatus?: AttendanceStatus;
  lateAfterMinute?: number | null;
  absentAfterMinute?: number | null;
  status: AttendanceSessionStatus;
  active?: boolean;
}

/** Registered phone, scanner, kiosk or gateway used to capture attendance. */
export interface AttendanceDevice extends BaseSync {
  identityDeviceId?: string | null;
  schoolId: string;
  branchId: string;
  name: string;
  deviceType: "phone" | "tablet" | "computer" | "fingerprint_scanner" | "face_terminal" | "nfc_reader" | "gateway" | "other";
  provider?: string | null;
  providerDeviceId?: string | null;
  serialNumber?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  locationLabel?: string | null;
  lastSeenAt?: number | null;
  lastSyncAt?: number | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Identity credential used for matching. QR images and biometric images are not
 * stored here; only compact tokens, hashes, provider references and lifecycle data.
 */
export interface AttendanceCredential extends BaseSync {
  identityCredentialId?: string | null;
  schoolId: string;
  branchId: string;
  personType: AttendancePersonType;
  personId: string;
  credentialType: AttendanceCredentialType;
  status: AttendanceCredentialStatus;
  credentialReference?: string | null;
  tokenHash?: string | null;
  serialNumber?: string | null;
  provider?: string | null;
  providerCredentialId?: string | null;
  generatedAt?: number | null;
  generatedByUserId?: string | null;
  enrolledAt?: number | null;
  enrolledByUserId?: string | null;
  activatedAt?: number | null;
  activatedByUserId?: string | null;
  expiresAt?: number | null;
  revokedAt?: number | null;
  revokedByUserId?: string | null;
  revocationReason?: string | null;
  replacedAt?: number | null;
  replacedByCredentialId?: string | null;
  lastUsedAt?: number | null;
  metadata?: Record<string, unknown>;
}

/** Append-only audit trail for generation, enrolment, printing and revocation. */
export interface AttendanceCredentialEvent extends BaseSync {
  schoolId: string;
  branchId: string;
  credentialId: string;
  personType: AttendancePersonType;
  personId: string;
  eventType: AttendanceCredentialEventType;
  occurredAt: number;
  performedByUserId?: string | null;
  attendanceDeviceId?: string | null;
  reasonCode?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * One compact scan/match event. Multiple capture methods feed this same table,
 * then the shared attendance engine creates or updates Attendance/TeacherAttendance.
 */
export interface AttendanceCaptureEvent extends BaseSync {
  identityActivityEventId?: string | null;
  identityCredentialId?: string | null;
  identityDeviceId?: string | null;
  schoolId: string;
  branchId: string;
  sessionId?: string | null;
  personType: AttendancePersonType;
  personId: string;
  credentialId?: string | null;
  attendanceDeviceId?: string | null;
  captureMethod: AttendanceCaptureMethod;
  capturedAt: number;
  capturedByUserId?: string | null;
  verificationStatus: AttendanceVerificationStatus;
  confidenceScore?: number | null;
  attendanceStatus?: AttendanceStatus | null;
  attendanceRecordId?: string | null;
  duplicateOfEventId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  failureCode?: string | null;
  note?: string | null;
}

/** Optional evidence is isolated so normal attendance sync remains small. */
export interface AttendanceEvidenceAsset extends BaseSync {
  schoolId: string;
  branchId: string;
  captureEventId: string;
  mediaAssetId: string;
  evidenceType: "photo" | "document" | "signature" | "other";
  retainedUntil?: number | null;
  active?: boolean;
}


// ======================================================
// SHARED IDENTITY, SAFETY & MOVEMENT PLATFORM
// ======================================================

/**
 * Shared credential used across attendance, cards, pickup, visitors, transport
 * and emergency roll call. Never store raw biometric samples, PINs or QR
 * secrets here; store compact hashes and provider references only.
 */
export interface IdentityCredential extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  subjectType: IdentitySubjectType;
  subjectId: string;
  credentialType: IdentityCredentialType;
  status: IdentityCredentialStatus;
  label?: string | null;
  credentialReference?: string | null;
  tokenHash?: string | null;
  serialNumber?: string | null;
  provider?: string | null;
  providerCredentialId?: string | null;
  validFrom?: number | null;
  expiresAt?: number | null;
  generatedAt?: number | null;
  generatedByUserId?: string | null;
  enrolledAt?: number | null;
  enrolledByUserId?: string | null;
  activatedAt?: number | null;
  activatedByUserId?: string | null;
  suspendedAt?: number | null;
  suspendedByUserId?: string | null;
  suspensionReason?: string | null;
  revokedAt?: number | null;
  revokedByUserId?: string | null;
  revocationReason?: string | null;
  replacedAt?: number | null;
  replacedByCredentialId?: string | null;
  lastUsedAt?: number | null;
  usageCount?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Branch-scoped visual settings used to render printable or digital identity
 * credentials. Credential payloads and references remain independent from the
 * design, so changing a template never invalidates an issued credential.
 */
export interface IdentityCredentialDesignSetting extends BaseSync {
  schoolId: string;
  branchId?: string | null;

  name: string;
  templateKey: IdentityCredentialTemplateKey;
  subjectType?: IdentitySubjectType | "all";
  credentialType?: IdentityCredentialType | "all";
  orientation: IdentityCredentialCardOrientation;
  sides: IdentityCredentialCardSides;

  isDefault?: boolean;
  active?: boolean;

  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
  mutedTextColor?: string | null;
  borderColor?: string | null;
  borderStyle?: IdentityCredentialBorderStyle;
  borderRadiusPx?: number | null;
  backgroundImageMediaId?: string | null;
  watermarkText?: string | null;
  watermarkOpacity?: number | null;

  showSchoolLogo?: boolean;
  showBranchLogo?: boolean;
  showSchoolName?: boolean;
  showBranchName?: boolean;
  showMotto?: boolean;
  showAddress?: boolean;
  showPhoto?: boolean;
  photoShape?: IdentityCredentialPhotoShape;
  showQrCode?: boolean;
  qrPosition?: IdentityCredentialQrPosition;
  qrSize?: IdentityCredentialQrSize;
  showCredentialReference?: boolean;
  showIssueDate?: boolean;
  showExpiryDate?: boolean;
  showSignature?: boolean;
  signatureLabel?: string | null;
  signatureMediaId?: string | null;

  visibleFields?: {
    fullName?: boolean;
    admissionNumber?: boolean;
    staffNumber?: boolean;
    className?: boolean;
    organizationName?: boolean;
    academicYear?: boolean;
    gender?: boolean;
    dateOfBirth?: boolean;
    phone?: boolean;
    emergencyPhone?: boolean;
  };

  customLabels?: Record<string, string>;
  frontLayout?: Record<string, unknown>;
  backLayout?: Record<string, unknown>;
  footerText?: string | null;
  metadata?: Record<string, unknown>;
}

export interface IdentityCredentialEvent extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  credentialId: string;
  subjectType: IdentitySubjectType;
  subjectId: string;
  eventType: IdentityCredentialEventType;
  occurredAt: number;
  performedByUserId?: string | null;
  identityDeviceId?: string | null;
  purpose?: IdentityPurpose | null;
  reasonCode?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}

export interface IdentityDevice extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  name: string;
  code?: string | null;
  deviceType: IdentityDeviceType;
  provider?: string | null;
  providerDeviceId?: string | null;
  serialNumber?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  firmwareVersion?: string | null;
  accessPointId?: string | null;
  locationLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  capabilities?: IdentityDeviceCapability[];
  lastSeenAt?: number | null;
  lastSyncAt?: number | null;
  status?: "online" | "offline" | "maintenance" | "disabled";
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface IdentityAccessPoint extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  name: string;
  code?: string | null;
  accessPointType: IdentityAccessPointType;
  organizationId?: string | null;
  classId?: string | null;
  vehicleId?: string | null;
  locationLabel?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  allowedRadiusMeters?: number | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface IdentityActivityEvent extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  subjectType: IdentitySubjectType;
  subjectId: string;
  credentialId?: string | null;
  identityDeviceId?: string | null;
  accessPointId?: string | null;
  purpose: IdentityPurpose;
  action?: string | null;
  occurredAt: number;
  capturedByUserId?: string | null;
  verificationStatus: IdentityVerificationStatus;
  outcome: IdentityActivityOutcome;
  confidenceScore?: number | null;
  relatedTable?: string | null;
  relatedRecordId?: string | null;
  duplicateOfEventId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}

export interface IdentityEvidenceAsset extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  activityEventId: string;
  mediaAssetId: string;
  evidenceType:
    | "photo"
    | "document"
    | "signature"
    | "video"
    | "audio"
    | "location"
    | "other";
  retainedUntil?: number | null;
  active?: boolean;
}

export interface StudentIdentityCard extends BaseSync {
  schoolId: string;
  branchId: string;
  studentId: string;
  credentialId: string;
  cardNumber: string;
  templateId?: string | null;
  issuedAt?: number | null;
  issuedByUserId?: string | null;
  expiresAt?: number | null;
  printedAt?: number | null;
  printCount?: number;
  replacementOfCardId?: string | null;
  status: StudentIdentityCardStatus;
  active?: boolean;
}

export interface PickupAuthorization extends BaseSync {
  schoolId: string;
  branchId: string;
  studentId: string;
  authorizedPersonType: "parent" | "guardian" | "other";
  authorizedPersonId?: string | null;
  fullName?: string | null;
  phone?: string | null;
  relationship?: string | null;
  photoMediaId?: string | null;
  credentialId?: string | null;
  validFrom?: number | null;
  validUntil?: number | null;
  recurring?: boolean;
  allowedDays?: number[];
  status: PickupAuthorizationStatus;
  approvedByUserId?: string | null;
  approvedAt?: number | null;
  revokedByUserId?: string | null;
  revokedAt?: number | null;
  revocationReason?: string | null;
  note?: string | null;
}

export interface StudentPickupEvent extends BaseSync {
  schoolId: string;
  branchId: string;
  studentId: string;
  authorizationId?: string | null;
  collectorSubjectType: "parent" | "guardian" | "visitor";
  collectorSubjectId?: string | null;
  credentialId?: string | null;
  identityActivityEventId?: string | null;
  requestedAt?: number | null;
  approvedAt?: number | null;
  releasedAt?: number | null;
  approvedByUserId?: string | null;
  releasedByUserId?: string | null;
  status: StudentPickupStatus;
  denialReason?: string | null;
  note?: string | null;
}

export interface VisitorProfile extends BaseSync {
  schoolId: string;
  branchId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  organizationName?: string | null;
  identificationType?: string | null;
  identificationLastFour?: string | null;
  photoMediaId?: string | null;
  blocked?: boolean;
  blockReason?: string | null;
  lastVisitAt?: number | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface VisitorVisit extends BaseSync {
  schoolId: string;
  branchId: string;
  visitorId: string;
  purpose: string;
  hostType?: "teacher" | "staff" | "student" | "office" | null;
  hostId?: string | null;
  accessPointId?: string | null;
  credentialId?: string | null;
  entryIdentityActivityEventId?: string | null;
  exitIdentityActivityEventId?: string | null;
  expectedAt?: number | null;
  checkedInAt?: number | null;
  checkedOutAt?: number | null;
  approvedByUserId?: string | null;
  status: VisitorVisitStatus;
  note?: string | null;
}

export interface SchoolVehicle extends BaseSync {
  schoolId: string;
  branchId: string;
  name: string;
  registrationNumber: string;
  vehicleType?: "bus" | "van" | "car" | "other";
  capacity?: number;
  driverName?: string | null;
  driverPhone?: string | null;
  identityDeviceId?: string | null;
  active?: boolean;
}

export interface TransportRoute extends BaseSync {
  schoolId: string;
  branchId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  active?: boolean;
}

export interface TransportStop extends BaseSync {
  schoolId: string;
  branchId: string;
  routeId: string;
  name: string;
  order: number;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  expectedArrivalMinute?: number | null;
  expectedDepartureMinute?: number | null;
  active?: boolean;
}

export interface StudentTransportAssignment extends BaseSync {
  schoolId: string;
  branchId: string;
  studentId: string;
  routeId: string;
  vehicleId?: string | null;
  pickupStopId?: string | null;
  dropoffStopId?: string | null;
  validFrom?: number | null;
  validUntil?: number | null;
  status?: "active" | "suspended" | "expired" | "cancelled";
  active?: boolean;
}

export interface TransportJourney extends BaseSync {
  schoolId: string;
  branchId: string;
  vehicleId: string;
  routeId?: string | null;
  date: string;
  direction: "to_school" | "from_school" | "trip";
  startedAt?: number | null;
  arrivedAt?: number | null;
  completedAt?: number | null;
  startedByUserId?: string | null;
  status: TransportJourneyStatus;
  note?: string | null;
}

export interface TransportJourneyEvent extends BaseSync {
  schoolId: string;
  branchId: string;
  journeyId: string;
  studentId: string;
  assignmentId?: string | null;
  stopId?: string | null;
  credentialId?: string | null;
  identityActivityEventId?: string | null;
  eventType: TransportJourneyEventType;
  occurredAt: number;
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  capturedByUserId?: string | null;
  note?: string | null;
}

export interface EmergencyRollCallSession extends BaseSync {
  schoolId: string;
  branchId: string;
  name: string;
  emergencyType: "fire" | "security" | "medical" | "weather" | "drill" | "other";
  accessPointId?: string | null;
  startedAt: number;
  endedAt?: number | null;
  startedByUserId?: string | null;
  endedByUserId?: string | null;
  status: "active" | "completed" | "cancelled";
  note?: string | null;
}

export interface EmergencyRollCallEntry extends BaseSync {
  schoolId: string;
  branchId: string;
  sessionId: string;
  subjectType: IdentitySubjectType;
  subjectId: string;
  identityActivityEventId?: string | null;
  status: EmergencyRollCallEntryStatus;
  confirmedAt?: number | null;
  confirmedByUserId?: string | null;
  note?: string | null;
}

// ======================================================
// REPORTING
// ======================================================

export interface ReportCard extends BaseSync {
  schoolId: string;
  branchId: string;
  studentId: string;
  classId: string;
  academicStructureId: string;
  academicPeriodId: string;
  total: number;
  average: number;
  position?: number;
  attendancePercent?: number;
  classTeacherRemark?: string;
  headTeacherRemark?: string;
  published?: boolean;
}

export interface ReportCardItem extends BaseSync {
  schoolId: string;
  branchId: string;
  reportCardId: string;
  studentId: string;
  classId: string;
  academicStructureId: string;
  academicPeriodId: string;
  subjectId: string;
  subjectName: string;
  teacherId?: string;
  teacherName?: string;
  total: number;
  average?: number;
  grade: string;
  remark?: string;
  position?: number;
}

// ======================================================
// REPORT CARD TEMPLATE / VISIBILITY SETTINGS
// ======================================================
//
// These tables make report cards enterprise-configurable without hard-coding
// one permanent design. A school or branch can choose a template design,
// then control which fields are actually printed. When a field is disabled,
// report components should remove the field/column/box completely instead of
// rendering an empty placeholder.
//
// IMPORTANT:
// - reportCardTemplates stores the available template designs.
// - reportCardTemplateSettings stores visibility/label settings for a template.
// - reportCardTemplateAssignments stores which template/settings apply to a branch,
//   school, academic structure, academic period, class, level, or student.

export type ReportCardTemplateCode =
  | "classic_formal"
  | "modern_clean"
  | "compact_print"
  | "bordered_traditional"
  | "letterhead_premium"
  | "side_profile"
  | "cambridge"
  | "ib"
  | "kindergarten"
  | "montessori"
  | "university_transcript"
  | string;

export type ReportCardTemplateKey = ReportCardTemplateCode;

export type ReportCardLayoutKey =
  | "classic_formal"
  | "modern_clean"
  | "compact_print"
  | "bordered_traditional"
  | "letterhead_premium"
  | "side_profile"
  | "cambridge"
  | "ib"
  | "kindergarten"
  | "montessori"
  | "university_transcript"
  | string;

export type ReportCardPageSize =
  | "A4"
  | "Letter"
  | string;

export type ReportCardOrientation =
  | "portrait"
  | "landscape";

export type ReportCardDensity =
  | "compact"
  | "comfortable"
  | "spacious"
  | string;

export type ReportCardTemplateScopeType =
  | "account"
  | "school"
  | "branch"
  | "academicStructure"
  | "academicPeriod"
  | "class"
  | "level"
  | "student"
  | string;

export interface ReportCardTemplate extends BaseSync {
  schoolId: string;
  branchId?: string | null;

  name: string;

  /**
   * `code` + `layoutKey` match reports/student-report-templates/index.ts.
   * `templateKey` is kept for backward compatibility with earlier report code.
   */
  code: ReportCardTemplateCode;
  layoutKey: ReportCardLayoutKey;
  templateKey?: ReportCardTemplateKey;

  description?: string;

  /**
   * Determines which document family owns this template.
   * Broadsheet templates are saved independently for subject, class and annual outputs.
   */
  reportType?:
    | "student_report"
    | "cumulative_book"
    | "cumulative_transcript"
    | "subject_broadsheet"
    | "class_broadsheet"
    | "annual_broadsheet"
    | string;

  paperSize?: ReportCardPageSize;
  orientation?: ReportCardOrientation;
  density?: ReportCardDensity;

  previewImage?: string;
  previewImageMediaId?: string;

  isDefault?: boolean;
  active?: boolean;
  locked?: boolean;

  metadata?: any;
}

export interface ReportCardTemplateSetting extends BaseSync {
  schoolId: string;
  branchId?: string | null;

  templateId?: string | null;

  /**
   * Stored redundantly for offline fallback and easier filtering.
   */
  templateCode?: ReportCardTemplateCode;
  layoutKey?: ReportCardLayoutKey;
  templateKey?: ReportCardTemplateKey;
  templateName?: string;

  name?: string;

  /**
   * Keeps settings isolated by document family so one branch may choose
   * different templates and columns for subject, class and annual broadsheets.
   */
  reportType?:
    | "student_report"
    | "cumulative_book"
    | "cumulative_transcript"
    | "subject_broadsheet"
    | "class_broadsheet"
    | "annual_broadsheet"
    | string;

  paperSize?: ReportCardPageSize;
  orientation?: ReportCardOrientation;
  density?: ReportCardDensity;

  // =========================
  // TOP / IDENTITY FIELDS
  // =========================
  showStudentPhoto?: boolean;
  showAdmissionNumber?: boolean;
  showGender?: boolean;
  showClass?: boolean;
  showAcademicStructure?: boolean;
  showAcademicPeriod?: boolean;
  showBranch?: boolean;
  showNumberOnRoll?: boolean;

  // =========================
  // RESULT TABLE FIELDS
  // =========================
  showTeacherNames?: boolean;
  showAssessmentBreakdown?: boolean;
  showSubjectTotal?: boolean;
  showSubjectAverage?: boolean;
  showSubjectGrade?: boolean;
  showSubjectRemark?: boolean;
  showSubjectRemarks?: boolean;
  showSubjectPosition?: boolean;

  // =========================
  // SUMMARY FIELDS
  // =========================
  showTotal?: boolean;
  showAverage?: boolean;
  showClassPosition?: boolean;
  showGPA?: boolean;
  showGrade?: boolean;
  showAttendance?: boolean;
  showAttendancePercent?: boolean;
  showPromotionStatus?: boolean;

  // =========================
  // REMARKS / SIGNATURES / NOTICE
  // =========================
  showClassTeacherRemark?: boolean;
  showHeadTeacherRemark?: boolean;
  showNextAcademicPeriod?: boolean;
  showClassTeacherSignature?: boolean;
  showHeadTeacherSignature?: boolean;
  showParentSignature?: boolean;

  showCurrentAcademicPeriodEnd?: boolean;
  showGeneratedDate?: boolean;


  // =========================
  // BRANDING / VISUALS
  // =========================
  showLogo?: boolean;
  showWatermark?: boolean;
  showReportBackground?: boolean;
  showOfficialSignatureImage?: boolean;

  // =========================
  // CUMMULATIVE BOOK / TRANSCRIPT PAGES
  // =========================
  showBookFrontCover?: boolean;
  showBookStudentProfilePage?: boolean;
  showBookAcademicJourneyPage?: boolean;
  showBookSummaryPage?: boolean;
  showBookBackCover?: boolean;
  bookTitleLabel?: string;
  bookSubtitleLabel?: string;

  showTranscriptTermBreakdown?: boolean;
  showTranscriptYearAverage?: boolean;
  showTranscriptCumulativeAverage?: boolean;
  showTranscriptCumulativePosition?: boolean;
  showTranscriptGPAProgression?: boolean;
  showTranscriptFinalRecommendation?: boolean;

  // =========================
  // BROADSHEET — SHARED DISPLAY CONTROLS
  // =========================
  showBroadsheetLogo?: boolean;
  showBroadsheetWatermark?: boolean;
  showBroadsheetGeneratedDate?: boolean;
  showBroadsheetPageNumber?: boolean;
  showBroadsheetSignatures?: boolean;
  showBroadsheetSummary?: boolean;
  showBroadsheetStatistics?: boolean;
  showBroadsheetStudentPhoto?: boolean;

  // =========================
  // BROADSHEET — SUBJECT VIEW CONTROLS
  // =========================
  showBroadsheetAssessmentBreakdown?: boolean;
  showBroadsheetWeightedTotal?: boolean;
  showBroadsheetPercentage?: boolean;
  showBroadsheetGrade?: boolean;
  showBroadsheetRemark?: boolean;
  showBroadsheetGPA?: boolean;
  showBroadsheetPosition?: boolean;
  showBroadsheetHighestScore?: boolean;
  showBroadsheetLowestScore?: boolean;
  showBroadsheetClassAverage?: boolean;

  // =========================
  // BROADSHEET — CLASS VIEW CONTROLS
  // =========================
  showBroadsheetSubjectScores?: boolean;
  showBroadsheetSubjectGrades?: boolean;
  showBroadsheetTotal?: boolean;
  showBroadsheetAverage?: boolean;
  showBroadsheetClassPosition?: boolean;
  showBroadsheetAttendance?: boolean;
  showBroadsheetClassHighestAverage?: boolean;
  showBroadsheetClassLowestAverage?: boolean;

  // =========================
  // BROADSHEET — ANNUAL VIEW CONTROLS
  // =========================
  showBroadsheetPeriodScores?: boolean;
  showBroadsheetAnnualAverage?: boolean;
  showBroadsheetAnnualGPA?: boolean;
  showBroadsheetAnnualPosition?: boolean;
  showBroadsheetTrend?: boolean;
  showBroadsheetPromotionDecision?: boolean;
  showBroadsheetBestPeriod?: boolean;
  showBroadsheetLatestPeriod?: boolean;

  // =========================
  // BROADSHEET — LABEL CUSTOMIZATION
  // =========================
  broadsheetTitleLabel?: string;
  broadsheetGeneratedDateLabel?: string;
  broadsheetFooterText?: string;
  studentColumnLabel?: string;
  admissionNumberColumnLabel?: string;
  positionColumnLabel?: string;
  gradeColumnLabel?: string;
  remarkColumnLabel?: string;

  // =========================
  // LABEL CUSTOMIZATION
  // =========================
  studentNameLabel?: string;
  admissionNumberLabel?: string;
  genderLabel?: string;
  classLabel?: string;
  academicStructureLabel?: string;
  academicPeriodLabel?: string;
  numberOnRollLabel?: string;

  subjectLabel?: string;
  totalLabel?: string;
  averageLabel?: string;
  gradeLabel?: string;
  subjectPositionLabel?: string;
  classPositionLabel?: string;
  gpaLabel?: string;
  attendanceLabel?: string;
  attendancePercentLabel?: string;

  classTeacherLabel?: string;
  headTeacherLabel?: string;
  parentLabel?: string;
  principalLabel?: string;

  classTeacherRemarkLabel?: string;
  headTeacherRemarkLabel?: string;
  nextAcademicPeriodLabel?: string;
  classTeacherSignatureLabel?: string;
  headTeacherSignatureLabel?: string;
  parentSignatureLabel?: string;
  currentAcademicPeriodEndLabel?: string;
  generatedDateLabel?: string;


  footerText?: string;

  active?: boolean;
  metadata?: any;
}

export interface ReportCardTemplateAssignment extends BaseSync {
  schoolId: string;
  branchId?: string | null;

  templateId: string;
  templateSettingsId?: string | null;

  /**
   * Assignment family. Each branch can therefore keep separate defaults for
   * subject, class and annual broadsheet documents.
   */
  reportType?:
    | "student_report"
    | "cumulative_book"
    | "cumulative_transcript"
    | "subject_broadsheet"
    | "class_broadsheet"
    | "annual_broadsheet"
    | string;

  /**
   * Stored redundantly so report rendering can still resolve a template even
   * if the template row has not been pulled yet.
   */
  templateCode?: ReportCardTemplateCode;
  layoutKey?: ReportCardLayoutKey;
  templateKey?: ReportCardTemplateKey;

  scopeType: ReportCardTemplateScopeType;
  scopeId?: string | null;

  academicStructureId?: string | null;
  academicPeriodId?: string | null;
  classId?: string | null;
  level?: string | null;
  studentId?: string | null;

  isDefault?: boolean;
  active?: boolean;

  metadata?: any;
}


export interface StudentReportSnapshot extends BaseSync {
  schoolId: string;
  branchId: string;

  studentId: string;
  classId: string;
  academicStructureId: string;
  academicPeriodId: string;

  academicYear?: string;
  term?: string;

  reportData: any;

  total?: number;
  average?: number;
  position?: number;
  recommendation?: "promote" | "repeat" | "graduate";
  promotedToClassId?: string;

  snapshotType: "promotion" | "terminal" | "manual";
}


export interface StudentPromotion extends BaseSync {
  schoolId: string;
  branchId: string;

  studentId: string;

  fromClassId: string;
  toClassId?: string;

  fromAcademicStructureId: string;
  toAcademicStructureId?: string;

  fromAcademicPeriodId: string;
  toAcademicPeriodId?: string;

  average?: number;
  recommendation: "promote" | "repeat" | "graduate";
  finalDecision: "promote" | "repeat" | "graduate";

  snapshotId?: string;
  note?: string;
}

// ======================================================
// FINANCE
// ======================================================

export interface FeeStructure extends BaseSync {
  schoolId: string;
  branchId: string;
  classId?: string;
  academicStructureId: string;
  academicPeriodId: string;
  items: { name: string; amount: number }[];
}

export interface Payment extends BaseSync {
  schoolId: string;
  branchId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  receiptNumber?: string;
  note?: string;
}

export interface Income extends BaseSync {
  schoolId: string;
  branchId: string;
  organizationId?: string;
  title: string;
  description?: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  date: string;
  source?: string;
  receivedBy?: string;
  referenceNumber?: string;
  receiptNumber?: string;
  photo?: string;
  photoMediaId?: string;
}

export interface Expense extends BaseSync {
  schoolId: string;
  branchId: string;
  organizationId?: string;
  title: string;
  description?: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  expenseSourceType?: ExpenseSourceType;
  date: string;
  paidTo?: string;
  approvedBy?: string;
  receiptNumber?: string;
  referenceNumber?: string;
  photo?: string;
}

export interface MoneyFields {
  currencyCode?: CurrencyCode;
  currencySymbol?: string;
  currencyName?: string;
  exchangeRate?: number;
}

// ======================================================
// 3) CURRENCY TABLES
// ======================================================

export interface Currency extends BaseSync {
  code: CurrencyCode;
  name: string;
  symbol: string;
  countryCode?: string;
  decimalPlaces?: number;
  active?: boolean;
  default?: boolean;
}

export interface SchoolCurrencySetting extends BaseSync {
  schoolId: string;
  branchId: string;
  currencyCode: CurrencyCode;
  currencySymbol: string;
  currencyName: string;
  allowMultipleCurrencies?: boolean;
  defaultForFees?: boolean;
  defaultForPayroll?: boolean;
  defaultForIncomeExpense?: boolean;
  active?: boolean;
}

// ======================================================
// 4) PAYMENT GATEWAY / TRANSACTION TABLES
// ======================================================

export interface PaymentIntent extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  purpose: "student_fee" | "subscription" | "income" | "payroll" | "other";
  studentId?: string;
  parentId?: string;
  teacherId?: string;
  feeInvoiceId?: string;
  incomeId?: string;
  payrollRunId?: string;
  payrollItemId?: string;
  amount: number;
  channel: PaymentChannel;
  provider?: PaymentProvider;
  status: PaymentStatus;
  payerName?: string;
  payerPhone?: string;
  payerEmail?: string;
  momoNetwork?: "mtn" | "telecel" | "airteltigo" | string;
  providerReference?: string;
  authorizationUrl?: string;
  accessCode?: string;
  description?: string;
  metadata?: any;
  expiresAt?: string;
  paidAt?: string;
  cancelledAt?: string;
}

export interface PaymentTransaction extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  paymentIntentId?: string;
  purpose: "student_fee" | "subscription" | "income" | "expense" | "payroll" | "refund" | "other";
  amount: number;
  channel: PaymentChannel;
  provider?: PaymentProvider;
  status: PaymentStatus;
  direction: "inflow" | "outflow";
  payerName?: string;
  payerPhone?: string;
  payerEmail?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  providerReference?: string;
  receiptNumber?: string;
  referenceNumber?: string;
  paidAt?: string;
  failedAt?: string;
  note?: string;
  metadata?: any;
}

export interface PaymentProviderEvent extends BaseSync {
  schoolId?: string;
  branchId?: string;
  provider: PaymentProvider;
  eventType: string;
  providerReference?: string;
  paymentIntentId?: string;
  paymentTransactionId?: string;
  rawPayload: any;
  processed?: boolean;
  processedAt?: string;
  error?: string;
}

export interface PaymentRefund extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  paymentTransactionId: string;
  amount: number;
  reason?: string;
  status: PaymentStatus;
  provider?: PaymentProvider;
  providerReference?: string;
  requestedBy?: string;
  approvedBy?: string;
  refundedAt?: string;
  note?: string;
}


// ======================================================
// 4B) BRANCH WALLET / PAYOUT TABLES
// ======================================================

export interface PaymentSettlement extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  paymentTransactionId?: string;
  provider?: PaymentProvider;
  amount: number;
  grossAmount?: number;
  netAmount?: number;
  fee?: number;
  providerFee?: number;
  platformFee?: number;
  status: PaymentStatus | "settled" | "processing" | "failed" | string;
  referenceNumber?: string;
  providerReference?: string;
  settledAt?: string;
  note?: string;
  metadata?: any;
}

export interface WithdrawalRequest extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  amount: number;
  method: "bank" | "momo" | PaymentChannel | string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  momoNetwork?: "mtn" | "telecel" | "airteltigo" | string;
  momoNumber?: string;
  status: "requested" | "pending" | "review" | "approved" | "paid" | "rejected" | "cancelled" | string;
  referenceNumber?: string;
  requestedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  rejectedAt?: string;
  note?: string;
  metadata?: any;
}

export interface SchoolPayoutSetting extends BaseSync {
  schoolId: string;
  branchId: string;

  settlementMode: "direct_subaccount" | "platform_wallet" | string;
  preferredMethod: "bank" | "momo" | string;

  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;

  momoNetwork?: "mtn" | "telecel" | "airteltigo" | string;
  momoNumber?: string;
  momoName?: string;

  paystackSubaccountCode?: string;
  settlementSchedule?: "manual" | "daily" | "weekly" | "monthly" | string;

  contactEmail?: string;
  contactPhone?: string;

  status?: "active" | "inactive" | "verified" | "pending" | string;
  active?: boolean;
  note?: string;
  metadata?: any;
}

// ======================================================
// 5) STUDENT FEE INVOICING TABLES
// ======================================================

export interface StudentFeeInvoice extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  studentId: string;
  classId?: string;
  academicStructureId?: string;
  academicPeriodId?: string;
  invoiceNumber: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  amountPaid?: number;
  balance?: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string;
  paidAt?: string;
  note?: string;
  locked?: boolean;
}

export interface StudentFeeInvoiceItem extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  invoiceId: string;
  feeStructureId?: string;
  name: string;
  description?: string;
  quantity?: number;
  unitAmount?: number;
  amount: number;
  required?: boolean;
  order?: number;
}

export interface StudentFeePayment extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  invoiceId?: string;
  studentId: string;
  parentId?: string;
  amount: number;
  method: PaymentChannel;
  provider?: PaymentProvider;
  status: PaymentStatus;
  paymentIntentId?: string;
  paymentTransactionId?: string;
  receiptNumber?: string;
  referenceNumber?: string;
  providerReference?: string;
  payerName?: string;
  payerPhone?: string;
  payerEmail?: string;
  date: string;
  paidAt?: string;
  note?: string;
  photo?: string;
  photoMediaId?: string;
}

// ======================================================
// 6) PAYROLL TABLES
// ======================================================

export interface StaffPayrollProfile extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  teacherId?: string;
  staffUserId?: string;
  fullName: string;
  role?: string;
  payType: StaffPayType;
  baseSalary: number;
  allowanceDefault?: number;
  deductionDefault?: number;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  momoNetwork?: "mtn" | "telecel" | "airteltigo" | string;
  momoNumber?: string;
  momoName?: string;
  preferredPaymentMethod?: PaymentChannel;
  taxId?: string;
  ssnitNumber?: string;
  active?: boolean;
}

export interface PayrollRun extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  title: string;
  description?: string;
  periodStart: string;
  periodEnd: string;
  payDate?: string;
  status: PayrollRunStatus;
  grossAmount: number;
  totalAllowances?: number;
  totalDeductions?: number;
  netAmount: number;
  amountPaid?: number;
  approvedBy?: string;
  approvedAt?: string;
  processedBy?: string;
  processedAt?: string;
  note?: string;
  locked?: boolean;
}

export interface PayrollItem extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  payrollRunId: string;
  payrollProfileId?: string;
  teacherId?: string;
  staffUserId?: string;
  fullName: string;
  role?: string;
  baseSalary: number;
  allowances?: number;
  deductions?: number;
  bonus?: number;
  tax?: number;
  grossAmount: number;
  netAmount: number;
  status: PayrollItemStatus;
  paymentMethod?: PaymentChannel;
  provider?: PaymentProvider;
  paymentIntentId?: string;
  paymentTransactionId?: string;
  receiptNumber?: string;
  referenceNumber?: string;
  providerReference?: string;
  paidAt?: string;
  note?: string;
}

export interface StaffPaymentRecord extends BaseSync, MoneyFields {
  schoolId: string;
  branchId: string;
  teacherId?: string;
  staffUserId?: string;
  payrollRunId?: string;
  payrollItemId?: string;
  amount: number;
  method: PaymentChannel;
  provider?: PaymentProvider;
  status: PaymentStatus;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  bankName?: string;
  bankAccountNumber?: string;
  momoNetwork?: string;
  momoNumber?: string;
  referenceNumber?: string;
  receiptNumber?: string;
  providerReference?: string;
  date: string;
  paidAt?: string;
  note?: string;
  photo?: string;
  photoMediaId?: string;
}

// ======================================================
// 7) ANNOUNCEMENTS & MESSAGING TABLES
// ======================================================

/**
 * A branch-managed story, notice, celebration or campaign shown on portal homes.
 *
 * Media bytes remain in mediaAssets/mediaBlobs. This record stores only media
 * references, presentation rules, scheduling, audience and navigation metadata.
 */
export interface PortalHighlight extends BaseSync {
  schoolId: string;
  branchId: string;

  title: string;
  subtitle?: string | null;
  description?: string | null;
  eyebrow?: string | null;

  mediaType: PortalHighlightMediaType;
  mediaAssetId?: string | null;
  posterMediaAssetId?: string | null;
  fallbackImageUrl?: string | null;

  audiences: PortalHighlightAudience[];
  targetClassIds?: string[];
  targetOrganizationIds?: string[];

  actionType: PortalHighlightActionType;
  actionLabel?: string | null;
  actionValue?: string | null;
  openActionInNewTab?: boolean;

  displayOrder: number;
  durationSeconds: number;
  transition?: PortalHighlightTransition;

  startAt?: number | null;
  endAt?: number | null;

  status: PortalHighlightStatus;
  active: boolean;

  createdByUserId?: string | null;
  updatedByUserId?: string | null;
  publishedAt?: number | null;
  archivedAt?: number | null;

  metadata?: Record<string, unknown>;
}

/**
 * One public website configuration per school. Templates consume resolved data
 * and never query Dexie directly. Website-specific content remains separate from
 * operational records, while source-driven sections may safely reuse them.
 */
export interface WebsiteSetting extends BaseSync {
  schoolId: string;
  branchId?: string | null;

  siteName?: string | null;
  tagline?: string | null;
  description?: string | null;

  templateKey: string;
  templateVersion?: string | null;
  theme?: Record<string, unknown>;
  templateSettings?: Record<string, unknown>;

  eleeveonSlug: string;
  primaryDomainId?: string | null;

  status: WebsiteStatus;
  homePageId?: string | null;
  defaultLanguage?: string | null;
  supportedLanguages?: string[];

  faviconMediaAssetId?: string | null;
  socialPreviewMediaAssetId?: string | null;

  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  searchEngineIndexing?: boolean;

  analyticsProvider?: string | null;
  analyticsTrackingId?: string | null;

  publishedAt?: number | null;
  unpublishedAt?: number | null;
  lastPublishedRevisionId?: string | null;
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface WebsitePage extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  websiteSettingId: string;

  title: string;
  slug: string;
  pageType: string;
  status: WebsitePageStatus;
  displayOrder: number;
  parentPageId?: string | null;

  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  socialPreviewMediaAssetId?: string | null;

  showInNavigation?: boolean;
  navigationLabel?: string | null;
  publishedAt?: number | null;
  metadata?: Record<string, unknown>;
}

export interface WebsiteSection extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  websiteSettingId: string;
  pageId: string;

  sectionKey: string;
  sectionType: string;
  variant?: string | null;
  status: WebsiteSectionStatus;
  displayOrder: number;

  sourceType: WebsiteSectionSourceType;
  sourceId?: string | null;
  sourceFilters?: Record<string, unknown>;

  heading?: string | null;
  subheading?: string | null;
  body?: string | null;
  content?: Record<string, unknown>;
  settings?: Record<string, unknown>;

  primaryMediaAssetId?: string | null;
  backgroundMediaAssetId?: string | null;
  mediaAssetIds?: string[];

  active: boolean;
  metadata?: Record<string, unknown>;
}

export interface WebsiteNavigationItem extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  websiteSettingId: string;

  location: "header" | "footer" | "utility" | "mobile" | string;
  parentItemId?: string | null;
  label: string;
  targetType: WebsiteNavigationTarget;
  pageId?: string | null;
  sectionId?: string | null;
  url?: string | null;
  openInNewTab?: boolean;
  displayOrder: number;
  active: boolean;
  metadata?: Record<string, unknown>;
}

export interface WebsiteDomain extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  websiteSettingId: string;

  hostname: string;
  domainType: WebsiteDomainType;
  status: WebsiteDomainStatus;
  sslStatus: WebsiteSslStatus;

  isPrimary: boolean;
  redirectToPrimary: boolean;
  verificationToken?: string | null;
  verificationMethod?: "dns_txt" | "dns_cname" | "http" | string | null;
  verificationRecordName?: string | null;
  verificationRecordValue?: string | null;
  verifiedAt?: number | null;
  sslIssuedAt?: number | null;
  sslExpiresAt?: number | null;
  lastCheckedAt?: number | null;
  failureReason?: string | null;
  active: boolean;
  metadata?: Record<string, unknown>;
}

export interface WebsiteDomainAlias extends BaseSync {
  schoolId: string;
  websiteSettingId: string;
  sourceHostname: string;
  targetHostname: string;
  redirectStatusCode: 301 | 302 | 307 | 308;
  active: boolean;
  expiresAt?: number | null;
}

export interface WebsiteForm extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  websiteSettingId: string;
  pageId?: string | null;
  sectionId?: string | null;
  name: string;
  formType: WebsiteFormType;
  fields: Array<Record<string, unknown>>;
  successMessage?: string | null;
  notificationEmails?: string[];
  active: boolean;
  metadata?: Record<string, unknown>;
}

export interface WebsiteFormSubmission extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  websiteSettingId: string;
  formId: string;
  status: WebsiteSubmissionStatus;
  submittedAt: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  payload: Record<string, unknown>;
  sourceUrl?: string | null;
  userAgent?: string | null;
  ipHash?: string | null;
  assignedToUserId?: string | null;
  respondedAt?: number | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
}

export interface WebsiteRevision extends BaseSync {
  schoolId: string;
  websiteSettingId: string;
  revisionNumber: number;
  status: "draft" | "published" | "superseded" | "restored";
  snapshot: Record<string, unknown>;
  createdByUserId?: string | null;
  publishedAt?: number | null;
  restoredFromRevisionId?: string | null;
  note?: string | null;
}

export interface Announcement extends BaseSync {
  schoolId: string;
  branchId: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  classId?: string;
  organizationId?: string;
  channels: CommunicationChannel[];
  priority?: NotificationPriority;
  publishAt?: string;
  expiresAt?: string;
  published?: boolean;
  publishedAt?: string;
  createdBy?: string;
  photo?: string;
  photoMediaId?: string;
  attachmentUrl?: string;
  attachmentMediaId?: string;
  metadata?: any;
}

export interface AnnouncementRecipient extends BaseSync {
  schoolId: string;
  branchId: string;
  announcementId: string;
  recipientType: MessageRecipientType;
  recipientId?: string;
  userId?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  whatsappNumber?: string;
  channels: CommunicationChannel[];
  status: DeliveryStatus;
  deliveredAt?: string;
  readAt?: string;
  failedReason?: string;
}

export interface MessageThread extends BaseSync {
  schoolId: string;
  branchId: string;
  title?: string;
  threadType: "direct" | "group" | "class" | "parent_teacher" | "support" | "announcement";
  classId?: string;
  organizationId?: string;
  studentId?: string;
  teacherId?: string;
  parentId?: string;
  createdBy?: string;
  lastMessageAt?: string;
  archived?: boolean;
}

export interface Message extends BaseSync {
  schoolId: string;
  branchId: string;
  threadId: string;
  senderUserId?: string;
  senderRole?: Role;
  senderName?: string;
  body: string;
  channel?: CommunicationChannel;
  attachmentUrl?: string;
  attachmentMediaId?: string;
  photo?: string;
  photoMediaId?: string;
  deliveredAt?: string;
  readAt?: string;
  status?: DeliveryStatus;
}

export interface CommunicationLog extends BaseSync {
  schoolId: string;
  branchId: string;
  channel: CommunicationChannel;
  purpose: "announcement" | "message" | "fee_reminder" | "payroll" | "attendance" | "report" | "other";
  relatedTable?: string;
  relatedId?: string;
  recipientType?: MessageRecipientType;
  recipientId?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  whatsappNumber?: string;
  subject?: string;
  body?: string;
  status: DeliveryStatus;
  provider?: string;
  providerReference?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedReason?: string;
  metadata?: any;
}

export interface NotificationTemplate extends BaseSync {
  schoolId: string;
  branchId: string;
  name: string;
  purpose: "announcement" | "fee_reminder" | "payment_receipt" | "payroll_notice" | "attendance_alert" | "report_ready" | "custom";
  channel: CommunicationChannel;
  subject?: string;
  body: string;
  variables?: string[];
  active?: boolean;
}
// ======================================================
// SETTINGS
// ======================================================

export interface SchoolBranchSetting extends BaseSync {
  schoolId: string;
  branchId: string;

  mode?: string;
  theme?: "light" | "dark";
  primaryColor?: string;
  fontFamily?: string;
  fontSize?: number;

  academicYear?: string;
  currentTerm?: string;
  currentAcademicStructureId?: string;
  currentAcademicPeriodId?: string;

  logo?: string;
  logoMediaId?: string;
  reportCardBackgroundImage?: string;
  reportCardBackgroundImageMediaId?: string;
  reportCardWatermark?: string;
  reportCardWatermarkMediaId?: string;
  reportCardSignatureImage?: string;
  reportCardSignatureImageMediaId?: string;

  dashboardHeroImage?: string;
  dashboardHeroImageMediaId?: string;
  dashboardBannerImage?: string;
  dashboardBannerImageMediaId?: string;
  studentPortalImage?: string;
  studentPortalImageMediaId?: string;
  teacherPortalImage?: string;
  teacherPortalImageMediaId?: string;
  classroomPlaceholderImage?: string;
  classroomPlaceholderImageMediaId?: string;
  subjectPlaceholderImage?: string;
  subjectPlaceholderImageMediaId?: string;

  schoolGalleryImages?: string[];
  schoolGalleryMediaIds?: string[];

  // Attendance engine configuration. Defaults preserve today's manual workflow.
  attendanceEnabled?: boolean;
  attendanceAllowedMethods?: AttendanceCaptureMethod[];
  attendanceDefaultMethod?: AttendanceCaptureMethod;
  attendanceAutoMarkOnVerifiedMatch?: boolean;
  attendanceRequireTeacherConfirmation?: boolean;
  attendanceAllowOfflineCapture?: boolean;
  attendanceBatchSyncSize?: number;
  attendanceSchoolOpenMinute?: number;
  attendanceLateAfterMinute?: number;
  attendanceAbsentAfterMinute?: number;
  attendanceEvidenceMode?: "off" | "exceptions_only" | "manual_review" | "every_capture";
  attendanceEvidenceRetentionDays?: number;
  attendanceFailedEventRetentionDays?: number;
  attendanceLocalEventRetentionDays?: number;
}

// ======================================================
// SCHEDULING TYPES
// ======================================================

export type ScheduleScopeType =
  | "account"
  | "school"
  | "branch"
  | "class"
  | "subject"
  | "teacher"
  | "student"
  | "parent"
  | "staff"
  | "department"
  | "business"
  | "personal"
  | "custom";

export type CalendarEventType =
  | "general"
  | "school_event"
  | "branch_event"
  | "class_event"
  | "lesson"
  | "exam"
  | "assessment"
  | "meeting"
  | "parent_teacher_meeting"
  | "fee_deadline"
  | "payroll_date"
  | "holiday"
  | "vacation"
  | "deadline"
  | "reminder"
  | "maintenance"
  | "custom";

export type CalendarVisibility =
  | "private"
  | "branch"
  | "school"
  | "public";

export type CalendarEventStatus =
  | "draft"
  | "scheduled"
  | "confirmed"
  | "cancelled"
  | "postponed"
  | "completed";

export type CalendarParticipantType =
  | "user"
  | "teacher"
  | "student"
  | "parent"
  | "accountant"
  | "branch_admin"
  | "school_admin"
  | "class"
  | "branch"
  | "school"
  | "group"
  | "external";

export type CalendarResponseStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "tentative"
  | "no_response";

export type CalendarReminderChannel =
  | "in_app"
  | "email"
  | "sms"
  | "whatsapp";

export type ScheduleTimetableType =
  | "school"
  | "branch"
  | "class"
  | "teacher"
  | "exam"
  | "room"
  | "custom";

export type ScheduleDayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ScheduleSessionType =
  | "lesson"
  | "break"
  | "assembly"
  | "exam"
  | "meeting"
  | "activity"
  | "custom";

export type ScheduleResourceType =
  | "classroom"
  | "laboratory"
  | "hall"
  | "library"
  | "office"
  | "bus"
  | "device"
  | "equipment"
  | "online_room"
  | "custom";

export type ScheduleConflictType =
  | "teacher_double_booked"
  | "class_double_booked"
  | "student_double_booked"
  | "room_double_booked"
  | "resource_double_booked"
  | "branch_event_overlap"
  | "school_event_overlap"
  | "custom";

export type ScheduleConflictSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type ScheduleConflictStatus =
  | "open"
  | "ignored"
  | "resolved";

// ======================================================
// CALENDAR EVENTS
// ======================================================

export interface CalendarEvent extends BaseSync {
  schoolId: string;
  branchId: string;

  /**
   * Generic reusable scope.
   * Examples:
   * scopeType="class", scopeId=classId
   * scopeType="teacher", scopeId=teacherId
   * scopeType="business", scopeId=businessId in another Eleeveon app
   */
  scopeType: ScheduleScopeType;
  scopeId?: string | null;

  title: string;
  description?: string;

  eventType: CalendarEventType;
  status: CalendarEventStatus;
  visibility: CalendarVisibility;

  /**
   * Start/end are timestamps for easy Dexie filtering.
   */
  startAt: number;
  endAt: number;
  allDay?: boolean;

  timezone?: string;
  location?: string;
  onlineMeetingUrl?: string;

  /**
   * Optional school links.
   */
  classId?: string | null;
  subjectId?: string | null;
  classSubjectId?: string | null;
  teacherId?: string | null;
  studentId?: string | null;
  parentId?: string | null;

  academicStructureId?: string | null;
  academicPeriodId?: string | null;

  /**
   * Optional recurrence rule for repeated events.
   * Example:
   * FREQ=WEEKLY;BYDAY=MO,WE
   */
  recurrenceRule?: string;
  recurrenceEndAt?: number | null;
  parentEventId?: string | null;

  /**
   * Communication links.
   */
  announcementId?: string | null;
  messageThreadId?: string | null;

  color?: string;
  priority?: "low" | "normal" | "high" | "urgent";

  createdByUserId?: string | null;
  createdByRole?: string;

  active?: boolean;
}

// ======================================================
// CALENDAR PARTICIPANTS
// ======================================================

export interface CalendarEventParticipant extends BaseSync {
  schoolId: string;
  branchId: string;

  eventId: string;

  participantType: CalendarParticipantType;
  participantId?: string | null;
  userId?: string | null;

  role?: string;
  displayName?: string;
  email?: string;
  phone?: string;

  responseStatus: CalendarResponseStatus;
  responseNote?: string;
  respondedAt?: number | null;

  required?: boolean;
  canEdit?: boolean;
  active?: boolean;
}

// ======================================================
// CALENDAR REMINDERS
// ======================================================

export interface CalendarEventReminder extends BaseSync {
  schoolId: string;
  branchId: string;

  eventId: string;
  participantId?: string | null;

  channel: CalendarReminderChannel;

  /**
   * 1440 = one day before
   * 60 = one hour before
   * 10 = ten minutes before
   */
  minutesBefore: number;

  scheduledAt?: number;
  sentAt?: number | null;

  status?: "pending" | "sent" | "failed" | "cancelled";
  error?: string;

  active?: boolean;
}

// ======================================================
// CALENDAR RESPONSES
// ======================================================

export interface CalendarEventResponse extends BaseSync {
  schoolId: string;
  branchId: string;

  eventId: string;
  participantId?: string | null;

  userId?: string | null;
  participantType?: CalendarParticipantType;

  responseStatus: CalendarResponseStatus;
  note?: string;
  respondedAt: number;
}

// ======================================================
// TIMETABLES
// ======================================================

export interface ScheduleTimetable extends BaseSync {
  schoolId: string;
  branchId: string;

  name: string;
  description?: string;

  timetableType: ScheduleTimetableType;

  /**
   * Generic reusable scope.
   * Examples:
   * class timetable: scopeType="class", scopeId=classId
   * teacher timetable: scopeType="teacher", scopeId=teacherId
   * exam timetable: scopeType="branch", scopeId=branchId
   */
  scopeType: ScheduleScopeType;
  scopeId?: string | null;

  academicStructureId?: string | null;
  academicPeriodId?: string | null;

  classId?: string | null;
  teacherId?: string | null;

  effectiveFrom?: number | null;
  effectiveTo?: number | null;

  status?: "draft" | "active" | "archived";

  active?: boolean;
  isDefault?: boolean;

  createdByUserId?: string | null;
  createdByRole?: string;
}

// ======================================================
// TIMETABLE SESSIONS
// ======================================================

export interface ScheduleSession extends BaseSync {
  schoolId: string;
  branchId: string;

  timetableId: string;

  sessionType: ScheduleSessionType;
  dayOfWeek: ScheduleDayOfWeek;

  /**
   * Use minutes from midnight for easier conflict checking.
   * 8:30am = 510
   * 2:15pm = 855
   */
  startMinute: number;
  endMinute: number;

  title?: string;
  description?: string;

  classId?: string | null;
  subjectId?: string | null;
  classSubjectId?: string | null;
  teacherId?: string | null;

  resourceId?: string | null;
  roomName?: string;
  location?: string;

  color?: string;

  effectiveFrom?: number | null;
  effectiveTo?: number | null;

  active?: boolean;
}

// ======================================================
// SCHEDULE RESOURCES
// ======================================================

export interface ScheduleResource extends BaseSync {
  schoolId: string;
  branchId: string;

  name: string;
  resourceType: ScheduleResourceType;

  description?: string;
  capacity?: number | null;
  location?: string;

  /**
   * Reusable scope for future Eleeveon apps.
   */
  scopeType?: ScheduleScopeType;
  scopeId?: string | null;

  active?: boolean;
}

// ======================================================
// SCHEDULE CONFLICTS
// ======================================================

export interface ScheduleConflict extends BaseSync {
  schoolId: string;
  branchId: string;

  conflictType: ScheduleConflictType;
  severity: ScheduleConflictSeverity;
  status: ScheduleConflictStatus;

  title: string;
  description?: string;

  /**
   * Link either calendar event conflict,
   * timetable session conflict, or both.
   */
  eventIdA?: string | null;
  eventIdB?: string | null;

  sessionIdA?: string | null;
  sessionIdB?: string | null;

  resourceId?: string | null;

  teacherId?: string | null;
  classId?: string | null;
  studentId?: string | null;

  conflictStartAt?: number | null;
  conflictEndAt?: number | null;

  dayOfWeek?: ScheduleDayOfWeek;
  startMinute?: number | null;
  endMinute?: number | null;

  detectedAt: number;
  resolvedAt?: number | null;
  resolvedByUserId?: string | null;
  resolutionNote?: string;
}


// ======================================================
// DATABASE
// ======================================================

/** Fresh permanent-ID schema for Eleeveon Schools Version 1. */
export const APP_DB_STORES_V1: Record<string, string> = {
      schools: "id,accountId,name,region,city,geohash,mapVisible,updatedAt,synced",

      branches:
        "id,accountId,schoolId,name,region,city,geohash,mapVisible,updatedAt,synced,[accountId+schoolId]",

      academicStructures:
        "id,accountId, schoolId, branchId,level,updatedAt",

      academicPeriods:
        "id,accountId, schoolId, branchId,academicStructureId,order,updatedAt",

      organizations:
        "id,accountId,schoolId,branchId,parentOrganizationId,type,updatedAt",

      students:
        "id,accountId,schoolId,branchId,currentClassId,admissionNumber,fullName,email,status,geohash,mapVisible,updatedAt,synced,[accountId+branchId]",

      teachers:
        "id,accountId,schoolId,branchId,role,fullName,title,geohash,mapVisible,updatedAt,synced,[accountId+branchId]",

      parents:
        "id,accountId,schoolId,branchId,phone,email,title,fullName,geohash,mapVisible,updatedAt,synced,[accountId+branchId]",

      studentParents:
        "id,accountId,schoolId,branchId,studentId,parentId",

      classes:
        "id,accountId,schoolId,branchId,organizationId,name,updatedAt",

      subjects:
        "id,accountId, schoolId, branchId,organizationId,name,code,category,updatedAt",

      programs:
        "id,accountId,schoolId,branchId,organizationId,code,name,active,updatedAt",

      curriculums:
        "id,accountId,schoolId,branchId,organizationId,programId,academicStructureId,name,active,updatedAt",

      curriculumPathways:
        "id,accountId,schoolId,branchId,curriculumId,active,updatedAt",

      curriculumSubjects: "id,accountId, schoolId, branchId,curriculumId,subjectId,pathwayId,organizationId,active",

      classSubjects: 
        "id,accountId, schoolId, branchId, classId, subjectId, curriculumSubjectId,academicStructureId, academicPeriodId, teacherId, active, locked",
        
        
      subjectPrerequisites:
        "id,accountId, schoolId, branchId,curriculumSubjectId,prerequisiteSubjectId,type,active,updatedAt",

      studentCurriculums:
        "id,accountId,schoolId,branchId,studentId,curriculumId,status,active,updatedAt",

      subjectOfferings:
        "id,accountId,schoolId,branchId,classSubjectId,curriculumSubjectId,subjectId,classId,academicPeriodId,teacherId,active,updatedAt",

      assignments:
        "id,accountId,schoolId,branchId,teacherId,classId,subjectId",

      classTeachers:
        "id,accountId,schoolId,branchId,classId,teacherId",

      studentEnrollments:
        "id,accountId,schoolId,branchId,studentId,classId,academicPeriodId,status,updatedAt",

      gradingSystems:
        "id,accountId, schoolId, branchId,organizationId,name,type,active,updatedAt",

      gradeRules:
        "id,accountId, schoolId, branchId,gradingSystemId,minScore,maxScore,grade,order,updatedAt",

      assessmentStructures:
        "id,accountId, schoolId, branchId,organizationId,academicStructureId,name,active,updatedAt",

      assessmentStructureItems:
        "id,accountId, schoolId, branchId,assessmentStructureId,order,active,updatedAt",

      assessmentApplicabilities:
        "id,accountId, schoolId, branchId,classSubjectId,assessmentStructureId,gradingSystemId,active,locked",

      assessmentComponents:
        "id,accountId, schoolId, branchId,classId,subjectId,academicPeriodId,assessmentStructureId,active",

      assessmentEntries:
        "id,accountId, schoolId, branchId,classSubjectId,studentId,assessmentStructureItemId,published,active",

      computedResults:
        "id,accountId, schoolId, branchId,classSubjectId,studentId,grade,gpa,position,published",

      attendance:
        "id,accountId, schoolId, branchId,studentId,classId,academicPeriodId,date",

      studentAttendanceSummaries:
        "id,accountId,schoolId,branchId,studentId,classId,academicStructureId,academicPeriodId,entryMode,updatedAt,synced,[accountId+schoolId+branchId+studentId+classId+academicStructureId+academicPeriodId]",

      teacherAttendance:
        "id,accountId,schoolId,branchId,teacherId,date,sessionId,verificationStatus,updatedAt,synced,[accountId+branchId+teacherId+date]",

      attendanceSessions:
        "id,accountId,schoolId,branchId,academicStructureId,academicPeriodId,classId,teacherId,scopeType,scopeId,date,status,openedAt,closedAt,updatedAt,synced,[accountId+branchId+date],[classId+date]",

      attendanceDevices:
        "id,accountId,schoolId,branchId,deviceType,provider,providerDeviceId,serialNumber,active,lastSeenAt,lastSyncAt,updatedAt,synced,[accountId+branchId+active]",

      attendanceCredentials:
        "id,accountId,schoolId,branchId,personType,personId,credentialType,status,provider,providerCredentialId,serialNumber,generatedAt,generatedByUserId,enrolledAt,expiresAt,revokedAt,lastUsedAt,updatedAt,synced,[accountId+branchId+personType+personId],[personId+credentialType+status]",

      attendanceCredentialEvents:
        "id,accountId,schoolId,branchId,credentialId,personType,personId,eventType,occurredAt,performedByUserId,attendanceDeviceId,updatedAt,synced,[credentialId+occurredAt],[personId+occurredAt]",

      attendanceCaptureEvents:
        "id,accountId,schoolId,branchId,sessionId,personType,personId,credentialId,attendanceDeviceId,captureMethod,capturedAt,verificationStatus,attendanceStatus,attendanceRecordId,duplicateOfEventId,updatedAt,synced,[sessionId+capturedAt],[personId+capturedAt],[accountId+branchId+capturedAt]",

      attendanceEvidenceAssets:
        "id,accountId,schoolId,branchId,captureEventId,mediaAssetId,evidenceType,retainedUntil,active,updatedAt,synced,[captureEventId+evidenceType]",


      // Shared identity foundation.
      identityCredentials:
        "id,accountId,schoolId,branchId,subjectType,subjectId,credentialType,status,credentialReference,tokenHash,serialNumber,provider,providerCredentialId,expiresAt,lastUsedAt,updatedAt,synced,[accountId+subjectType+subjectId],[subjectId+credentialType+status],[accountId+credentialReference],[accountId+tokenHash]",

      identityCredentialDesignSettings:
        "id,accountId,schoolId,branchId,name,templateKey,subjectType,credentialType,orientation,isDefault,active,updatedAt,synced,[accountId+schoolId+branchId],[branchId+active],[branchId+subjectType+credentialType],[branchId+isDefault]",

      identityCredentialEvents:
        "id,accountId,schoolId,branchId,credentialId,subjectType,subjectId,eventType,occurredAt,identityDeviceId,purpose,updatedAt,synced,[credentialId+occurredAt],[subjectId+occurredAt]",

      identityDevices:
        "id,accountId,schoolId,branchId,deviceType,status,provider,providerDeviceId,serialNumber,accessPointId,active,lastSeenAt,lastSyncAt,updatedAt,synced,[accountId+branchId+active],[accessPointId+active]",

      identityAccessPoints:
        "id,accountId,schoolId,branchId,name,code,accessPointType,organizationId,classId,vehicleId,active,updatedAt,synced,[accountId+branchId+accessPointType],[branchId+active]",

      identityActivityEvents:
        "id,accountId,schoolId,branchId,subjectType,subjectId,credentialId,identityDeviceId,accessPointId,purpose,action,occurredAt,verificationStatus,outcome,relatedTable,relatedRecordId,duplicateOfEventId,updatedAt,synced,[subjectId+occurredAt],[accessPointId+occurredAt],[purpose+occurredAt],[accountId+branchId+occurredAt]",

      identityEvidenceAssets:
        "id,accountId,schoolId,branchId,activityEventId,mediaAssetId,evidenceType,retainedUntil,active,updatedAt,synced,[activityEventId+evidenceType]",

      studentIdentityCards:
        "id,accountId,schoolId,branchId,studentId,credentialId,cardNumber,status,issuedAt,expiresAt,printedAt,replacementOfCardId,active,updatedAt,synced,[studentId+status],[accountId+cardNumber]",

      pickupAuthorizations:
        "id,accountId,schoolId,branchId,studentId,authorizedPersonType,authorizedPersonId,credentialId,status,validFrom,validUntil,approvedAt,revokedAt,updatedAt,synced,[studentId+status],[authorizedPersonId+status]",

      studentPickupEvents:
        "id,accountId,schoolId,branchId,studentId,authorizationId,collectorSubjectType,collectorSubjectId,credentialId,identityActivityEventId,status,requestedAt,approvedAt,releasedAt,updatedAt,synced,[studentId+releasedAt],[branchId+status+requestedAt]",

      visitorProfiles:
        "id,accountId,schoolId,branchId,fullName,phone,email,blocked,lastVisitAt,active,updatedAt,synced,[accountId+branchId+phone]",

      visitorVisits:
        "id,accountId,schoolId,branchId,visitorId,status,expectedAt,checkedInAt,checkedOutAt,credentialId,accessPointId,updatedAt,synced,[visitorId+checkedInAt],[branchId+status+checkedInAt]",

      schoolVehicles:
        "id,accountId,schoolId,branchId,name,registrationNumber,vehicleType,identityDeviceId,active,updatedAt,synced,[accountId+registrationNumber],[branchId+active]",

      transportRoutes:
        "id,accountId,schoolId,branchId,name,code,active,updatedAt,synced,[branchId+active]",

      transportStops:
        "id,accountId,schoolId,branchId,routeId,name,order,active,updatedAt,synced,[routeId+order]",

      studentTransportAssignments:
        "id,accountId,schoolId,branchId,studentId,routeId,vehicleId,pickupStopId,dropoffStopId,status,validFrom,validUntil,active,updatedAt,synced,[studentId+status],[routeId+active]",

      transportJourneys:
        "id,accountId,schoolId,branchId,vehicleId,routeId,date,direction,status,startedAt,arrivedAt,completedAt,updatedAt,synced,[vehicleId+date],[routeId+date],[branchId+status+date]",

      transportJourneyEvents:
        "id,accountId,schoolId,branchId,journeyId,studentId,assignmentId,stopId,credentialId,identityActivityEventId,eventType,occurredAt,updatedAt,synced,[journeyId+studentId+eventType],[studentId+occurredAt]",

      emergencyRollCallSessions:
        "id,accountId,schoolId,branchId,emergencyType,status,startedAt,endedAt,accessPointId,updatedAt,synced,[branchId+status+startedAt]",

      emergencyRollCallEntries:
        "id,accountId,schoolId,branchId,sessionId,subjectType,subjectId,status,confirmedAt,identityActivityEventId,updatedAt,synced,[sessionId+subjectType+subjectId],[sessionId+status]",

      reportCards:
        "id,accountId, schoolId, branchId,studentId,classId,academicPeriodId",

      reportCardItems:
        "id,accountId, schoolId, branchId,reportCardId,subjectId,academicPeriodId",

      reportCardTemplates:
        "id,accountId,schoolId,branchId,code,layoutKey,templateKey,name,reportType,isDefault,active,updatedAt,[accountId+schoolId+branchId+reportType],[branchId+reportType+active]",

      reportCardTemplateSettings:
        "id,accountId,schoolId,branchId,templateId,templateCode,layoutKey,templateKey,name,reportType,active,updatedAt,[accountId+schoolId+branchId+reportType],[branchId+reportType+active],[templateId+reportType]",

      reportCardTemplateAssignments:
        "id,accountId,schoolId,branchId,templateId,templateSettingsId,templateCode,layoutKey,templateKey,reportType,scopeType,scopeId,academicStructureId,academicPeriodId,classId,level,studentId,isDefault,active,updatedAt,[accountId+schoolId+branchId+reportType],[branchId+reportType+active],[reportType+scopeType+scopeId]",

      studentReportSnapshots:
        "id,accountId, schoolId, branchId, studentId, classId, academicStructureId, academicPeriodId, promotedToClassId, snapshotType, synced, isDeleted, updatedAt",

      studentPromotions:
        "id,accountId, schoolId, branchId, studentId, fromClassId, toClassId, fromAcademicStructureId, toAcademicStructureId, fromAcademicPeriodId, toAcademicPeriodId, average, recommendation, finalDecision, snapshotId, note",

      schoolBranchSettings:
        "id,accountId, schoolId, branchId, currentAcademicStructureId, currentAcademicPeriodId, synced, isDeleted, updatedAt",

      currencies:
        "id,accountId,code,countryCode,active,default,updatedAt",

      schoolCurrencySettings:
        "id,accountId,schoolId,branchId,currencyCode,active,updatedAt",

      paymentIntents:
        "id,accountId,schoolId,branchId,purpose,studentId,parentId,teacherId,feeInvoiceId,incomeId,payrollRunId,payrollItemId,status,channel,provider,providerReference,updatedAt",

      paymentTransactions:
        "id,accountId,schoolId,branchId,paymentIntentId,purpose,direction,status,channel,provider,providerReference,receiptNumber,referenceNumber,paidAt,updatedAt",

      paymentProviderEvents:
        "id,accountId,schoolId,branchId,provider,eventType,providerReference,paymentIntentId,paymentTransactionId,processed,createdAt,updatedAt",

      paymentRefunds:
        "id,accountId,schoolId,branchId,paymentTransactionId,status,provider,providerReference,refundedAt,updatedAt",

      paymentSettlements:
        "id,accountId,schoolId,branchId,paymentTransactionId,status,provider,providerReference,referenceNumber,settledAt,updatedAt",

      withdrawalRequests:
        "id,accountId,schoolId,branchId,status,method,referenceNumber,requestedAt,approvedAt,paidAt,updatedAt",

      schoolPayoutSettings:
        "id,accountId,schoolId,branchId,preferredMethod,settlementMode,paystackSubaccountCode,status,active,updatedAt",

      studentFeeInvoices:
        "id,accountId,schoolId,branchId,studentId,classId,academicStructureId,academicPeriodId,invoiceNumber,status,dueDate,paidAt,updatedAt",

      studentFeeInvoiceItems:
        "id,accountId,schoolId,branchId,invoiceId,feeStructureId,name,required,order,updatedAt",

      studentFeePayments:
        "id,accountId,schoolId,branchId,invoiceId,studentId,parentId,status,method,provider,paymentIntentId,paymentTransactionId,receiptNumber,referenceNumber,providerReference,date,paidAt,updatedAt",

      staffPayrollProfiles:
        "id,accountId,schoolId,branchId,teacherId,staffUserId,fullName,payType,preferredPaymentMethod,active,updatedAt",

      payrollRuns:
        "id,accountId,schoolId,branchId,status,periodStart,periodEnd,payDate,approvedAt,processedAt,locked,updatedAt",

      payrollItems:
        "id,accountId,schoolId,branchId,payrollRunId,payrollProfileId,teacherId,staffUserId,status,paymentMethod,provider,paymentIntentId,paymentTransactionId,paidAt,updatedAt",

      staffPaymentRecords:
        "id,accountId,schoolId,branchId,teacherId,staffUserId,payrollRunId,payrollItemId,status,method,provider,referenceNumber,receiptNumber,providerReference,date,paidAt,updatedAt",

      portalHighlights:
        "id,accountId,schoolId,branchId,status,active,mediaType,displayOrder,startAt,endAt,publishedAt,updatedAt,isDeleted,synced,[accountId+schoolId+branchId],[branchId+active+displayOrder],[branchId+status+startAt]",

      websiteSettings:
        "id,accountId,schoolId,branchId,eleeveonSlug,templateKey,status,primaryDomainId,homePageId,publishedAt,isDeleted,updatedAt,synced,&[accountId+eleeveonSlug],[schoolId+status]",

      websitePages:
        "id,accountId,schoolId,branchId,websiteSettingId,slug,pageType,status,displayOrder,parentPageId,showInNavigation,publishedAt,isDeleted,updatedAt,synced,&[websiteSettingId+slug],[websiteSettingId+status+displayOrder]",

      websiteSections:
        "id,accountId,schoolId,branchId,websiteSettingId,pageId,sectionKey,sectionType,sourceType,sourceId,status,displayOrder,active,isDeleted,updatedAt,synced,[pageId+status+displayOrder],[websiteSettingId+sectionType]",

      websiteNavigationItems:
        "id,accountId,schoolId,branchId,websiteSettingId,location,parentItemId,targetType,pageId,sectionId,displayOrder,active,isDeleted,updatedAt,synced,[websiteSettingId+location+active+displayOrder]",

      websiteDomains:
        "id,accountId,schoolId,branchId,websiteSettingId,&hostname,domainType,status,sslStatus,isPrimary,redirectToPrimary,verifiedAt,active,isDeleted,updatedAt,synced,[websiteSettingId+isPrimary],[schoolId+status]",

      websiteDomainAliases:
        "id,accountId,schoolId,websiteSettingId,&sourceHostname,targetHostname,active,expiresAt,isDeleted,updatedAt,synced,[websiteSettingId+active]",

      websiteForms:
        "id,accountId,schoolId,branchId,websiteSettingId,pageId,sectionId,formType,active,isDeleted,updatedAt,synced,[websiteSettingId+formType+active]",

      websiteFormSubmissions:
        "id,accountId,schoolId,branchId,websiteSettingId,formId,status,submittedAt,email,phone,assignedToUserId,isDeleted,updatedAt,synced,[formId+status+submittedAt],[schoolId+status+submittedAt]",

      websiteRevisions:
        "id,accountId,schoolId,websiteSettingId,revisionNumber,status,publishedAt,createdAt,isDeleted,updatedAt,synced,&[websiteSettingId+revisionNumber],[websiteSettingId+status]",

      announcements:
        "id,accountId,schoolId,branchId,audience,classId,organizationId,published,publishAt,expiresAt,createdBy,updatedAt",

      announcementRecipients:
        "id,accountId,schoolId,branchId,announcementId,recipientType,recipientId,userId,status,deliveredAt,readAt,updatedAt",

      messageThreads:
        "id,accountId,schoolId,branchId,threadType,classId,organizationId,studentId,teacherId,parentId,createdBy,lastMessageAt,archived,updatedAt",

      messages:
        "id,accountId,schoolId,branchId,threadId,senderUserId,senderRole,channel,status,deliveredAt,readAt,updatedAt",


      calendarEvents:
    "id,accountId, schoolId, branchId, scopeType, scopeId, eventType, status, visibility, startAt, endAt, classId, subjectId, classSubjectId, teacherId, studentId, parentId, academicStructureId, academicPeriodId, announcementId, messageThreadId, createdByUserId, active, isDeleted, updatedAt, synced",

  calendarEventParticipants:
    "id,accountId, schoolId, branchId, eventId, participantType, participantId, userId, role, email, responseStatus, required, active, isDeleted, updatedAt, synced",

  calendarEventReminders:
    "id,accountId, schoolId, branchId, eventId, participantId, channel, minutesBefore, scheduledAt, sentAt, status, active, isDeleted, updatedAt, synced",

  calendarEventResponses:
    "id,accountId, schoolId, branchId, eventId, participantId, userId, participantType, responseStatus, respondedAt, isDeleted, updatedAt, synced",

  scheduleTimetables:
    "id,accountId, schoolId, branchId, name, timetableType, scopeType, scopeId, academicStructureId, academicPeriodId, classId, teacherId, effectiveFrom, effectiveTo, status, active, isDefault, isDeleted, updatedAt, synced",

  scheduleSessions:
    "id,accountId, schoolId, branchId, timetableId, sessionType, dayOfWeek, startMinute, endMinute, classId, subjectId, classSubjectId, teacherId, resourceId, active, isDeleted, updatedAt, synced",

  scheduleResources:
    "id,accountId, schoolId, branchId, name, resourceType, scopeType, scopeId, active, isDeleted, updatedAt, synced",

  scheduleConflicts:
    "id,accountId, schoolId, branchId, conflictType, severity, status, eventIdA, eventIdB, sessionIdA, sessionIdB, resourceId, teacherId, classId, studentId, detectedAt, resolvedAt, isDeleted, updatedAt, synced",
      communicationLogs:
        "id,accountId,schoolId,branchId,channel,purpose,relatedTable,relatedId,recipientType,recipientId,status,provider,providerReference,sentAt,deliveredAt,readAt,updatedAt",

      notificationTemplates:
        "id,accountId,schoolId,branchId,purpose,channel,name,active,updatedAt",

      feeStructures:
        "id,accountId,schoolId,branchId,classId,academicStructureId,academicPeriodId,currencyCode,updatedAt",

      payments:
        "id,accountId,schoolId,branchId,studentId,method,currencyCode,date,receiptNumber,updatedAt",

      incomes:
        "id,accountId,schoolId,branchId,organizationId,title,date,amount,paymentMethod,currencyCode,updatedAt",

      expenses:
        "id,accountId,schoolId,branchId,organizationId,title,date,amount,expenseSourceType,paymentMethod,currencyCode,updatedAt",
      
      mediaAssets:
        "id,accountId,schoolId,branchId,ownerTable,ownerId,ownerTempKey,fieldKey,ownerIdentityKey,assetKind,mimeType,uploadStatus,active,isDeleted,updatedAt,synced,[accountId+ownerIdentityKey],[accountId+ownerTable+fieldKey]",

      mediaBlobs:
        "++id,accountId,assetId,mimeType,sizeBytes,createdAt,updatedAt,[accountId+assetId]",
      
      appUsers:
        "id,accountId,email,role,active,updatedAt",

      userMemberships:
        "id,accountId,userId,role,schoolId,branchId,teacherId,studentId,parentId,active,updatedAt",

      permissionRules:
        "id,accountId,moduleKey,developer,owner,admin,branch,teacher,student,parent,accountant,locked,updatedAt",

      // ======================================================
      // PLATFORM / BACKEND CACHE STORES
      // ======================================================
      accounts:
        "id,email,status,createdAt,updatedAt",

      userSessions:
        "id,accountId,userId,deviceId,expiresAt,revokedAt,updatedAt",

      subscriptionPlans:
        "id,code,active,priceMonthly,priceYearly,updatedAt",

      accountSubscriptions:
        "id,accountId,planId,status,billingCycle,currentPeriodEnd,nextBillingDate,updatedAt",

      invoices:
        "id,accountId,subscriptionId,invoiceNumber,status,dueDate,paidAt,updatedAt",

      appPayments:
        "id,accountId,subscriptionId,invoiceId,status,method,provider,providerReference,receiptNumber,paidAt,updatedAt",

      billingEvents:
        "id,accountId,type,createdAt",

      syncDevices:
        "id,accountId,deviceId,userId,lastSeenAt,active,updatedAt",

      syncConflicts:
        "id,accountId,tableName,localId,deviceId,status,resolvedAt,updatedAt",

      apiClients:
        "id,accountId,clientId,name,active,lastUsedAt,updatedAt",

      apiKeys:
        "id,accountId,apiClientId,keyPrefix,name,active,expiresAt,lastUsedAt,updatedAt",

      webhooks:
        "id,accountId,name,active,lastTriggeredAt,updatedAt",

      webhookLogs:
        "id,accountId,webhookId,eventType,status,statusCode,deliveredAt,createdAt",

      integrationMappings:
        "id,accountId,integrationKey,localTable,localId,externalId,updatedAt",

      auditLogs:
        "id,accountId,userId,action,entityType,entityId,schoolId,branchId,createdAt",

      backgroundJobs:
        "id,accountId,type,status,priority,scheduledAt,startedAt,completedAt,updatedAt",

      storageUsages:
        "id,accountId,lastCalculatedAt,updatedAt",

      accountFeatureFlags:
        "id,accountId,key,enabled,updatedAt",

      accountSystemSettings:
        "id,accountId,key,updatedAt",

      notificationDeliveryLogs:
        "id,accountId,channel,purpose,status,provider,providerReference,sentAt,deliveredAt,readAt,updatedAt",
    };

export class EleeveonDatabase extends Dexie {
  schools!: Table<School>;
  branches!: Table<Branch>;
  academicStructures!: Table<AcademicStructure>;
  academicPeriods!: Table<AcademicPeriod>;
  organizations!: Table<Organization>;

  students!: Table<Student>;
  teachers!: Table<Teacher>;
  parents!: Table<Parent>;
  studentParents!: Table<StudentParent>;

  classes!: Table<Class>;
  subjects!: Table<Subject>;
  programs!: Table<Program>;

  curriculums!: Table<Curriculum>;
  curriculumPathways!: Table<CurriculumPathway>;
  curriculumSubjects!: Table<CurriculumSubject>;

  classSubjects!: Table<ClassSubject>;

  subjectPrerequisites!: Table<SubjectPrerequisite>;
  studentCurriculums!: Table<StudentCurriculum>;
  subjectOfferings!: Table<SubjectOffering>;

  assignments!: Table<Assignment>;
  classTeachers!: Table<ClassTeacher>;
  studentEnrollments!: Table<StudentEnrollment>;

  gradingSystems!: Table<GradingSystem>;
  gradeRules!: Table<GradeRule>;

  assessmentStructures!: Table<AssessmentStructure>;
  assessmentStructureItems!: Table<AssessmentStructureItem>;

  assessmentApplicabilities!: Table<AssessmentApplicability>;

  assessmentComponents!: Table<AssessmentComponent>;
  assessmentEntries!: Table<AssessmentEntry>;
  computedResults!: Table<ComputedResult>;

  attendance!: Table<Attendance>;
  studentAttendanceSummaries!: Table<StudentAttendanceSummary>;
  teacherAttendance!: Table<TeacherAttendance>;
  attendanceSessions!: Table<AttendanceSession, string>;
  attendanceDevices!: Table<AttendanceDevice, string>;
  attendanceCredentials!: Table<AttendanceCredential, string>;
  attendanceCredentialEvents!: Table<AttendanceCredentialEvent, string>;
  attendanceCaptureEvents!: Table<AttendanceCaptureEvent, string>;
  attendanceEvidenceAssets!: Table<AttendanceEvidenceAsset, string>;


  // Shared identity, safety and movement platform.
  identityCredentials!: Table<IdentityCredential, string>;
  identityCredentialDesignSettings!: Table<IdentityCredentialDesignSetting, string>;
  identityCredentialEvents!: Table<IdentityCredentialEvent, string>;
  identityDevices!: Table<IdentityDevice, string>;
  identityAccessPoints!: Table<IdentityAccessPoint, string>;
  identityActivityEvents!: Table<IdentityActivityEvent, string>;
  identityEvidenceAssets!: Table<IdentityEvidenceAsset, string>;

  studentIdentityCards!: Table<StudentIdentityCard, string>;
  pickupAuthorizations!: Table<PickupAuthorization, string>;
  studentPickupEvents!: Table<StudentPickupEvent, string>;

  visitorProfiles!: Table<VisitorProfile, string>;
  visitorVisits!: Table<VisitorVisit, string>;

  schoolVehicles!: Table<SchoolVehicle, string>;
  transportRoutes!: Table<TransportRoute, string>;
  transportStops!: Table<TransportStop, string>;
  studentTransportAssignments!: Table<StudentTransportAssignment, string>;
  transportJourneys!: Table<TransportJourney, string>;
  transportJourneyEvents!: Table<TransportJourneyEvent, string>;

  emergencyRollCallSessions!: Table<EmergencyRollCallSession, string>;
  emergencyRollCallEntries!: Table<EmergencyRollCallEntry, string>;

  reportCards!: Table<ReportCard>;
  reportCardItems!: Table<ReportCardItem>;
  reportCardTemplates!: Table<ReportCardTemplate, string>;
  reportCardTemplateSettings!: Table<ReportCardTemplateSetting, string>;
  reportCardTemplateAssignments!: Table<ReportCardTemplateAssignment, string>;

  studentReportSnapshots!: Table<StudentReportSnapshot, string>;
  studentPromotions!: Table<StudentPromotion, string>;

  feeStructures!: Table<FeeStructure>;
  payments!: Table<Payment>;

  incomes!: Table<Income>;
  expenses!: Table<Expense>;

  currencies!: Table<Currency>;
  schoolCurrencySettings!: Table<SchoolCurrencySetting>;

  paymentIntents!: Table<PaymentIntent>;
  paymentTransactions!: Table<PaymentTransaction>;
  paymentProviderEvents!: Table<PaymentProviderEvent>;
  paymentRefunds!: Table<PaymentRefund>;
  paymentSettlements!: Table<PaymentSettlement>;
  withdrawalRequests!: Table<WithdrawalRequest>;
  schoolPayoutSettings!: Table<SchoolPayoutSetting>;

  studentFeeInvoices!: Table<StudentFeeInvoice>;
  studentFeeInvoiceItems!: Table<StudentFeeInvoiceItem>;
  studentFeePayments!: Table<StudentFeePayment>;

  staffPayrollProfiles!: Table<StaffPayrollProfile>;
  payrollRuns!: Table<PayrollRun>;
  payrollItems!: Table<PayrollItem>;
  staffPaymentRecords!: Table<StaffPaymentRecord>;

  portalHighlights!: Table<PortalHighlight, string>;

  websiteSettings!: Table<WebsiteSetting, string>;
  websitePages!: Table<WebsitePage, string>;
  websiteSections!: Table<WebsiteSection, string>;
  websiteNavigationItems!: Table<WebsiteNavigationItem, string>;
  websiteDomains!: Table<WebsiteDomain, string>;
  websiteDomainAliases!: Table<WebsiteDomainAlias, string>;
  websiteForms!: Table<WebsiteForm, string>;
  websiteFormSubmissions!: Table<WebsiteFormSubmission, string>;
  websiteRevisions!: Table<WebsiteRevision, string>;


  announcements!: Table<Announcement>;
  announcementRecipients!: Table<AnnouncementRecipient>;
  messageThreads!: Table<MessageThread>;
  messages!: Table<Message>;
  communicationLogs!: Table<CommunicationLog>;
  notificationTemplates!: Table<NotificationTemplate>;

  schoolBranchSettings!: Table<SchoolBranchSetting>;

  mediaAssets!: Table<MediaAsset, string>;
  mediaBlobs!: Table<MediaBlob, number>;

  calendarEvents!: Table<CalendarEvent, string>;
  calendarEventParticipants!: Table<CalendarEventParticipant, string>;
  calendarEventReminders!: Table<CalendarEventReminder, string>;
  calendarEventResponses!: Table<CalendarEventResponse, string>;
 
  scheduleTimetables!: Table<ScheduleTimetable, string>;
  scheduleSessions!: Table<ScheduleSession, string>;
  scheduleResources!: Table<ScheduleResource, string>;
  scheduleConflicts!: Table<ScheduleConflict, string>;
 

  appUsers!: Table<LocalAppUser, string>;
  userMemberships!: Table<LocalUserMembership, string>;
  permissionRules!: Table<LocalPermissionRule, string>;

  // Platform/backend cache tables added in the platform-ready upgrade.
  accounts!: Table<LocalAccount, string>;
  userSessions!: Table<LocalUserSession, string>;
  subscriptionPlans!: Table<LocalSubscriptionPlan, string>;
  accountSubscriptions!: Table<LocalAccountSubscription, string>;
  invoices!: Table<LocalInvoice, string>;
  appPayments!: Table<LocalAppPayment, string>;
  billingEvents!: Table<LocalBillingEvent, string>;
  syncDevices!: Table<LocalSyncDevice, string>;
  syncConflicts!: Table<LocalSyncConflict, string>;
  apiClients!: Table<LocalApiClient, string>;
  apiKeys!: Table<LocalApiKey, string>;
  webhooks!: Table<LocalWebhook, string>;
  webhookLogs!: Table<LocalWebhookLog, string>;
  integrationMappings!: Table<LocalIntegrationMapping, string>;
  auditLogs!: Table<LocalAuditLog, string>;
  backgroundJobs!: Table<LocalBackgroundJob, string>;
  storageUsages!: Table<LocalStorageUsage, string>;
  accountFeatureFlags!: Table<LocalAccountFeatureFlag, string>;
  accountSystemSettings!: Table<LocalAccountSystemSetting, string>;
  notificationDeliveryLogs!: Table<LocalNotificationDeliveryLog, string>;

  // Local-only database protection and recovery stores (v39+).
  migrationJournal!: Table<LocalMigrationJournal, number>;
  databaseRecoveryBackups!: Table<DatabaseRecoveryBackup, string>;
  syncQuarantine!: Table<SyncQuarantineRecord, number>;

  constructor() {
    super(APP_DB_NAME);
    this.version(APP_DB_VERSION).stores({
      ...APP_DB_STORES_V1,
      ...LOCAL_PROTECTION_STORES,
    });
  }
}

/**
 * The only Eleeveon Schools Dexie instance used by the application.
 *
 * Never create a second EleeveonDatabase instance in pages, hooks, contexts,
 * sync utilities, or tests that run inside the application shell.
 */
export const db = new EleeveonDatabase();

let databaseOpenPromise: Promise<EleeveonDatabase> | null = null;

/**
 * Database opening is intentionally controlled by DatabaseBootstrap.
 * Do not auto-open here: pre-upgrade backup must run before Dexie upgrades.
 */
export async function openAppDatabase(): Promise<EleeveonDatabase> {
  if (db.isOpen()) return db;
  if (databaseOpenPromise) return databaseOpenPromise;

  databaseOpenPromise = db
    .open()
    .then(() => db)
    .catch((error) => {
      // Dexie can be retried after a blocked upgrade, temporary browser
      // failure, or a user closing the older tab.
      throw error;
    })
    .finally(() => {
      databaseOpenPromise = null;
    });

  return databaseOpenPromise;
}

export function closeAppDatabase() {
  databaseOpenPromise = null;
  if (db.isOpen()) db.close();
}

export function isAppDatabaseReady() {
  return db.isOpen() && db.verno === APP_DB_VERSION;
}

export function getAppDatabaseVersion() {
  return db.isOpen() ? db.verno : undefined;
} 