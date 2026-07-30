"use client";

import type { CSSProperties } from "react";
import type {
  AttendanceSessionStatus as AttendanceSessionStatusValue,
} from "../../../lib/attendance";
import {
  ATTENDANCE_SESSION_STATUS_LABELS,
  attendanceToneStyles,
} from "../shared";

export interface AttendanceSessionStatusProps {
  status: AttendanceSessionStatusValue;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function AttendanceSessionStatus({
  status,
  compact = true,
  className,
  style,
}: AttendanceSessionStatusProps) {
  const tone = attendanceToneStyles(
    status === "open"
      ? "success"
      : status === "cancelled"
        ? "danger"
        : "muted",
  );

  return (
    <span
      className={className}
      style={{
        minHeight: compact ? 23 : 28,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: compact ? "2px 7px" : "4px 9px",
        borderRadius: 999,
        border: `1px solid ${tone.borderColor}`,
        background: tone.background,
        color: tone.color,
        fontSize: compact ? 10 : 11,
        fontWeight: 800,
        ...style,
      }}
    >
      <span aria-hidden="true">
        {status === "open"
          ? "●"
          : status === "closed"
            ? "■"
            : "×"}
      </span>
      {ATTENDANCE_SESSION_STATUS_LABELS[status]}
    </span>
  );
}

export default AttendanceSessionStatus;
