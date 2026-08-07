export type FeatureKey =
  | "offlineSync" | "cloudBackup" | "reports" | "finance"
  | "attendance" | "identityCards" | "identitySafety"
  | "transport" | "communications" | "calendarScheduling"
  | "schoolWebsites" | "parentPortal" | "studentPortal"
  | "teacherPortal" | "advancedAnalytics" | "advancedScheduling"
  | "apiAccess" | "webhooks" | "prioritySupport" | string;

export type ResourceKey =
  | "schools" | "branches" | "users" | "students" | "teachers"
  | "storageMb" | "apiCallsPerMonth" | "devices" | "activations"
  | string;

export type EntitlementStatus =
  | "active" | "trial" | "grace" | "past_due"
  | "expired" | "suspended" | "cancelled";

export interface EffectiveAccessSnapshot {
  accountId: string;
  entitlementId?: string;
  source:
    | "subscription" | "perpetual_license" | "trial"
    | "private_offer" | "developer_override";
  status: EntitlementStatus;
  planId?: string | null;
  subscriptionId?: string | null;
  perpetualLicenseId?: string | null;
  licenseModel: "subscription" | "perpetual" | "trial" | "complimentary";
  deploymentMode: "connected" | "offline";
  syncPolicy: "full" | "platform_only" | "disabled";
  updatePolicy: "continuous" | "security_only" | "version_locked";
  entitledVersion?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  graceEndsAt?: string | null;
  features: Record<string, boolean>;
  limits: Record<string, number | null | undefined>;
  version: number;
  schemaVersion: number;
  rebuiltAt: string;
  sourceDetails?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface EntitlementUsage {
  schools: number;
  branches: number;
  users: number;
  students: number;
  teachers: number;
  storageMb: number;
  apiCallsPerMonth: number;
  devices?: number;
  activations?: number;
  calculatedAt?: string;
  [key: string]: number | string | undefined;
}

export interface EffectiveAccessResponse {
  snapshot: EffectiveAccessSnapshot;
  usage?: EntitlementUsage;
}

export interface AccessApi {
  snapshot: EffectiveAccessSnapshot | null;
  usage: EntitlementUsage | null;
  loading: boolean;
  refreshing: boolean;
  initialized: boolean;
  stale: boolean;
  error: string | null;
  can(feature: FeatureKey): boolean;
  cannot(feature: FeatureKey): boolean;
  limit(resource: ResourceKey): number | null;
  used(resource: ResourceKey): number;
  remaining(resource: ResourceKey): number | null;
  hasCapacity(resource: ResourceKey, increase?: number): boolean;
  refresh(options?: { rebuild?: boolean }): Promise<void>;
  clear(): void;
  readonly accountId: string | null;
  readonly status: EntitlementStatus | "unknown";
  readonly syncPolicy: "full" | "platform_only" | "disabled";
  readonly deploymentMode: "connected" | "offline" | null;
  readonly isReadOnly: boolean;
}
