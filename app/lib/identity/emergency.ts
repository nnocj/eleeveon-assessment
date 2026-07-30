import {
  db,
  type EmergencyRollCallEntry,
  type EmergencyRollCallSession,
} from "../db/db";
import type {
  EmergencyRollCallEntryStatus,
  IdentityMutationContext,
  IdentitySubjectType,
} from "./types";
import { newSyncRecord, touchSyncRecord } from "./exports";

export async function startEmergencyRollCall(
  context: IdentityMutationContext,
  input: Pick<
    EmergencyRollCallSession,
    "name" | "emergencyType" | "accessPointId" | "note"
  >,
): Promise<EmergencyRollCallSession> {
  const session: EmergencyRollCallSession = {
    ...newSyncRecord(context),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    name: input.name.trim(),
    emergencyType: input.emergencyType,
    accessPointId: input.accessPointId ?? null,
    startedAt: context.now ?? Date.now(),
    startedByUserId: context.userId ?? null,
    status: "active",
    note: input.note ?? null,
  };

  await db.emergencyRollCallSessions.add(session);
  return session;
}

export async function seedEmergencyRollCallEntries(
  context: IdentityMutationContext,
  sessionId: string,
  subjects: readonly {
    subjectType: IdentitySubjectType;
    subjectId: string;
  }[],
): Promise<EmergencyRollCallEntry[]> {
  const unique = new Map(
    subjects.map((subject) => [
      `${subject.subjectType}:${subject.subjectId}`,
      subject,
    ]),
  );

  const records = [...unique.values()].map(
    (subject): EmergencyRollCallEntry => ({
      ...newSyncRecord(context),
      schoolId: context.schoolId,
      branchId: context.branchId ?? "",
      sessionId,
      subjectType: subject.subjectType,
      subjectId: subject.subjectId,
      status: "unconfirmed",
    }),
  );

  await db.emergencyRollCallEntries.bulkAdd(records);
  return records;
}

export async function confirmEmergencySubject(
  context: IdentityMutationContext,
  input: {
    sessionId: string;
    subjectType: IdentitySubjectType;
    subjectId: string;
    status: EmergencyRollCallEntryStatus;
    identityActivityEventId?: string | null;
    note?: string | null;
  },
): Promise<EmergencyRollCallEntry> {
  const entries = await db.emergencyRollCallEntries
    .where("sessionId")
    .equals(input.sessionId)
    .toArray();

  const current = entries.find(
    (item) =>
      item.subjectType === input.subjectType &&
      item.subjectId === input.subjectId &&
      !item.isDeleted,
  );

  const now = context.now ?? Date.now();

  if (current) {
    const patch: Partial<EmergencyRollCallEntry> = {
      status: input.status,
      identityActivityEventId:
        input.identityActivityEventId ?? current.identityActivityEventId ?? null,
      confirmedAt: now,
      confirmedByUserId: context.userId ?? null,
      note: input.note ?? current.note ?? null,
      ...touchSyncRecord(current, { ...context, now }),
    };

    await db.emergencyRollCallEntries.update(current.id, patch);
    return { ...current, ...patch } as EmergencyRollCallEntry;
  }

  const created: EmergencyRollCallEntry = {
    ...newSyncRecord({ ...context, now }),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    sessionId: input.sessionId,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    identityActivityEventId: input.identityActivityEventId ?? null,
    status: input.status,
    confirmedAt: now,
    confirmedByUserId: context.userId ?? null,
    note: input.note ?? null,
  };

  await db.emergencyRollCallEntries.add(created);
  return created;
}

export async function completeEmergencyRollCall(
  context: IdentityMutationContext,
  sessionId: string,
): Promise<void> {
  const session = await db.emergencyRollCallSessions.get(sessionId);
  if (!session) throw new Error("Emergency roll-call session was not found.");

  await db.emergencyRollCallSessions.update(sessionId, {
    endedAt: context.now ?? Date.now(),
    endedByUserId: context.userId ?? null,
    status: "completed",
    ...touchSyncRecord(session, context),
  });
}
