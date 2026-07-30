"use client";

import type { ReactNode } from "react";
import type {
  AttendanceSession,
} from "../../../lib/attendance";
import { AttendanceSessionCard } from "./AttendanceSessionCard";

export interface AttendanceSessionListProps {
  sessions: readonly AttendanceSession[];
  onOpen?: (session: AttendanceSession) => void;
  onClose?: (session: AttendanceSession) => void;
  onCancel?: (session: AttendanceSession) => void;
  onView?: (session: AttendanceSession) => void;
  disabled?: boolean;
  emptyView?: ReactNode;
}

export function AttendanceSessionList({
  sessions,
  onOpen,
  onClose,
  onCancel,
  onView,
  disabled = false,
  emptyView,
}: AttendanceSessionListProps) {
  if (!sessions.length) {
    return (
      <>
        {emptyView ?? (
          <div
            style={{
              padding: 28,
              textAlign: "center",
              color:
                "var(--muted-foreground, #64748b)",
            }}
          >
            No attendance sessions found.
          </div>
        )}
      </>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
        gap: 10,
      }}
    >
      {sessions.map((session) => (
        <AttendanceSessionCard
          key={session.id}
          session={session}
          onOpen={onOpen}
          onClose={onClose}
          onCancel={onCancel}
          onView={onView}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export default AttendanceSessionList;
