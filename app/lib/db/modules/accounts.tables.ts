/**
 * app/lib/db/modules/accounts.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the accounts and access module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { platformCacheIndexes } from "../core/indexes";

export const ACCOUNT_TABLE_NAMES = [
  "accounts",
  "appUsers",
  "userMemberships",
  "permissionRules",
  "userSessions",
  "syncDevices",
  "syncConflicts",
  "apiClients",
  "apiKeys",
  "webhooks",
  "webhookLogs",
  "integrationMappings",
  "auditLogs",
  "backgroundJobs",
  "storageUsages",
  "accountFeatureFlags",
  "accountSystemSettings",
  "notificationDeliveryLogs",
] as const;

export const ACCOUNT_STORES: Record<string, string> = {
  accounts: platformCacheIndexes(
    "email,status,country,currency,createdAt,updatedAt",
  ),
  appUsers: platformCacheIndexes(
    "accountId,email,role,active,lastLoginAt,updatedAt,[accountId+email]",
  ),
  userMemberships: platformCacheIndexes(
    "accountId,userId,role,schoolId,branchId,teacherId,studentId,parentId,status,active,isDefault,updatedAt,[accountId+userId],[accountId+role],[accountId+schoolId+branchId]",
  ),
  permissionRules: platformCacheIndexes(
    "accountId,moduleKey,developer,owner,admin,branch,teacher,student,parent,accountant,locked,updatedAt,[accountId+moduleKey]",
  ),
  userSessions: platformCacheIndexes(
    "accountId,userId,activeMembershipId,activeRole,schoolId,branchId,deviceId,expiresAt,revokedAt,lastSeenAt,updatedAt",
  ),
  syncDevices: platformCacheIndexes(
    "accountId,deviceId,userId,lastSeenAt,lastPushAt,lastPullAt,active,updatedAt,[accountId+deviceId]",
  ),
  syncConflicts: platformCacheIndexes(
    "accountId,tableName,localId,cloudId,deviceId,conflictType,status,severity,detectedAt,resolvedAt,[accountId+tableName]",
  ),
  apiClients: platformCacheIndexes(
    "accountId,name,clientType,active,lastUsedAt,updatedAt",
  ),
  apiKeys: platformCacheIndexes(
    "accountId,clientId,keyPrefix,active,expiresAt,lastUsedAt,updatedAt",
  ),
  webhooks: platformCacheIndexes(
    "accountId,clientId,name,active,lastTriggeredAt,updatedAt",
  ),
  webhookLogs: platformCacheIndexes(
    "accountId,webhookId,eventType,status,createdAt,nextRetryAt",
  ),
  integrationMappings: platformCacheIndexes(
    "accountId,sourceSystem,targetSystem,entityType,localTable,localId,localCloudId,externalId,active,updatedAt",
  ),
  auditLogs: platformCacheIndexes(
    "accountId,actorUserId,action,moduleKey,entityType,entityId,schoolId,branchId,createdAt",
  ),
  backgroundJobs: platformCacheIndexes(
    "accountId,type,status,priority,scheduledAt,createdAt,updatedAt",
  ),
  storageUsages: platformCacheIndexes(
    "accountId,usedMb,limitMb,lastCalculatedAt,updatedAt",
  ),
  accountFeatureFlags: platformCacheIndexes(
    "accountId,key,enabled,updatedAt,[accountId+key]",
  ),
  accountSystemSettings: platformCacheIndexes(
    "accountId,key,locked,updatedAt,[accountId+key]",
  ),
  notificationDeliveryLogs: platformCacheIndexes(
    "accountId,schoolId,branchId,channel,purpose,recipientUserId,recipientType,recipientId,status,providerReference,createdAt,updatedAt",
  ),
};
