"use client";

import type { CSSProperties } from "react";
import type { AttendanceStatus } from "../../../lib/attendance";
import {
  ATTENDANCE_STATUS_ICONS,
  attendanceStatusLabel,
  attendanceStatusTone,
  attendanceToneStyles,
} from "./attendance-ui";

export interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  compact?: boolean;
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function AttendanceStatusBadge({
  status,
  compact = true,
  showIcon = true,
  showLabel = true,
  className,
  style,
}: AttendanceStatusBadgeProps) {
  const tone = attendanceToneStyles(
    attendanceStatusTone(status),
  );

  return (
    <span
      className={className}
      title={attendanceStatusLabel(status)}
      style={{
        minHeight: compact ? 24 : 30,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: showLabel
          ? compact
            ? "2px 7px"
            : "4px 9px"
          : 0,
        width: showLabel ? undefined : compact ? 24 : 30,
        borderRadius: 999,
        border: `1px solid ${tone.borderColor}`,
        background: tone.background,
        color: tone.color,
        fontSize: compact ? 11 : 12,
        fontWeight: 800,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {showIcon ? (
        <span aria-hidden="true">
          {ATTENDANCE_STATUS_ICONS[status]}
        </span>
      ) : null}
      {showLabel ? (
        <span>{attendanceStatusLabel(status)}</span>
      ) : null}
    </span>
  );
}

export default AttendanceStatusBadge;
