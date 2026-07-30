export type AdvancedIdentityStatus =
  | "pending" | "active" | "approved" | "verified" | "requested"
  | "released" | "denied" | "revoked" | "expired" | "blocked"
  | "checked_in" | "checked_out" | "expected" | "cancelled"
  | "draft" | "open" | "completed" | "in_progress"
  | "present" | "missing" | "safe" | "injured" | "unknown"
  | string;

export interface NamedOption {
  value: string;
  label: string;
}

export interface PersonView {
  id: string;
  fullName: string;
  subtitle?: string | null;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  status?: AdvancedIdentityStatus;
  metadata?: Record<string, unknown>;
}

export interface PickupAuthorizationView {
  id: string;
  studentId: string;
  studentName?: string | null;
  studentPhotoUrl?: string | null;
  authorizedPersonType: "parent" | "guardian" | "other";
  authorizedPersonId?: string | null;
  fullName?: string | null;
  phone?: string | null;
  relationship?: string | null;
  photoUrl?: string | null;
  credentialId?: string | null;
  validFrom?: number | string | Date | null;
  validUntil?: number | string | Date | null;
  recurring?: boolean;
  allowedDays?: number[];
  status: AdvancedIdentityStatus;
  note?: string | null;
}

export interface PickupRequestView {
  id: string;
  studentId: string;
  studentName: string;
  studentPhotoUrl?: string | null;
  authorizationId?: string | null;
  collectorName?: string | null;
  collectorPhotoUrl?: string | null;
  collectorRelationship?: string | null;
  collectorPhone?: string | null;
  requestedAt?: number | string | Date | null;
  approvedAt?: number | string | Date | null;
  releasedAt?: number | string | Date | null;
  status: AdvancedIdentityStatus;
  verificationStatus?: AdvancedIdentityStatus;
  denialReason?: string | null;
  note?: string | null;
}

export interface VisitorProfileView {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  organizationName?: string | null;
  identificationType?: string | null;
  identificationLastFour?: string | null;
  photoUrl?: string | null;
  blocked?: boolean;
  blockReason?: string | null;
  lastVisitAt?: number | string | Date | null;
  active?: boolean;
}

export interface VisitorVisitView {
  id: string;
  visitorId: string;
  visitor?: VisitorProfileView | null;
  purpose: string;
  hostType?: "teacher" | "staff" | "student" | "office" | null;
  hostId?: string | null;
  hostName?: string | null;
  accessPointId?: string | null;
  accessPointName?: string | null;
  expectedAt?: number | string | Date | null;
  checkedInAt?: number | string | Date | null;
  checkedOutAt?: number | string | Date | null;
  status: AdvancedIdentityStatus;
  note?: string | null;
}

export interface VehicleView {
  id: string;
  name: string;
  registrationNumber: string;
  vehicleType?: "bus" | "van" | "car" | "other";
  capacity?: number;
  driverName?: string | null;
  driverPhone?: string | null;
  identityDeviceId?: string | null;
  routeName?: string | null;
  occupantCount?: number;
  status?: AdvancedIdentityStatus;
  active?: boolean;
}

export interface RouteView {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  stopCount?: number;
  assignedStudents?: number;
  vehicleName?: string | null;
  active?: boolean;
}

export interface StopView {
  id: string;
  routeId: string;
  name: string;
  order: number;
  latitude?: number | null;
  longitude?: number | null;
  expectedArrivalMinute?: number | null;
  expectedDepartureMinute?: number | null;
  assignedStudents?: number;
  active?: boolean;
}

export interface JourneyView {
  id: string;
  vehicleId: string;
  vehicleName?: string | null;
  routeId?: string | null;
  routeName?: string | null;
  date: string;
  direction: "to_school" | "from_school" | "trip";
  startedAt?: number | string | Date | null;
  arrivedAt?: number | string | Date | null;
  completedAt?: number | string | Date | null;
  status: AdvancedIdentityStatus;
  occupantCount?: number;
  eventCount?: number;
  note?: string | null;
}

export interface JourneyEventView {
  id: string;
  journeyId: string;
  studentId: string;
  studentName?: string | null;
  stopId?: string | null;
  stopName?: string | null;
  eventType: string;
  occurredAt: number | string | Date;
  latitude?: number | null;
  longitude?: number | null;
  note?: string | null;
}

export interface EmergencySessionView {
  id: string;
  name: string;
  emergencyType: "fire" | "security" | "medical" | "weather" | "drill" | "other";
  accessPointId?: string | null;
  accessPointName?: string | null;
  startedAt: number | string | Date;
  endedAt?: number | string | Date | null;
  status: "active" | "completed" | "cancelled";
  totalSubjects?: number;
  confirmedSubjects?: number;
  note?: string | null;
}

export interface EmergencyEntryView {
  id: string;
  sessionId: string;
  subjectType: "student" | "teacher" | "staff" | "parent" | "guardian" | "visitor";
  subjectId: string;
  subjectName: string;
  subjectSubtitle?: string | null;
  photoUrl?: string | null;
  status: AdvancedIdentityStatus;
  confirmedAt?: number | string | Date | null;
  note?: string | null;
}

export interface IdentityCardView {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber?: string | null;
  className?: string | null;
  branchName?: string | null;
  schoolName: string;
  schoolMotto?: string | null;
  schoolLogoUrl?: string | null;
  studentPhotoUrl?: string | null;
  cardNumber: string;
  credentialValue?: string | null;
  credentialLabel?: string | null;
  issuedAt?: number | string | Date | null;
  expiresAt?: number | string | Date | null;
  status: AdvancedIdentityStatus;
}

export interface IdentityCardTemplateConfig {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  orientation?: "landscape" | "portrait";
  showLogo?: boolean;
  showPhoto?: boolean;
  showMotto?: boolean;
  showBranch?: boolean;
  showClass?: boolean;
  showAdmissionNumber?: boolean;
  showIssuedDate?: boolean;
  showExpiryDate?: boolean;
  showCredential?: boolean;
  footerText?: string;
}
