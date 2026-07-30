import {
  db,
  type AttendanceCaptureEvent,
} from "../db/db";
import {
  captureIdentityActivity,
  linkIdentityActivity,
} from "../identity";
import type {
  AttendanceCaptureInput,
  IdentityMutationContext,
} from "./types";
import {
  attendanceDateKey,
  newAttendanceSyncRecord,
} from "./exports";
import { upsertStudentAttendance } from "./attendance";
import {
  clockTeacherIn,
  clockTeacherOut,
} from "./teacher";

function mapCaptureMethodToCredentialType(
  method: AttendanceCaptureInput["captureMethod"],
) {
  switch (method) {
    case "qr_code":
      return "qr_code" as const;
    case "nfc":
      return "nfc_card" as const;
    case "fingerprint":
      return "fingerprint" as const;
    case "face":
      return "face_profile" as const;
    case "student_id":
      return "student_id" as const;
    default:
      return undefined;
  }
}

export async function captureAttendance(
  context: IdentityMutationContext,
  input: AttendanceCaptureInput & {
    classId?: string | null;
    academicStructureId?: string | null;
    academicPeriodId?: string | null;
    date?: string;
  },
): Promise<AttendanceCaptureEvent> {
  const now = context.now ?? Date.now();
  const purpose =
    input.purpose ??
    (
      input.personType === "student"
        ? "student_attendance"
        : "staff_clock_in"
    );

  const identityEvent =
    await captureIdentityActivity(
      { ...context, now },
      {
        rawValue: input.rawValue,
        credentialType:
          mapCaptureMethodToCredentialType(
            input.captureMethod,
          ),
        purpose,
        identityDeviceId:
          input.identityDeviceId ?? null,
        accessPointId:
          input.accessPointId ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        accuracyMeters:
          input.accuracyMeters ?? null,
        occurredAt: now,
        capturedByUserId:
          context.userId ?? null,
        metadata: input.metadata,
      },
    );

  const personId =
    identityEvent.subjectId !== "unknown"
      ? identityEvent.subjectId
      : input.personId;

  if (!personId) {
    throw new Error(
      "Attendance capture could not resolve a person.",
    );
  }

  const event: AttendanceCaptureEvent = {
    ...newAttendanceSyncRecord({ ...context, now }),
    identityActivityEventId:
      identityEvent.id,
    identityCredentialId:
      identityEvent.credentialId ?? null,
    identityDeviceId:
      input.identityDeviceId ?? null,
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    sessionId: input.sessionId ?? null,
    personType: input.personType,
    personId,
    credentialId:
      identityEvent.credentialId ?? null,
    attendanceDeviceId:
      input.attendanceDeviceId ?? null,
    captureMethod: input.captureMethod,
    capturedAt: now,
    capturedByUserId:
      context.userId ?? null,
    verificationStatus:
      identityEvent.verificationStatus,
    attendanceStatus:
      input.attendanceStatus ??
      (
        identityEvent.outcome === "accepted"
          ? "present"
          : null
      ),
    duplicateOfEventId:
      identityEvent.duplicateOfEventId ??
      null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    accuracyMeters:
      input.accuracyMeters ?? null,
    failureCode:
      identityEvent.failureCode ?? null,
    note: input.note ?? null,
  };

  await db.attendanceCaptureEvents.add(event);

  if (
    identityEvent.outcome === "accepted" &&
    input.personType === "student"
  ) {
    if (
      !input.classId ||
      !input.academicStructureId ||
      !input.academicPeriodId
    ) {
      throw new Error(
        "Student attendance capture requires class and academic context.",
      );
    }

    const attendance =
      await upsertStudentAttendance(
        { ...context, now },
        {
          studentId: personId,
          classId: input.classId,
          academicStructureId:
            input.academicStructureId,
          academicPeriodId:
            input.academicPeriodId,
          date:
            input.date ??
            attendanceDateKey(now),
          status:
            input.attendanceStatus ??
            "present",
          sessionId:
            input.sessionId ?? null,
          captureEventId: event.id,
          identityActivityEventId:
            identityEvent.id,
          credentialId:
            identityEvent.credentialId ??
            null,
          attendanceDeviceId:
            input.attendanceDeviceId ??
            null,
          captureMethod:
            input.captureMethod,
          verificationStatus:
            identityEvent.verificationStatus,
          capturedAt: now,
          capturedByUserId:
            context.userId ?? null,
          verifiedAt: now,
          verifiedByUserId:
            context.userId ?? null,
          note: input.note,
        },
      );

    await db.attendanceCaptureEvents.update(
      event.id,
      {
        attendanceRecordId:
          attendance.id,
      },
    );

    await linkIdentityActivity(
      identityEvent.id,
      "attendance",
      attendance.id,
    );
  }

  if (
    identityEvent.outcome === "accepted" &&
    (
      input.personType === "teacher" ||
      input.personType === "staff"
    )
  ) {
    const date =
      input.date ??
      attendanceDateKey(now);

    const result =
      purpose === "staff_clock_out"
        ? await clockTeacherOut(
            { ...context, now },
            {
              teacherId: personId,
              date,
              captureEventId: event.id,
              identityActivityEventId:
                identityEvent.id,
              credentialId:
                identityEvent.credentialId ??
                null,
              attendanceDeviceId:
                input.attendanceDeviceId ??
                null,
              method:
                input.captureMethod,
              verificationStatus:
                identityEvent.verificationStatus,
              note: input.note,
            },
          )
        : await clockTeacherIn(
            { ...context, now },
            {
              teacherId: personId,
              date,
              sessionId:
                input.sessionId ?? null,
              captureEventId: event.id,
              identityActivityEventId:
                identityEvent.id,
              credentialId:
                identityEvent.credentialId ??
                null,
              attendanceDeviceId:
                input.attendanceDeviceId ??
                null,
              method:
                input.captureMethod,
              verificationStatus:
                identityEvent.verificationStatus,
              note: input.note,
            },
          );

    await db.attendanceCaptureEvents.update(
      event.id,
      {
        attendanceRecordId:
          result.record.id,
      },
    );

    await linkIdentityActivity(
      identityEvent.id,
      "teacherAttendance",
      result.record.id,
    );
  }

  return event;
}
