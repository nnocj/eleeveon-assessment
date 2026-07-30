"use client";

import type { ReactNode } from "react";
import type {
  AttendanceSession,
} from "../../../lib/attendance";
import { AttendanceSessionStatus } from "../sessions/AttendanceSessionStatus";

export interface AttendanceEntryHeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  date?: string;
  session?: AttendanceSession | null;
  studentCount?: number;
  enteredCount?: number;
  changedCount?: number;
  actions?: ReactNode;
}

export function AttendanceEntryHeader({
  title = "Attendance entry",
  subtitle,
  date,
  session,
  studentCount,
  enteredCount,
  changedCount,
  actions,
}: AttendanceEntryHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 180 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              lineHeight: 1.25,
              fontWeight: 850,
            }}
          >
            {title}
          </h2>
          {session ? (
            <AttendanceSessionStatus
              status={session.status}
              compact
            />
          ) : null}
        </div>

        {subtitle ? (
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color:
                "var(--muted-foreground, #64748b)",
            }}
          >
            {subtitle}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 7,
            fontSize: 11,
            color:
              "var(--muted-foreground, #64748b)",
          }}
        >
          {date ? <span>{date}</span> : null}
          {typeof studentCount === "number" ? (
            <span>{studentCount} students</span>
          ) : null}
          {typeof enteredCount === "number" ? (
            <span>{enteredCount} entered</span>
          ) : null}
          {typeof changedCount === "number" &&
          changedCount > 0 ? (
            <span
              style={{
                color: "var(--warning, #b45309)",
                fontWeight: 750,
              }}
            >
              {changedCount} unsaved
            </span>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export default AttendanceEntryHeader;
