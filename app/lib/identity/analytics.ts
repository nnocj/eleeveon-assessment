import type {
  IdentityActivityEvent,
  IdentityAnalyticsSnapshot,
} from "./types";

export function buildIdentityAnalytics(
  events: readonly IdentityActivityEvent[],
): IdentityAnalyticsSnapshot {
  const active = events.filter((item) => !item.isDeleted);
  const byPurpose: Record<string, number> = {};
  const byOutcome: Record<string, number> = {};
  const bySubjectType: Record<string, number> = {};
  const subjects = new Set<string>();

  for (const event of active) {
    byPurpose[event.purpose] = (byPurpose[event.purpose] ?? 0) + 1;
    byOutcome[event.outcome] = (byOutcome[event.outcome] ?? 0) + 1;
    bySubjectType[event.subjectType] =
      (bySubjectType[event.subjectType] ?? 0) + 1;
    subjects.add(`${event.subjectType}:${event.subjectId}`);
  }

  return {
    totalActivities: active.length,
    acceptedActivities: byOutcome.accepted ?? 0,
    deniedActivities: byOutcome.denied ?? 0,
    failedActivities: byOutcome.failed ?? 0,
    pendingActivities: byOutcome.pending ?? 0,
    uniqueSubjects: subjects.size,
    byPurpose,
    byOutcome,
    bySubjectType,
  };
}

export function activitySuccessRate(
  snapshot: IdentityAnalyticsSnapshot,
): number {
  if (!snapshot.totalActivities) return 0;
  return (snapshot.acceptedActivities / snapshot.totalActivities) * 100;
}
