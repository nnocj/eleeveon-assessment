import {
  db,
  type TeacherAttendance,
} from "../db/db";
import type {
  AttendanceCaptureMethod,
  AttendanceStatus,
  AttendanceVerificationStatus,
  IdentityMutationContext,
  TeacherClockResult,
} from "./types";
import {
  attendanceTimeKey,
  minutesSinceMidnight,
  newAttendanceSyncRecord,
  touchAttendanceSyncRecord,
} from "./exports";

export async function findTeacherAttendance(
  teacherId: string,
  date: string,
): Promise<TeacherAttendance | undefined> {
  const records = await db.teacherAttendance
    .where("teacherId")
    .equals(teacherId)
    .toArray();

  return records.find(
    (item) =>
      !item.isDeleted &&
      item.date === date,
  );
}

export async function clockTeacherIn(
  context: IdentityMutationContext,
  input: {
    teacherId: string;
    date: string;
    sessionId?: string | null;
    captureEventId?: string | null;
    identityActivityEventId?: string | null;
    credentialId?: string | null;
    attendanceDeviceId?: string | null;
    method?: AttendanceCaptureMethod;
    verificationStatus?: AttendanceVerificationStatus;
    expectedStartMinute?: number | null;
    status?: AttendanceStatus | TeacherAttendance["status"];
    note?: string | null;
  },
): Promise<TeacherClockResult> {
  const now = context.now ?? Date.now();
  const current = await findTeacherAttendance(
    input.teacherId,
    input.date,
  );

  if (current?.clockIn) {
    return {
      record: current,
      action: "unchanged",
    };
  }

  const lateMinutes =
    input.expectedStartMinute != null
      ? Math.max(
          0,
          minutesSinceMidnight(now) -
            input.expectedStartMinute,
        )
      : 0;

  if (current) {
    const patch: Partial<TeacherAttendance> = {
      clockIn: attendanceTimeKey(now),
      clockInCaptureEventId:
        input.captureEventId ?? null,
      clockInIdentityActivityEventId:
        input.identityActivityEventId ?? null,
      clockInMethod: input.method ?? "manual",
      clockInCredentialId:
        input.credentialId ?? null,
      attendanceDeviceId:
        input.attendanceDeviceId ?? null,
      verificationStatus:
        input.verificationStatus ?? "verified",
      status:
        input.status ??
        (lateMinutes > 0 ? "late" : "present"),
      lateMinutes,
      note: input.note ?? current.note,
      ...touchAttendanceSyncRecord(
        current,
        { ...context, now },
      ),
    };

    await db.teacherAttendance.update(
      current.id,
      patch,
    );

    return {
      record: {
        ...current,
        ...patch,
      } as TeacherAttendance,
      action: "clock_in",
    };
  }

  const record: TeacherAttendance = {
    ...newAttendanceSyncRecord({ ...context, now }),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    teacherId: input.teacherId,
    date: input.date,
    clockIn: attendanceTimeKey(now),
    sessionId: input.sessionId ?? null,
    clockInCaptureEventId:
      input.captureEventId ?? null,
    clockInIdentityActivityEventId:
      input.identityActivityEventId ?? null,
    clockInMethod: input.method ?? "manual",
    clockInCredentialId:
      input.credentialId ?? null,
    attendanceDeviceId:
      input.attendanceDeviceId ?? null,
    verificationStatus:
      input.verificationStatus ?? "verified",
    status:
      input.status ??
      (lateMinutes > 0 ? "late" : "present"),
    lateMinutes,
    note: input.note ?? undefined,
  };

  await db.teacherAttendance.add(record);

  return {
    record,
    action: "clock_in",
  };
}

export async function clockTeacherOut(
  context: IdentityMutationContext,
  input: {
    teacherId: string;
    date: string;
    captureEventId?: string | null;
    identityActivityEventId?: string | null;
    credentialId?: string | null;
    attendanceDeviceId?: string | null;
    method?: AttendanceCaptureMethod;
    verificationStatus?: AttendanceVerificationStatus;
    expectedEndMinute?: number | null;
    note?: string | null;
  },
): Promise<TeacherClockResult> {
  const now = context.now ?? Date.now();
  const current = await findTeacherAttendance(
    input.teacherId,
    input.date,
  );

  if (!current?.clockIn) {
    throw new Error(
      "Teacher must clock in before clocking out.",
    );
  }

  if (current.clockOut) {
    return {
      record: current,
      action: "unchanged",
    };
  }

  const clockInParts = current.clockIn
    .split(":")
    .map(Number);

  const clockInMinute =
    (clockInParts[0] || 0) * 60 +
    (clockInParts[1] || 0);

  const clockOutMinute =
    minutesSinceMidnight(now);

  const workingMinutes = Math.max(
    0,
    clockOutMinute - clockInMinute,
  );

  const earlyDepartureMinutes =
    input.expectedEndMinute != null
      ? Math.max(
          0,
          input.expectedEndMinute -
            clockOutMinute,
        )
      : 0;

  const overtimeMinutes =
    input.expectedEndMinute != null
      ? Math.max(
          0,
          clockOutMinute -
            input.expectedEndMinute,
        )
      : 0;

  const patch: Partial<TeacherAttendance> = {
    clockOut: attendanceTimeKey(now),
    clockOutCaptureEventId:
      input.captureEventId ?? null,
    clockOutIdentityActivityEventId:
      input.identityActivityEventId ?? null,
    clockOutMethod: input.method ?? "manual",
    clockOutCredentialId:
      input.credentialId ?? null,
    attendanceDeviceId:
      input.attendanceDeviceId ??
      current.attendanceDeviceId ??
      null,
    verificationStatus:
      input.verificationStatus ??
      current.verificationStatus ??
      "verified",
    workingMinutes,
    earlyDepartureMinutes,
    overtimeMinutes,
    note: input.note ?? current.note,
    ...touchAttendanceSyncRecord(
      current,
      { ...context, now },
    ),
  };

  await db.teacherAttendance.update(
    current.id,
    patch,
  );

  return {
    record: {
      ...current,
      ...patch,
    } as TeacherAttendance,
    action: "clock_out",
  };
}
