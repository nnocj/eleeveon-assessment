import {
  db,
  type Attendance,
} from "../db/db";
import type {
  AttendanceRecordInput,
  BulkAttendanceInput,
  IdentityMutationContext,
} from "./types";
import {
  newAttendanceSyncRecord,
  normalizeAttendanceNote,
  touchAttendanceSyncRecord,
} from "./exports";

export async function findStudentAttendance(
  studentId: string,
  date: string,
  academicPeriodId?: string,
): Promise<Attendance | undefined> {
  const records = await db.attendance
    .where("studentId")
    .equals(studentId)
    .toArray();

  return records.find(
    (item) =>
      !item.isDeleted &&
      item.date === date &&
      (!academicPeriodId ||
        item.academicPeriodId === academicPeriodId),
  );
}

export async function upsertStudentAttendance(
  context: IdentityMutationContext,
  input: AttendanceRecordInput,
): Promise<Attendance> {
  const current = await findStudentAttendance(
    input.studentId,
    input.date,
    input.academicPeriodId,
  );

  const note = normalizeAttendanceNote(input.note);

  if (current) {
    const patch: Partial<Attendance> = {
      classId: input.classId,
      academicStructureId: input.academicStructureId,
      academicPeriodId: input.academicPeriodId,
      status: input.status,
      sessionId: input.sessionId ?? current.sessionId ?? null,
      captureEventId:
        input.captureEventId ?? current.captureEventId ?? null,
      identityActivityEventId:
        input.identityActivityEventId ??
        current.identityActivityEventId ??
        null,
      credentialId:
        input.credentialId ?? current.credentialId ?? null,
      attendanceDeviceId:
        input.attendanceDeviceId ??
        current.attendanceDeviceId ??
        null,
      captureMethod:
        input.captureMethod ?? current.captureMethod,
      verificationStatus:
        input.verificationStatus ??
        current.verificationStatus,
      capturedAt:
        input.capturedAt ?? current.capturedAt ?? null,
      capturedByUserId:
        input.capturedByUserId ??
        current.capturedByUserId ??
        null,
      verifiedAt:
        input.verifiedAt ?? current.verifiedAt ?? null,
      verifiedByUserId:
        input.verifiedByUserId ??
        current.verifiedByUserId ??
        null,
      note,
      ...touchAttendanceSyncRecord(current, context),
    };

    await db.attendance.update(current.id, patch);
    return { ...current, ...patch } as Attendance;
  }

  const record: Attendance = {
    ...newAttendanceSyncRecord(context),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    studentId: input.studentId,
    classId: input.classId,
    academicStructureId: input.academicStructureId,
    academicPeriodId: input.academicPeriodId,
    date: input.date,
    status: input.status,
    sessionId: input.sessionId ?? null,
    captureEventId: input.captureEventId ?? null,
    identityActivityEventId:
      input.identityActivityEventId ?? null,
    credentialId: input.credentialId ?? null,
    attendanceDeviceId:
      input.attendanceDeviceId ?? null,
    captureMethod: input.captureMethod,
    verificationStatus: input.verificationStatus,
    capturedAt: input.capturedAt ?? null,
    capturedByUserId:
      input.capturedByUserId ?? null,
    verifiedAt: input.verifiedAt ?? null,
    verifiedByUserId:
      input.verifiedByUserId ?? null,
    note,
  };

  await db.attendance.add(record);
  return record;
}

export async function bulkUpsertStudentAttendance(
  context: IdentityMutationContext,
  input: BulkAttendanceInput,
): Promise<Attendance[]> {
  const results: Attendance[] = [];

  await db.transaction(
    "rw",
    db.attendance,
    async () => {
      for (const item of input.records) {
        const record = await upsertStudentAttendance(context, {
          studentId: item.studentId,
          classId: input.classId,
          academicStructureId: input.academicStructureId,
          academicPeriodId: input.academicPeriodId,
          date: input.date,
          status: item.status,
          sessionId: input.sessionId ?? null,
          captureMethod: "manual",
          verificationStatus: "verified",
          capturedAt: context.now ?? Date.now(),
          capturedByUserId: context.userId ?? null,
          verifiedAt: context.now ?? Date.now(),
          verifiedByUserId: context.userId ?? null,
          note: item.note,
        });

        results.push(record);
      }
    },
  );

  return results;
}

export async function softDeleteAttendance(
  context: IdentityMutationContext,
  attendanceId: string,
): Promise<void> {
  const current = await db.attendance.get(attendanceId);
  if (!current) return;

  await db.attendance.update(attendanceId, {
    isDeleted: true,
    ...touchAttendanceSyncRecord(current, context),
  });
}

export async function listClassAttendance(
  classId: string,
  date: string,
): Promise<Attendance[]> {
  const records = await db.attendance
    .where("classId")
    .equals(classId)
    .toArray();

  return records.filter(
    (item) =>
      !item.isDeleted &&
      item.date === date,
  );
}
