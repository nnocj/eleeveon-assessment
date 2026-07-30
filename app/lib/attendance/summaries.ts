import {
  db,
  type Attendance,
  type StudentAttendanceSummary,
} from "../db/db";
import {
  ATTENDANCE_ABSENT_STATUSES,
  ATTENDANCE_NEUTRAL_STATUSES,
  ATTENDANCE_PRESENT_STATUSES,
} from "./constants";
import type {
  IdentityMutationContext,
  StudentAttendanceTotals,
} from "./types";
import {
  newAttendanceSyncRecord,
  touchAttendanceSyncRecord,
} from "./exports";

export function calculateStudentAttendanceTotals(
  records: readonly Attendance[],
): StudentAttendanceTotals {
  const active = records.filter(
    (item) => !item.isDeleted,
  );

  let daysPresent = 0;
  let daysAbsent = 0;
  let timesLate = 0;
  let daysOpened = 0;

  for (const record of active) {
    if (!ATTENDANCE_NEUTRAL_STATUSES.has(record.status)) {
      daysOpened += 1;
    }

    if (ATTENDANCE_PRESENT_STATUSES.has(record.status)) {
      daysPresent += 1;
    }

    if (ATTENDANCE_ABSENT_STATUSES.has(record.status)) {
      daysAbsent += 1;
    }

    if (record.status === "late") {
      timesLate += 1;
    }
  }

  const attendancePercent =
    daysOpened > 0
      ? (daysPresent / daysOpened) * 100
      : 0;

  return {
    daysPresent,
    daysOpened,
    daysAbsent,
    timesLate,
    attendancePercent,
  };
}

export async function calculateStudentSummary(
  studentId: string,
  academicPeriodId: string,
): Promise<StudentAttendanceTotals> {
  const records = await db.attendance
    .where("studentId")
    .equals(studentId)
    .toArray();

  return calculateStudentAttendanceTotals(
    records.filter(
      (item) =>
        item.academicPeriodId === academicPeriodId,
    ),
  );
}

export async function upsertStudentAttendanceSummary(
  context: IdentityMutationContext,
  input: {
    studentId: string;
    classId: string;
    academicStructureId: string;
    academicPeriodId: string;
    entryMode?: StudentAttendanceSummary["entryMode"];
    totals?: StudentAttendanceTotals;
    note?: string | null;
  },
): Promise<StudentAttendanceSummary> {
  const totals =
    input.totals ??
    await calculateStudentSummary(
      input.studentId,
      input.academicPeriodId,
    );

  const existing = (
    await db.studentAttendanceSummaries
      .where("studentId")
      .equals(input.studentId)
      .toArray()
  ).find(
    (item) =>
      !item.isDeleted &&
      item.academicPeriodId === input.academicPeriodId,
  );

  const now = context.now ?? Date.now();

  if (existing) {
    const patch: Partial<StudentAttendanceSummary> = {
      classId: input.classId,
      academicStructureId: input.academicStructureId,
      academicPeriodId: input.academicPeriodId,
      entryMode: input.entryMode ?? "calculated",
      daysPresent: totals.daysPresent,
      daysOpened: totals.daysOpened,
      daysAbsent: totals.daysAbsent,
      timesLate: totals.timesLate,
      attendancePercent: totals.attendancePercent,
      sourceAttendanceUpdatedAt: now,
      calculatedAt:
        (input.entryMode ?? "calculated") === "calculated"
          ? now
          : existing.calculatedAt,
      manuallyUpdatedAt:
        input.entryMode === "manual"
          ? now
          : existing.manuallyUpdatedAt,
      note: input.note ?? existing.note,
      ...touchAttendanceSyncRecord(
        existing,
        { ...context, now },
      ),
    };

    await db.studentAttendanceSummaries.update(
      existing.id,
      patch,
    );

    return {
      ...existing,
      ...patch,
    } as StudentAttendanceSummary;
  }

  const summary: StudentAttendanceSummary = {
    ...newAttendanceSyncRecord({ ...context, now }),
    schoolId: context.schoolId,
    branchId: context.branchId ?? "",
    studentId: input.studentId,
    classId: input.classId,
    academicStructureId: input.academicStructureId,
    academicPeriodId: input.academicPeriodId,
    entryMode: input.entryMode ?? "calculated",
    daysPresent: totals.daysPresent,
    daysOpened: totals.daysOpened,
    daysAbsent: totals.daysAbsent,
    timesLate: totals.timesLate,
    attendancePercent: totals.attendancePercent,
    sourceAttendanceUpdatedAt: now,
    calculatedAt:
      (input.entryMode ?? "calculated") === "calculated"
        ? now
        : undefined,
    manuallyUpdatedAt:
      input.entryMode === "manual"
        ? now
        : undefined,
    note: input.note ?? undefined,
  };

  await db.studentAttendanceSummaries.add(summary);
  return summary;
}

export async function rebuildClassAttendanceSummaries(
  context: IdentityMutationContext,
  input: {
    classId: string;
    academicStructureId: string;
    academicPeriodId: string;
    studentIds: readonly string[];
  },
): Promise<StudentAttendanceSummary[]> {
  const summaries: StudentAttendanceSummary[] = [];

  for (const studentId of input.studentIds) {
    summaries.push(
      await upsertStudentAttendanceSummary(context, {
        studentId,
        classId: input.classId,
        academicStructureId:
          input.academicStructureId,
        academicPeriodId:
          input.academicPeriodId,
      }),
    );
  }

  return summaries;
}
