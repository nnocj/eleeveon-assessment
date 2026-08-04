/** Platform V2 commercial access contracts. */

export type LicenseModel =
  | "subscription"
  | "perpetual"
  | "trial"
  | "complimentary";

export type DeploymentMode = "connected" | "offline";
export type SyncPolicy = "full" | "platform_only" | "disabled";
export type UpdatePolicy = "continuous" | "security_only" | "version_locked";

export type EffectiveAccessSource =
  | "subscription"
  | "perpetual_license"
  | "trial"
  | "private_offer"
  | "developer_override";

export type EntitlementStatus =
  | "active"
  | "trial"
  | "grace"
  | "past_due"
  | "expired"
  | "suspended"
  | "cancelled";

export type ResourceLimitKey =
  | "schools" | "branches" | "users" | "students" | "teachers"
  | "storageMb" | "apiCallsPerMonth" | string;
export type FeatureKey = string;

export interface LocalCommercialPlan {
  id: string; name: string; code: string; description?: string | null;
  currency: string; priceMonthly: number; priceTermly: number; priceYearly: number; priceOneTime?: number | null;
  licenseModel: LicenseModel; deploymentMode: DeploymentMode; syncPolicy: SyncPolicy; updatePolicy: UpdatePolicy;
  licensedMajorVersion?: number | null; minimumAppVersion?: string | null; maximumAppVersion?: string | null;
  deviceLimit?: number | null; activationLimit?: number | null; requiresPeriodicValidation: boolean;
  validationIntervalDays?: number | null; offlineGraceDays?: number | null;
  featureFlags: Record<FeatureKey, boolean>; limits: Record<ResourceLimitKey, number | null>;
  active: boolean; schemaVersion: number; createdAt?: string; updatedAt?: string;
}

export interface LocalPerpetualLicense {
  id: string; accountId: string; planId: string; licenseKeyPrefix: string; status: string;
  purchasedVersion: string; entitledVersion: string; licensedMajorVersion?: number | null;
  syncPolicy: SyncPolicy; updatePolicy: UpdatePolicy; requiresPeriodicValidation: boolean;
  validationIntervalDays?: number | null; offlineGraceDays?: number | null; lastValidatedAt?: string | null; nextValidationAt?: string | null;
  featureFlags: Record<FeatureKey, boolean>; limits: Record<ResourceLimitKey, number | null>;
  purchasedAt?: string | null; activatedAt?: string | null; metadata?: Record<string, unknown> | null; createdAt?: string; updatedAt?: string;
}

export interface LocalLicenseActivation { id: string; accountId: string; licenseId: string; deviceId: string; status: string; activatedAt: string; lastCheckedAt?: string | null; deactivatedAt?: string | null; revokedAt?: string | null; }
export interface LocalLicenseDevice { id: string; accountId: string; licenseId: string; deviceId: string; deviceName?: string | null; platform?: string | null; appVersion?: string | null; status: string; firstSeenAt: string; lastSeenAt?: string | null; }
export interface LocalLicenseVersionEntitlement { id: string; accountId: string; licenseId: string; version: string; majorVersion?: number | null; minimumAppVersion?: string | null; maximumAppVersion?: string | null; status: string; grantedAt: string; expiresAt?: string | null; }
export interface LocalLicenseUpgradeOffer { id: string; accountId: string; licenseId: string; fromPlanId?: string | null; toPlanId: string; upgradeType: string; status: string; amountDue: number; currency: string; quoteExpiresAt: string; }
export interface LocalLicenseValidationEvent { id: string; accountId?: string | null; licenseId: string; activationId?: string | null; deviceId?: string | null; appVersion?: string | null; result: string; validatedAt: string; }

export interface LocalAccountEntitlement {
  id: string; accountId: string; planId?: string | null; subscriptionId?: string | null; perpetualLicenseId?: string | null;
  source: EffectiveAccessSource; status: EntitlementStatus; validFrom?: string | null; validUntil?: string | null; graceEndsAt?: string | null;
  licenseModel: LicenseModel; deploymentMode: DeploymentMode; syncPolicy: SyncPolicy; updatePolicy: UpdatePolicy; entitledVersion?: string | null;
  featureFlags: Record<FeatureKey, boolean>; limits: Record<ResourceLimitKey, number | null>; version: number; rebuiltAt: string; updatedAt?: string;
}
