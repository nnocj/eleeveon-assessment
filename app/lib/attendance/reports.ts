import {
  db,
  type Attendance,
  type Student,
  type StudentAttendanceSummary,
} from "../db/db";
import type {
  AttendanceReport,
  AttendanceReportRow,
  StudentAttendanceTotals,
} from "./types";
import {
  calculateStudentAttendanceTotals,
} from "./summaries";

function aggregateTotals(
  rows: readonly AttendanceReportRow[],
): StudentAttendanceTotals {
  const totals = rows.reduce(
    (acc, row) => {
      acc.daysPresent += row.daysPresent;
      acc.daysOpened += row.daysOpened;
      acc.daysAbsent += row.daysAbsent;
      acc.timesLate += row.timesLate;
      return acc;
    },
    {
      daysPresent: 0,
      daysOpened: 0,
      daysAbsent: 0,
      timesLate: 0,
      attendancePercent: 0,
    },
  );

  totals.attendancePercent =
    totals.daysOpened > 0
      ? (
          totals.daysPresent /
          totals.daysOpened
        ) * 100
      : 0;

  return totals;
}

export async function buildClassAttendanceReport(
  input: {
    schoolId: string;
    branchId: string;
    classId: string;
    academicPeriodId: string;
    generatedAt?: number;
  },
): Promise<AttendanceReport> {
  const [students, attendance, summaries] =
    await Promise.all([
      db.students
        .where("currentClassId")
        .equals(input.classId)
        .toArray(),
      db.attendance
        .where("classId")
        .equals(input.classId)
        .toArray(),
      db.studentAttendanceSummaries
        .where("classId")
        .equals(input.classId)
        .toArray(),
    ]);

  const activeStudents = students.filter(
    (student) =>
      !student.isDeleted &&
      student.schoolId === input.schoolId &&
      student.branchId === input.branchId,
  );

  const rows: AttendanceReportRow[] =
    activeStudents.map((student) => {
      const summary = summaries.find(
        (item) =>
          !item.isDeleted &&
          item.studentId === student.id &&
          item.academicPeriodId ===
            input.academicPeriodId,
      );

      const calculated =
        summary ??
        calculateStudentAttendanceTotals(
          attendance.filter(
            (item) =>
              !item.isDeleted &&
              item.studentId === student.id &&
              item.academicPeriodId ===
                input.academicPeriodId,
          ),
        );

      return {
        studentId: student.id,
        studentName: student.fullName,
        daysPresent:
          calculated.daysPresent,
        daysOpened:
          calculated.daysOpened,
        daysAbsent:
          calculated.daysAbsent,
        timesLate:
          calculated.timesLate ?? 0,
        attendancePercent:
          calculated.attendancePercent,
      };
    });

  rows.sort(
    (a, b) =>
      String(a.studentName ?? "").localeCompare(
        String(b.studentName ?? ""),
      ),
  );

  return {
    schoolId: input.schoolId,
    branchId: input.branchId,
    academicPeriodId:
      input.academicPeriodId,
    classId: input.classId,
    generatedAt:
      input.generatedAt ?? Date.now(),
    rows,
    totals: aggregateTotals(rows),
  };
}

export function attendanceReportToCsv(
  report: AttendanceReport,
): string {
  const escape = (value: unknown) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = [
    [
      "Student",
      "Days Present",
      "Days Opened",
      "Days Absent",
      "Times Late",
      "Attendance %",
    ].map(escape).join(","),
  ];

  for (const row of report.rows) {
    lines.push(
      [
        row.studentName ?? row.studentId,
        row.daysPresent,
        row.daysOpened,
        row.daysAbsent,
        row.timesLate,
        row.attendancePercent.toFixed(2),
      ].map(escape).join(","),
    );
  }

  return lines.join("\n");
}
