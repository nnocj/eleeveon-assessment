import {
  db,
  type AttendanceSession,
} from "../db/db";
import {
  DEFAULT_ABSENT_AFTER_MINUTE,
  DEFAULT_LATE_AFTER_MINUTE,
} from "./constants";
import type { IdentityMutationContext } from "./types";
import {
  newAttendanceSyncRecord,
  touchAttendanceSyncRecord,
} from "./exports";

export interface CreateAttendanceSessionInput {
  academicStructureId?: string | null;
  academicPeriodId?: string | null;
  classId?: string | null;
  teacherId?: string | null;
  scopeType: AttendanceSession["scopeType"];
  scopeId?: string | null;
  date: string;
  name?: string | null;
  defaultStatus?: AttendanceSession["defaultStatus"];
  lateAfterMinute?: number | null;
  absentAfterMinute?: number | null;
}

export async function createAttendanceSession(
  context: IdentityMutationContext,
  input: CreateAttendanceSessionInput,
): Promise<AttendanceSession> {
  const now = context.now ?? Date.now();
  const session: AttendanceSession = {
    ...newAttendanceSyncRecord({ ...context, now }),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    academicStructureId:
      input.academicStructureId ?? null,
    academicPeriodId:
      input.academicPeriodId ?? null,
    classId: input.classId ?? null,
    teacherId: input.teacherId ?? null,
    scopeType: input.scopeType,
    scopeId: input.scopeId ?? null,
    date: input.date,
    name: input.name?.trim() || undefined,
    openedAt: now,
    openedByUserId: context.userId ?? null,
    defaultStatus: input.defaultStatus ?? "present",
    lateAfterMinute:
      input.lateAfterMinute ??
      DEFAULT_LATE_AFTER_MINUTE,
    absentAfterMinute:
      input.absentAfterMinute ??
      DEFAULT_ABSENT_AFTER_MINUTE,
    status: "open",
    active: true,
  };

  await db.attendanceSessions.add(session);
  return session;
}

export async function openAttendanceSession(
  context: IdentityMutationContext,
  sessionId: string,
): Promise<void> {
  const current = await db.attendanceSessions.get(sessionId);
  if (!current) throw new Error("Attendance session was not found.");

  await db.attendanceSessions.update(sessionId, {
    openedAt: context.now ?? Date.now(),
    openedByUserId: context.userId ?? null,
    closedAt: null,
    closedByUserId: null,
    status: "open",
    active: true,
    ...touchAttendanceSyncRecord(current, context),
  });
}

export async function closeAttendanceSession(
  context: IdentityMutationContext,
  sessionId: string,
): Promise<void> {
  const current = await db.attendanceSessions.get(sessionId);
  if (!current) throw new Error("Attendance session was not found.");

  await db.attendanceSessions.update(sessionId, {
    closedAt: context.now ?? Date.now(),
    closedByUserId: context.userId ?? null,
    status: "closed",
    ...touchAttendanceSyncRecord(current, context),
  });
}

export async function cancelAttendanceSession(
  context: IdentityMutationContext,
  sessionId: string,
): Promise<void> {
  const current = await db.attendanceSessions.get(sessionId);
  if (!current) throw new Error("Attendance session was not found.");

  await db.attendanceSessions.update(sessionId, {
    closedAt: context.now ?? Date.now(),
    closedByUserId: context.userId ?? null,
    status: "cancelled",
    active: false,
    ...touchAttendanceSyncRecord(current, context),
  });
}

export function attendanceSessionIsOpen(
  session: AttendanceSession,
): boolean {
  return (
    !session.isDeleted &&
    session.active !== false &&
    session.status === "open" &&
    session.closedAt == null
  );
}

export async function getOpenSessionForClass(
  classId: string,
  date: string,
): Promise<AttendanceSession | undefined> {
  const sessions = await db.attendanceSessions
    .where("classId")
    .equals(classId)
    .toArray();

  return sessions.find(
    (item) =>
      item.date === date &&
      attendanceSessionIsOpen(item),
  );
}
