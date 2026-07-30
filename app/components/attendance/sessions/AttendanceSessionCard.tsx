"use client";

import type { CSSProperties } from "react";
import type {
  AttendanceSession,
} from "../../../lib/attendance";
import { AttendanceStatusBadge } from "../shared";
import { AttendanceSessionStatus } from "./AttendanceSessionStatus";

export interface AttendanceSessionCardProps {
  session: AttendanceSession;
  onOpen?: (session: AttendanceSession) => void;
  onClose?: (session: AttendanceSession) => void;
  onCancel?: (session: AttendanceSession) => void;
  onView?: (session: AttendanceSession) => void;
  disabled?: boolean;
}

export function AttendanceSessionCard({
  session,
  onOpen,
  onClose,
  onCancel,
  onView,
  disabled = false,
}: AttendanceSessionCardProps) {
  const defaultStatus =
    session.defaultStatus ?? "present";

  return (
    <article
      style={{
        display: "grid",
        gap: 10,
        padding: 12,
        borderRadius: 14,
        border:
          "1px solid var(--border, rgba(15,23,42,.10))",
        background: "var(--background, #fff)",
        boxShadow:
          "0 1px 3px rgba(15,23,42,.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 9,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 850,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {session.name ?? "Attendance session"}
          </div>

          <div
            style={{
              marginTop: 3,
              fontSize: 11,
              color:
                "var(--muted-foreground, #64748b)",
            }}
          >
            {session.date} ·{" "}
            {session.scopeType.replaceAll("_", " ")}
          </div>
        </div>

        <AttendanceSessionStatus
          status={session.status}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <AttendanceStatusBadge
          status={defaultStatus}
        />

        <span
          style={{
            fontSize: 10,
            color:
              "var(--muted-foreground, #64748b)",
          }}
        >
          Late {session.lateAfterMinute ?? 15}m
        </span>

        <span
          style={{
            fontSize: 10,
            color:
              "var(--muted-foreground, #64748b)",
          }}
        >
          Absent {session.absentAfterMinute ?? 60}m
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {onView ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onView(session)}
            style={buttonStyle("neutral", disabled)}
          >
            View
          </button>
        ) : null}

        {session.status !== "open" && onOpen ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onOpen(session)}
            style={buttonStyle("primary", disabled)}
          >
            Open
          </button>
        ) : null}

        {session.status === "open" && onClose ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onClose(session)}
            style={buttonStyle("primary", disabled)}
          >
            Close
          </button>
        ) : null}

        {session.status !== "cancelled" &&
        onCancel ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onCancel(session)}
            style={buttonStyle("danger", disabled)}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </article>
  );
}

function buttonStyle(
  tone: "neutral" | "primary" | "danger",
  disabled: boolean,
): CSSProperties {
  return {
    minHeight: 32,
    padding: "0 9px",
    borderRadius: 8,
    border:
      tone === "neutral"
        ? "1px solid var(--border, rgba(15,23,42,.11))"
        : 0,
    background:
      tone === "primary"
        ? "var(--primary, #2563eb)"
        : tone === "danger"
          ? "var(--danger-soft, rgba(220,38,38,.10))"
          : "var(--background, #fff)",
    color:
      tone === "primary"
        ? "#fff"
        : tone === "danger"
          ? "var(--danger, #dc2626)"
          : "inherit",
    font: "inherit",
    fontSize: 11,
    fontWeight: 750,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}

export default AttendanceSessionCard;
