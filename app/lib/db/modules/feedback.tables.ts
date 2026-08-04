/**
 * app/lib/db/modules/feedback.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the developer notices and feedback module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { branchScopedIndexes, platformCacheIndexes } from "../core/indexes";

export const FEEDBACK_TABLE_NAMES = [
  "platformReleases",
  "platformReleaseNotes",
  "platformAnnouncements",
  "platformAnnouncementReceipts",
  "platformFeedback",
  "platformFeedbackAttachments",
  "platformFeedbackMessages",
] as const;

export const FEEDBACK_STORES: Record<string, string> = {
  platformReleases: platformCacheIndexes(
    "version,channel,status,publishedAt,minimumSupportedVersion,createdAt,updatedAt",
  ),
  platformReleaseNotes: platformCacheIndexes(
    "releaseId,locale,title,createdAt,updatedAt,[releaseId+locale]",
  ),
  platformAnnouncements: platformCacheIndexes(
    "releaseId,type,priority,status,audience,startsAt,expiresAt,publishedAt,createdAt,updatedAt",
  ),
  platformAnnouncementReceipts: branchScopedIndexes(
    "announcementId,userId,membershipId,status,readAt,dismissedAt,acknowledgedAt,updatedAt,[announcementId+userId+membershipId]",
  ),
  platformFeedback: branchScopedIndexes(
    "schoolId,branchId,userId,membershipId,type,status,priority,subject,submittedAt,lastMessageAt,updatedAt",
  ),
  platformFeedbackAttachments: branchScopedIndexes(
    "feedbackId,messageId,mediaAssetId,fileName,mimeType,uploadedAt,updatedAt",
  ),
  platformFeedbackMessages: branchScopedIndexes(
    "feedbackId,senderType,senderUserId,status,createdAt,updatedAt",
  ),
};
