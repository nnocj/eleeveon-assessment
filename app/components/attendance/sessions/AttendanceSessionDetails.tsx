"use client";

import type { CSSProperties, ReactNode } from "react";
import type {
  AttendanceSession,
} from "../../../lib/attendance";
import { EntityDetailsSheet } from "../../shared";
import { AttendanceSessionHeader } from "./AttendanceSessionHeader";

export interface AttendanceSessionDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: AttendanceSession | null;
  actions?: ReactNode;
  children?: ReactNode;
}

export function AttendanceSessionDetails({
  open,
  onOpenChange,
  session,
  actions,
  children,
}: AttendanceSessionDetailsProps) {
  if (!session) return null;

  return (
    <EntityDetailsSheet
      open={open}
      onOpenChange={onOpenChange}
      title={session.name ?? "Attendance session"}
      subtitle={`${session.date} · ${session.scopeType.replaceAll("_", " ")}`}
      width={470}
      actions={actions}
    >
      <AttendanceSessionHeader
        session={session}
      />

      <dl
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(120px, .8fr) minmax(0, 1.2fr)",
          gap: "9px 12px",
          margin: "20px 0 0",
          fontSize: 12,
        }}
      >
        <dt style={termStyle}>Class</dt>
        <dd style={definitionStyle}>
          {session.classId ?? "Not assigned"}
        </dd>
        <dt style={termStyle}>Teacher</dt>
        <dd style={definitionStyle}>
          {session.teacherId ?? "Not assigned"}
        </dd>
        <dt style={termStyle}>Academic period</dt>
        <dd style={definitionStyle}>
          {session.academicPeriodId ?? "Not assigned"}
        </dd>
        <dt style={termStyle}>Opened</dt>
        <dd style={definitionStyle}>
          {session.openedAt
            ? new Date(
                session.openedAt,
              ).toLocaleString()
            : "Not opened"}
        </dd>
        <dt style={termStyle}>Closed</dt>
        <dd style={definitionStyle}>
          {session.closedAt
            ? new Date(
                session.closedAt,
              ).toLocaleString()
            : "Not closed"}
        </dd>
      </dl>

      {children ? (
        <div style={{ marginTop: 20 }}>{children}</div>
      ) : null}
    </EntityDetailsSheet>
  );
}

const termStyle: CSSProperties = {
  fontWeight: 800,
  color: "var(--muted-foreground, #64748b)",
};

const definitionStyle: CSSProperties = {
  margin: 0,
  overflowWrap: "anywhere",
};

export default AttendanceSessionDetails;
