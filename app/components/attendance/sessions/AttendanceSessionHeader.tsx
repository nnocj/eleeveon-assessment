"use client";

import type { ReactNode } from "react";
import type {
  AttendanceSession,
} from "../../../lib/attendance";
import { AttendanceStatusBadge } from "../shared";
import { AttendanceSessionStatus } from "./AttendanceSessionStatus";

export interface AttendanceSessionHeaderProps {
  session: AttendanceSession;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function AttendanceSessionHeader({
  session,
  title,
  subtitle,
  actions,
}: AttendanceSessionHeaderProps) {
  const defaultStatus =
    session.defaultStatus ?? "present";

  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 180,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 850,
            }}
          >
            {title ??
              session.name ??
              "Attendance session"}
          </h2>

          <AttendanceSessionStatus
            status={session.status}
          />

          <AttendanceStatusBadge
            status={defaultStatus}
          />
        </div>

        <div
          style={{
            marginTop: 5,
            display: "flex",
            gap: 9,
            flexWrap: "wrap",
            fontSize: 11,
            color:
              "var(--muted-foreground, #64748b)",
          }}
        >
          <span>{session.date}</span>

          <span>
            Late after{" "}
            {session.lateAfterMinute ?? 15} min
          </span>

          <span>
            Absent after{" "}
            {session.absentAfterMinute ?? 60} min
          </span>
        </div>

        {subtitle ? (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color:
                "var(--muted-foreground, #64748b)",
            }}
          >
            {subtitle}
          </div>
        ) : null}
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

export default AttendanceSessionHeader;
