import type { EffectiveAccessSource, EntitlementStatus, FeatureKey, LicenseModel, DeploymentMode, SyncPolicy, UpdatePolicy, ResourceLimitKey, LocalAccountEntitlement } from "./commercial-access.types";

export interface EffectiveAccessSnapshot {
  accountId: string; source: EffectiveAccessSource; status: EntitlementStatus;
  licenseModel: LicenseModel; deploymentMode: DeploymentMode; syncPolicy: SyncPolicy; updatePolicy: UpdatePolicy;
  entitledVersion?: string | null; featureFlags: Record<string, boolean>; limits: Record<string, number | null>;
  validUntil?: string | null; graceEndsAt?: string | null; version: number;
  can(feature: FeatureKey): boolean; limit(resource: ResourceLimitKey): number | null;
}

export function createEffectiveAccess(entitlement: LocalAccountEntitlement): EffectiveAccessSnapshot {
  const featureFlags = { ...entitlement.featureFlags };
  const limits = { ...entitlement.limits };
  return {
    accountId: entitlement.accountId, source: entitlement.source, status: entitlement.status,
    licenseModel: entitlement.licenseModel, deploymentMode: entitlement.deploymentMode,
    syncPolicy: entitlement.syncPolicy, updatePolicy: entitlement.updatePolicy, entitledVersion: entitlement.entitledVersion,
    featureFlags, limits, validUntil: entitlement.validUntil, graceEndsAt: entitlement.graceEndsAt, version: entitlement.version,
    can(feature) { return entitlement.status !== "expired" && entitlement.status !== "suspended" && entitlement.status !== "cancelled" && featureFlags[feature] === true; },
    limit(resource) { const value = limits[resource]; return typeof value === "number" && Number.isFinite(value) ? value : null; },
  };
}

export function createNoAccess(accountId: string): EffectiveAccessSnapshot {
  return createEffectiveAccess({
    id: `no-access:${accountId}`, accountId, source: "trial", status: "expired",
    licenseModel: "trial", deploymentMode: "offline", syncPolicy: "disabled", updatePolicy: "version_locked",
    featureFlags: {}, limits: {}, version: 0, rebuiltAt: new Date(0).toISOString(),
  });
}
