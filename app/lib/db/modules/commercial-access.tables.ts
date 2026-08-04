import { platformCacheIndexes } from "../core/indexes";

export const COMMERCIAL_ACCESS_TABLE_NAMES = [
  "commercialPlans", "accountSubscriptions", "subscriptionPeriods", "subscriptionChangeOrders",
  "accountEntitlements", "accountUsageSnapshots", "privateOffers", "privateOfferAssignments",
  "accountPricingOverrides", "accountQuotaEvents", "perpetualLicenses", "licenseActivations",
  "licenseDevices", "licenseVersionEntitlements", "licenseUpgradeOffers", "licenseValidationEvents",
] as const;

export const COMMERCIAL_ACCESS_STORES: Record<string, string> = {
  commercialPlans: platformCacheIndexes("code,licenseModel,deploymentMode,syncPolicy,updatePolicy,licensedMajorVersion,minimumAppVersion,maximumAppVersion,deviceLimit,activationLimit,requiresPeriodicValidation,active,updatedAt"),
  accountSubscriptions: platformCacheIndexes("accountId,planId,status,billingCycle,currentPeriodStart,currentPeriodEnd,nextBillingDate,scheduledPlanId,scheduledChangeAt,entitlementVersion,updatedAt"),
  subscriptionPeriods: platformCacheIndexes("accountId,subscriptionId,planId,status,startsAt,endsAt,sourceType,updatedAt"),
  subscriptionChangeOrders: platformCacheIndexes("accountId,subscriptionId,fromPlanId,toPlanId,privateOfferId,pricingOverrideId,changeType,status,effectiveAt,quoteExpiresAt,updatedAt"),
  accountEntitlements: platformCacheIndexes("accountId,planId,subscriptionId,perpetualLicenseId,source,status,licenseModel,deploymentMode,syncPolicy,updatePolicy,validUntil,graceEndsAt,version,rebuiltAt,updatedAt"),
  accountUsageSnapshots: platformCacheIndexes("accountId,students,teachers,branches,users,storageMb,apiCallsThisMonth,entitlementVersion,calculatedAt,updatedAt"),
  privateOffers: platformCacheIndexes("code,basePlanId,active,validFrom,validUntil,updatedAt"),
  privateOfferAssignments: platformCacheIndexes("accountId,offerId,status,assignedAt,validUntil,updatedAt,[accountId+offerId]"),
  accountPricingOverrides: platformCacheIndexes("accountId,planId,active,validFrom,validUntil,updatedAt,[accountId+planId]"),
  accountQuotaEvents: platformCacheIndexes("accountId,resource,eventType,operation,status,tableName,localId,deviceId,createdAt,updatedAt"),
  perpetualLicenses: platformCacheIndexes("accountId,planId,licenseKeyPrefix,status,purchasedVersion,entitledVersion,licensedMajorVersion,syncPolicy,updatePolicy,requiresPeriodicValidation,nextValidationAt,createdAt,updatedAt"),
  licenseActivations: platformCacheIndexes("accountId,licenseId,deviceId,status,activatedAt,lastCheckedAt,deactivatedAt,revokedAt,updatedAt,[licenseId+deviceId]"),
  licenseDevices: platformCacheIndexes("accountId,licenseId,deviceId,status,platform,appVersion,firstSeenAt,lastSeenAt,updatedAt,[licenseId+deviceId]"),
  licenseVersionEntitlements: platformCacheIndexes("accountId,licenseId,version,majorVersion,status,grantedAt,expiresAt,updatedAt,[licenseId+version]"),
  licenseUpgradeOffers: platformCacheIndexes("accountId,licenseId,fromPlanId,toPlanId,upgradeType,status,quoteExpiresAt,createdAt,updatedAt"),
  licenseValidationEvents: platformCacheIndexes("accountId,licenseId,activationId,deviceId,result,validatedAt,createdAt"),
};
