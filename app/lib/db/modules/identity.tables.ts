/**
 * app/lib/db/modules/identity.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the identity, safety and movement module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { branchScopedIndexes } from "../core/indexes";

export const IDENTITY_TABLE_NAMES = [
  "identityCredentials",
  "identityCredentialDesignSettings",
  "identityCredentialEvents",
  "identityDevices",
  "identityAccessPoints",
  "identityActivityEvents",
  "identityEvidenceAssets",
  "studentIdentityCards",
  "pickupAuthorizations",
  "studentPickupEvents",
  "visitorProfiles",
  "visitorVisits",
  "schoolVehicles",
  "transportRoutes",
  "transportStops",
  "studentTransportAssignments",
  "transportJourneys",
  "transportJourneyEvents",
  "emergencyRollCallSessions",
  "emergencyRollCallEntries",
] as const;

export const IDENTITY_STORES: Record<string, string> = {
  identityCredentials: branchScopedIndexes(
    "schoolId,branchId,subjectType,subjectId,credentialType,status,serialNumber,provider,providerCredentialId,expiresAt,lastUsedAt,updatedAt",
  ),
  identityCredentialDesignSettings: branchScopedIndexes(
    "schoolId,branchId,credentialType,templateKey,orientation,sides,active,updatedAt",
  ),
  identityCredentialEvents: branchScopedIndexes(
    "schoolId,branchId,credentialId,subjectType,subjectId,eventType,occurredAt,performedByUserId,identityDeviceId,updatedAt",
  ),
  identityDevices: branchScopedIndexes(
    "schoolId,branchId,name,deviceType,provider,providerDeviceId,serialNumber,accessPointId,active,lastSeenAt,lastSyncAt,updatedAt",
  ),
  identityAccessPoints: branchScopedIndexes(
    "schoolId,branchId,name,accessPointType,scopeType,scopeId,active,updatedAt",
  ),
  identityActivityEvents: branchScopedIndexes(
    "schoolId,branchId,subjectType,subjectId,purpose,outcome,credentialId,deviceId,accessPointId,occurredAt,updatedAt",
  ),
  identityEvidenceAssets: branchScopedIndexes(
    "schoolId,branchId,activityEventId,mediaAssetId,evidenceType,retainedUntil,active,updatedAt",
  ),
  studentIdentityCards: branchScopedIndexes(
    "schoolId,branchId,studentId,credentialId,cardNumber,status,issuedAt,expiresAt,updatedAt",
  ),
  pickupAuthorizations: branchScopedIndexes(
    "schoolId,branchId,studentId,parentId,authorizedPersonId,status,validFrom,validUntil,updatedAt",
  ),
  studentPickupEvents: branchScopedIndexes(
    "schoolId,branchId,studentId,authorizationId,status,requestedAt,releasedAt,updatedAt",
  ),
  visitorProfiles: branchScopedIndexes(
    "schoolId,branchId,fullName,phone,email,identityNumber,active,updatedAt",
  ),
  visitorVisits: branchScopedIndexes(
    "schoolId,branchId,visitorId,status,purpose,hostUserId,expectedAt,checkedInAt,checkedOutAt,updatedAt",
  ),
  schoolVehicles: branchScopedIndexes(
    "schoolId,branchId,name,registrationNumber,vehicleType,active,updatedAt",
  ),
  transportRoutes: branchScopedIndexes(
    "schoolId,branchId,name,code,vehicleId,active,updatedAt",
  ),
  transportStops: branchScopedIndexes(
    "schoolId,branchId,routeId,name,order,active,updatedAt",
  ),
  studentTransportAssignments: branchScopedIndexes(
    "schoolId,branchId,studentId,routeId,stopId,direction,active,updatedAt",
  ),
  transportJourneys: branchScopedIndexes(
    "schoolId,branchId,routeId,vehicleId,status,scheduledAt,startedAt,completedAt,updatedAt",
  ),
  transportJourneyEvents: branchScopedIndexes(
    "schoolId,branchId,journeyId,studentId,eventType,occurredAt,updatedAt",
  ),
  emergencyRollCallSessions: branchScopedIndexes(
    "schoolId,branchId,name,status,startedAt,completedAt,updatedAt",
  ),
  emergencyRollCallEntries: branchScopedIndexes(
    "schoolId,branchId,sessionId,subjectType,subjectId,status,confirmedAt,updatedAt",
  ),
};
