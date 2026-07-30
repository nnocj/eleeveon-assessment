"use client";

import type { CSSProperties } from "react";
import {
  ATTENDANCE_STATUSES,
  type AttendanceStatus,
} from "../../../lib/attendance";
import {
  ATTENDANCE_STATUS_ICONS,
  attendanceStatusLabel,
  attendanceStatusTone,
  attendanceToneStyles,
} from "./attendance-ui";

export interface AttendanceStatusPickerProps {
  value: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  options?: readonly AttendanceStatus[];
  disabled?: boolean;
  compact?: boolean;
  showLabels?: boolean;
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

export function AttendanceStatusPicker({
  value,
  onChange,
  options = ATTENDANCE_STATUSES,
  disabled = false,
  compact = true,
  showLabels = false,
  wrap = true,
  className,
  style,
  ariaLabel = "Select attendance status",
}: AttendanceStatusPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: wrap ? "wrap" : "nowrap",
        gap: compact ? 4 : 6,
        ...style,
      }}
    >
      {options.map((status) => {
        const selected = status === value;
        const tone = attendanceToneStyles(
          attendanceStatusTone(status),
        );

        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={attendanceStatusLabel(status)}
            title={attendanceStatusLabel(status)}
            disabled={disabled}
            onClick={() => onChange(status)}
            style={{
              minWidth: compact ? 30 : 36,
              minHeight: compact ? 30 : 36,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: showLabels
                ? compact
                  ? "0 8px"
                  : "0 10px"
                : "0 7px",
              borderRadius: 9,
              border: selected
                ? `1px solid ${tone.borderColor}`
                : "1px solid var(--border, rgba(15,23,42,.10))",
              background: selected
                ? tone.background
                : "var(--background, #fff)",
              color: selected
                ? tone.color
                : "var(--muted-foreground, #64748b)",
              boxShadow: selected
                ? "0 1px 3px rgba(15,23,42,.08)"
                : "none",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.55 : 1,
              font: "inherit",
              fontSize: compact ? 11 : 12,
              fontWeight: 800,
            }}
          >
            <span aria-hidden="true">
              {ATTENDANCE_STATUS_ICONS[status]}
            </span>
            {showLabels ? (
              <span>{attendanceStatusLabel(status)}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default AttendanceStatusPicker;
