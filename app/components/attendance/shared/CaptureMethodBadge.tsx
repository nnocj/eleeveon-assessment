"use client";

import type { CSSProperties } from "react";
import type {
  AttendanceCaptureMethod,
} from "../../../lib/attendance";
import {
  ATTENDANCE_CAPTURE_METHOD_ICONS,
  ATTENDANCE_CAPTURE_METHOD_LABELS,
} from "./attendance-ui";

export interface CaptureMethodBadgeProps {
  method?: AttendanceCaptureMethod | null;
  compact?: boolean;
  showIcon?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function CaptureMethodBadge({
  method,
  compact = true,
  showIcon = true,
  className,
  style,
}: CaptureMethodBadgeProps) {
  if (!method) return null;

  return (
    <span
      className={className}
      title={ATTENDANCE_CAPTURE_METHOD_LABELS[method]}
      style={{
        minHeight: compact ? 23 : 28,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: compact ? "2px 7px" : "4px 9px",
        borderRadius: 999,
        border:
          "1px solid var(--border, rgba(15,23,42,.11))",
        background:
          "var(--muted, rgba(148,163,184,.13))",
        color: "var(--muted-foreground, #64748b)",
        fontSize: compact ? 10 : 11,
        fontWeight: 750,
        ...style,
      }}
    >
      {showIcon ? (
        <span aria-hidden="true">
          {ATTENDANCE_CAPTURE_METHOD_ICONS[method]}
        </span>
      ) : null}
      <span>
        {ATTENDANCE_CAPTURE_METHOD_LABELS[method]}
      </span>
    </span>
  );
}

export default CaptureMethodBadge;
