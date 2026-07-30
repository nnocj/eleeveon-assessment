import type { AttendanceRiskLevel, AttendanceStatusBreakdown, AttendanceTotals, StudentAttendanceRow } from "./insights-types";

export const clampPercent = (value: number) =>
  Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

export const safeNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const formatPercent = (value: number, digits = 1) =>
  `${clampPercent(value).toLocaleString("en-US", { maximumFractionDigits: digits })}%`;

export const calculateAttendancePercent = (present: number, opened: number) =>
  opened > 0 ? clampPercent((present / opened) * 100) : 0;

export function getAttendanceRiskLevel(
  attendancePercent: number,
  thresholds: { mediumBelow?: number; highBelow?: number; criticalBelow?: number } = {},
): AttendanceRiskLevel {
  const { mediumBelow = 90, highBelow = 80, criticalBelow = 70 } = thresholds;
  const value = clampPercent(attendancePercent);
  if (value < criticalBelow) return "critical";
  if (value < highBelow) return "high";
  if (value < mediumBelow) return "medium";
  return "low";
}

export const riskLabel = (level: AttendanceRiskLevel) =>
  level === "critical" ? "Critical" :
  level === "high" ? "High risk" :
  level === "medium" ? "Watch" : "Healthy";

export function sumStudentRows(rows: readonly StudentAttendanceRow[]): AttendanceTotals {
  const total = rows.reduce(
    (sum, row) => ({
      daysOpened: sum.daysOpened + safeNumber(row.daysOpened),
      daysPresent: sum.daysPresent + safeNumber(row.daysPresent),
      daysAbsent: sum.daysAbsent + safeNumber(row.daysAbsent),
      timesLate: sum.timesLate + safeNumber(row.timesLate),
    }),
    { daysOpened: 0, daysPresent: 0, daysAbsent: 0, timesLate: 0 },
  );
  return { ...total, attendancePercent: calculateAttendancePercent(total.daysPresent, total.daysOpened) };
}

export const breakdownTotal = (value: AttendanceStatusBreakdown) =>
  safeNumber(value.present) + safeNumber(value.absent) + safeNumber(value.late) + safeNumber(value.unmarked);

export const formatDateTime = (value?: string | number | Date) => {
  if (value == null) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" :
    new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export const escapeCsvCell = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
