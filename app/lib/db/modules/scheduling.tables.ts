/**
 * app/lib/db/modules/scheduling.tables.ts
 * --------------------------------------------------------------------------
 * Dexie store definitions for the advanced scheduling module.
 *
 * This file contains store/index declarations only. Domain interfaces remain
 * available from db.ts during the compatibility phase and may be extracted
 * into dedicated type modules later.
 */

import { branchScopedIndexes } from "../core/indexes";

export const SCHEDULING_TABLE_NAMES = [
  "scheduleTimetables",
  "scheduleSessions",
  "scheduleResources",
  "scheduleConflicts",
  "schedulePeriodTemplates",
  "schedulePeriodTemplateAssignments",
  "schedulePeriodSlots",
  "scheduleSharedBlocks",
  "scheduleSharedBlockGroups",
  "scheduleSharedBlockTeachers",
  "scheduleGroups",
  "scheduleGroupMembers",
  "scheduleTeacherAvailability",
  "scheduleTeacherWorkloadRules",
  "scheduleSubjectRequirements",
  "scheduleRequirementGroups",
  "scheduleRequirementTeachers",
  "scheduleResourceRequirements",
  "scheduleConstraintRules",
  "scheduleSessionGroups",
  "scheduleSessionTeachers",
  "scheduleSessionResources",
  "scheduleGenerationRuns",
  "scheduleDrafts",
  "scheduleDraftSessions",
  "scheduleDraftSessionGroups",
  "scheduleDraftSessionTeachers",
  "scheduleDraftSessionResources",
  "scheduleGenerationIssues",
  "scheduleGenerationSuggestions",
  "scheduleSuggestionRequirements",
  "scheduleSuggestionGroups",
  "scheduleSuggestionTeachers",
  "scheduleSuggestionResources",
  "schedulePublishEvents",
  "scheduleVersionSnapshots",
] as const;

export const SCHEDULING_STORES: Record<string, string> = {
  scheduleTimetables: branchScopedIndexes(
    "schoolId,branchId,name,timetableType,scopeType,scopeId,academicStructureId,academicPeriodId,classId,teacherId,effectiveFrom,effectiveTo,status,active,isDefault,updatedAt",
  ),
  scheduleSessions: branchScopedIndexes(
    "schoolId,branchId,timetableId,sessionType,dayOfWeek,startMinute,endMinute,classId,subjectId,classSubjectId,teacherId,resourceId,periodSlotId,sharedBlockId,status,active,updatedAt",
  ),
  scheduleResources: branchScopedIndexes(
    "schoolId,branchId,name,resourceType,scopeType,scopeId,capacity,active,updatedAt",
  ),
  scheduleConflicts: branchScopedIndexes(
    "schoolId,branchId,conflictType,severity,status,eventIdA,eventIdB,sessionIdA,sessionIdB,resourceId,teacherId,classId,studentId,detectedAt,resolvedAt,updatedAt",
  ),
  schedulePeriodTemplates: branchScopedIndexes(
    "schoolId,branchId,name,academicStructureId,academicPeriodId,status,isDefault,active,updatedAt",
  ),
  schedulePeriodTemplateAssignments: branchScopedIndexes(
    "schoolId,branchId,periodTemplateId,scopeType,scopeId,classId,teacherId,academicStructureId,academicPeriodId,active,updatedAt",
  ),
  schedulePeriodSlots: branchScopedIndexes(
    "schoolId,branchId,periodTemplateId,dayOfWeek,slotType,startMinute,endMinute,order,active,updatedAt,[periodTemplateId+dayOfWeek+order]",
  ),
  scheduleSharedBlocks: branchScopedIndexes(
    "schoolId,branchId,name,blockType,dayOfWeek,startMinute,endMinute,status,active,updatedAt",
  ),
  scheduleSharedBlockGroups: branchScopedIndexes(
    "schoolId,branchId,sharedBlockId,groupId,required,active,updatedAt",
  ),
  scheduleSharedBlockTeachers: branchScopedIndexes(
    "schoolId,branchId,sharedBlockId,teacherId,required,active,updatedAt",
  ),
  scheduleGroups: branchScopedIndexes(
    "schoolId,branchId,name,groupType,scopeType,scopeId,active,updatedAt",
  ),
  scheduleGroupMembers: branchScopedIndexes(
    "schoolId,branchId,groupId,memberType,memberId,classId,studentId,teacherId,active,updatedAt",
  ),
  scheduleTeacherAvailability: branchScopedIndexes(
    "schoolId,branchId,teacherId,dayOfWeek,startMinute,endMinute,availabilityType,priority,active,updatedAt",
  ),
  scheduleTeacherWorkloadRules: branchScopedIndexes(
    "schoolId,branchId,teacherId,maxPeriodsPerDay,maxPeriodsPerWeek,maxConsecutivePeriods,minBreakMinutes,active,updatedAt",
  ),
  scheduleSubjectRequirements: branchScopedIndexes(
    "schoolId,branchId,classSubjectId,classId,subjectId,academicPeriodId,periodsPerWeek,durationMinutes,consecutiveMode,priority,status,active,updatedAt",
  ),
  scheduleRequirementGroups: branchScopedIndexes(
    "schoolId,branchId,requirementId,groupId,required,active,updatedAt",
  ),
  scheduleRequirementTeachers: branchScopedIndexes(
    "schoolId,branchId,requirementId,teacherId,role,required,active,updatedAt",
  ),
  scheduleResourceRequirements: branchScopedIndexes(
    "schoolId,branchId,requirementId,resourceId,resourceType,quantity,required,active,updatedAt",
  ),
  scheduleConstraintRules: branchScopedIndexes(
    "schoolId,branchId,name,constraintType,severity,scopeType,scopeId,weight,enabled,active,updatedAt",
  ),
  scheduleSessionGroups: branchScopedIndexes(
    "schoolId,branchId,sessionId,groupId,required,active,updatedAt",
  ),
  scheduleSessionTeachers: branchScopedIndexes(
    "schoolId,branchId,sessionId,teacherId,role,required,active,updatedAt",
  ),
  scheduleSessionResources: branchScopedIndexes(
    "schoolId,branchId,sessionId,resourceId,quantity,required,active,updatedAt",
  ),
  scheduleGenerationRuns: branchScopedIndexes(
    "schoolId,branchId,timetableId,status,algorithmVersion,startedAt,completedAt,createdByUserId,updatedAt",
  ),
  scheduleDrafts: branchScopedIndexes(
    "schoolId,branchId,generationRunId,timetableId,name,status,score,rank,selected,createdAt,updatedAt",
  ),
  scheduleDraftSessions: branchScopedIndexes(
    "schoolId,branchId,draftId,requirementId,dayOfWeek,startMinute,endMinute,classId,subjectId,classSubjectId,periodSlotId,sharedBlockId,status,updatedAt",
  ),
  scheduleDraftSessionGroups: branchScopedIndexes(
    "schoolId,branchId,draftSessionId,groupId,required,updatedAt",
  ),
  scheduleDraftSessionTeachers: branchScopedIndexes(
    "schoolId,branchId,draftSessionId,teacherId,role,required,updatedAt",
  ),
  scheduleDraftSessionResources: branchScopedIndexes(
    "schoolId,branchId,draftSessionId,resourceId,quantity,required,updatedAt",
  ),
  scheduleGenerationIssues: branchScopedIndexes(
    "schoolId,branchId,generationRunId,draftId,issueType,severity,status,requirementId,teacherId,classId,resourceId,createdAt,updatedAt",
  ),
  scheduleGenerationSuggestions: branchScopedIndexes(
    "schoolId,branchId,generationRunId,draftId,suggestionType,status,priority,scoreImpact,createdAt,updatedAt",
  ),
  scheduleSuggestionRequirements: branchScopedIndexes(
    "schoolId,branchId,suggestionId,requirementId,updatedAt",
  ),
  scheduleSuggestionGroups: branchScopedIndexes(
    "schoolId,branchId,suggestionId,groupId,updatedAt",
  ),
  scheduleSuggestionTeachers: branchScopedIndexes(
    "schoolId,branchId,suggestionId,teacherId,updatedAt",
  ),
  scheduleSuggestionResources: branchScopedIndexes(
    "schoolId,branchId,suggestionId,resourceId,updatedAt",
  ),
  schedulePublishEvents: branchScopedIndexes(
    "schoolId,branchId,timetableId,draftId,publishType,status,publishedAt,publishedByUserId,updatedAt",
  ),
  scheduleVersionSnapshots: branchScopedIndexes(
    "schoolId,branchId,timetableId,versionNumber,status,publishedAt,createdAt,updatedAt,[timetableId+versionNumber]",
  ),
};
