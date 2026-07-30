import type {
  Attendance,
  AttendanceBreakdown,
  AttendanceTrendPoint,
} from "./types";
import {
  ATTENDANCE_ABSENT_STATUSES,
  ATTENDANCE_NEUTRAL_STATUSES,
  ATTENDANCE_PRESENT_STATUSES,
} from "./constants";

export function buildAttendanceBreakdown(
  records: readonly Attendance[],
): AttendanceBreakdown {
  const active = records.filter(
    (item) => !item.isDeleted,
  );

  const byStatus: Record<string, number> = {};
  let presentEquivalent = 0;
  let absentEquivalent = 0;
  let denominator = 0;

  for (const record of active) {
    byStatus[record.status] =
      (byStatus[record.status] ?? 0) + 1;

    if (ATTENDANCE_PRESENT_STATUSES.has(record.status)) {
      presentEquivalent += 1;
    }

    if (ATTENDANCE_ABSENT_STATUSES.has(record.status)) {
      absentEquivalent += 1;
    }

    if (!ATTENDANCE_NEUTRAL_STATUSES.has(record.status)) {
      denominator += 1;
    }
  }

  return {
    total: active.length,
    byStatus,
    presentEquivalent,
    absentEquivalent,
    attendancePercent:
      denominator > 0
        ? (presentEquivalent / denominator) * 100
        : 0,
  };
}

export function buildAttendanceTrend(
  records: readonly Attendance[],
): AttendanceTrendPoint[] {
  const byDate = new Map<string, Attendance[]>();

  for (const record of records) {
    if (record.isDeleted) continue;
    const current =
      byDate.get(record.date) ?? [];
    current.push(record);
    byDate.set(record.date, current);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => {
      const breakdown =
        buildAttendanceBreakdown(items);

      return {
        date,
        present:
          breakdown.byStatus.present ?? 0,
        absent:
          breakdown.byStatus.absent ?? 0,
        late:
          breakdown.byStatus.late ?? 0,
        excused:
          breakdown.byStatus.excused ?? 0,
        total: breakdown.total,
        attendancePercent:
          breakdown.attendancePercent,
      };
    });
}

export function studentAttendanceRiskLevel(
  attendancePercent: number,
): "good" | "watch" | "at_risk" {
  if (attendancePercent >= 90) return "good";
  if (attendancePercent >= 75) return "watch";
  return "at_risk";
}
