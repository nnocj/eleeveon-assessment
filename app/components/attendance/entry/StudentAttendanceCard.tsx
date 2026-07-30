"use client";

import type {
  Attendance,
  AttendanceStatus,
} from "../../../lib/attendance";
import { EntityAvatar } from "../../shared";
import {
  AttendanceStatusPicker,
  AttendanceVerificationBadge,
  CaptureMethodBadge,
} from "../shared";
import type {
  AttendanceDraft,
  AttendanceStudent,
} from "./types";

export interface StudentAttendanceCardProps {
  student: AttendanceStudent;
  attendance?: Attendance;
  draft: AttendanceDraft;
  onStatusChange: (status: AttendanceStatus) => void;
  onNoteChange?: (note: string) => void;
  disabled?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  statusOptions?: readonly AttendanceStatus[];
  showNote?: boolean;
}

export function StudentAttendanceCard({
  student,
  attendance,
  draft,
  onStatusChange,
  onNoteChange,
  disabled = false,
  selected = false,
  onSelectedChange,
  statusOptions,
  showNote = false,
}: StudentAttendanceCardProps) {
  return (
    <article
      style={{
        display: "grid",
        gap: 10,
        padding: 11,
        borderRadius: 14,
        border: draft.dirty
          ? "1px solid var(--warning-border, rgba(217,119,6,.34))"
          : "1px solid var(--border, rgba(15,23,42,.10))",
        background: "var(--background, #fff)",
        boxShadow: "0 1px 3px rgba(15,23,42,.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          minWidth: 0,
        }}
      >
        {onSelectedChange ? (
          <input
            type="checkbox"
            checked={selected}
            disabled={disabled}
            aria-label={`Select ${student.name}`}
            onChange={(event) =>
              onSelectedChange(event.target.checked)
            }
          />
        ) : null}

        <EntityAvatar
          name={student.name}
          imageUrl={student.imageUrl}
          size="md"
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 850,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {student.name}
          </div>
          <div
            style={{
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              gap: 7,
              flexWrap: "wrap",
              fontSize: 10,
              color:
                "var(--muted-foreground, #64748b)",
            }}
          >
            {student.admissionNumber ||
            student.studentId ? (
              <span>
                {student.admissionNumber ??
                  student.studentId}
              </span>
            ) : null}
            {student.className ? (
              <span>{student.className}</span>
            ) : null}
            {draft.dirty ? (
              <span
                style={{
                  color: "var(--warning, #b45309)",
                  fontWeight: 800,
                }}
              >
                Unsaved
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <AttendanceStatusPicker
        value={draft.status}
        onChange={onStatusChange}
        options={statusOptions}
        disabled={disabled}
        compact
      />

      {showNote && onNoteChange ? (
        <textarea
          value={draft.note ?? ""}
          disabled={disabled}
          onChange={(event) =>
            onNoteChange(event.target.value)
          }
          placeholder="Optional note..."
          rows={2}
          style={{
            width: "100%",
            minHeight: 52,
            resize: "vertical",
            padding: 8,
            borderRadius: 9,
            border:
              "1px solid var(--border, rgba(15,23,42,.11))",
            background: "var(--background, #fff)",
            color: "inherit",
            font: "inherit",
            fontSize: 11,
            boxSizing: "border-box",
          }}
        />
      ) : null}

      {attendance ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <CaptureMethodBadge
            method={attendance.captureMethod}
          />
          <AttendanceVerificationBadge
            status={attendance.verificationStatus}
          />
        </div>
      ) : null}
    </article>
  );
}

export default StudentAttendanceCard;
