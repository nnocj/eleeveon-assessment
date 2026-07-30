"use client";

import type { CSSProperties } from "react";
import type {
  AttendanceVerificationStatus,
} from "../../../lib/attendance";
import {
  attendanceToneStyles,
  type AttendanceTone,
} from "./attendance-ui";

export interface AttendanceVerificationBadgeProps {
  status?: AttendanceVerificationStatus | null;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

const VERIFICATION_LABELS: Record<
  AttendanceVerificationStatus,
  string
> = {
  verified: "Verified",
  pending: "Pending",
  rejected: "Rejected",
  overridden: "Overridden",
};

const VERIFICATION_ICONS: Record<
  AttendanceVerificationStatus,
  string
> = {
  verified: "✓",
  pending: "◷",
  rejected: "×",
  overridden: "↺",
};

function verificationTone(
  status: AttendanceVerificationStatus,
): AttendanceTone {
  switch (status) {
    case "verified":
      return "success";

    case "pending":
      return "warning";

    case "rejected":
      return "danger";

    case "overridden":
      return "info";

  }
}

export function AttendanceVerificationBadge({
  status,
  compact = true,
  className,
  style,
}: AttendanceVerificationBadgeProps) {
  const normalized: AttendanceVerificationStatus =
    status ?? "pending";

  const tone = attendanceToneStyles(
    verificationTone(normalized),
  );

  return (
    <span
      className={className}
      title={VERIFICATION_LABELS[normalized]}
      style={{
        minHeight: compact ? 23 : 28,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: compact
          ? "2px 7px"
          : "4px 9px",
        borderRadius: 999,
        border: `1px solid ${tone.borderColor}`,
        background: tone.background,
        color: tone.color,
        fontSize: compact ? 10 : 11,
        fontWeight: 800,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span aria-hidden="true">
        {VERIFICATION_ICONS[normalized]}
      </span>

      <span>
        {VERIFICATION_LABELS[normalized]}
      </span>
    </span>
  );
}

export default AttendanceVerificationBadge;
