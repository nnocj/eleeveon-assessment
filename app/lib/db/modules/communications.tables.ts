/**
 * app/lib/db/modules/communications.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the communications and calendar module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { branchScopedIndexes } from "../core/indexes";

export const COMMUNICATION_TABLE_NAMES = [
  "portalHighlights",
  "announcements",
  "announcementRecipients",
  "messageThreads",
  "messages",
  "calendarEvents",
  "calendarEventParticipants",
  "calendarEventReminders",
  "calendarEventResponses",
  "communicationLogs",
  "notificationTemplates",
] as const;

export const COMMUNICATION_STORES: Record<string, string> = {
  portalHighlights: branchScopedIndexes(
    "schoolId,branchId,placement,status,displayOrder,startAt,endAt,active,publishedAt,updatedAt",
  ),
  announcements: branchScopedIndexes(
    "schoolId,branchId,title,audience,status,priority,publishAt,expiresAt,active,updatedAt",
  ),
  announcementRecipients: branchScopedIndexes(
    "schoolId,branchId,announcementId,recipientType,recipientId,userId,status,deliveredAt,readAt,updatedAt",
  ),
  messageThreads: branchScopedIndexes(
    "schoolId,branchId,subject,threadType,status,lastMessageAt,createdByUserId,updatedAt",
  ),
  messages: branchScopedIndexes(
    "schoolId,branchId,threadId,senderUserId,senderRole,channel,status,deliveredAt,readAt,updatedAt",
  ),
  calendarEvents: branchScopedIndexes(
    "schoolId,branchId,scopeType,scopeId,eventType,status,visibility,startAt,endAt,classId,subjectId,classSubjectId,teacherId,studentId,parentId,academicStructureId,academicPeriodId,announcementId,messageThreadId,createdByUserId,active,updatedAt",
  ),
  calendarEventParticipants: branchScopedIndexes(
    "schoolId,branchId,eventId,participantType,participantId,userId,role,email,responseStatus,required,active,updatedAt",
  ),
  calendarEventReminders: branchScopedIndexes(
    "schoolId,branchId,eventId,participantId,channel,minutesBefore,scheduledAt,sentAt,status,active,updatedAt",
  ),
  calendarEventResponses: branchScopedIndexes(
    "schoolId,branchId,eventId,participantId,userId,participantType,responseStatus,respondedAt,updatedAt",
  ),
  communicationLogs: branchScopedIndexes(
    "schoolId,branchId,channel,purpose,relatedTable,relatedId,recipientType,recipientId,status,provider,providerReference,sentAt,deliveredAt,readAt,updatedAt",
  ),
  notificationTemplates: branchScopedIndexes(
    "schoolId,branchId,purpose,channel,name,active,updatedAt",
  ),
};
