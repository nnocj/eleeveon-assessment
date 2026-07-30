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

export interface AttendanceEntryRowProps {
  student: AttendanceStudent;
  attendance?: Attendance;
  draft: AttendanceDraft;
  onStatusChange: (status: AttendanceStatus) => void;
  onNoteChange?: (note: string) => void;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  disabled?: boolean;
  statusOptions?: readonly AttendanceStatus[];
  showNotes?: boolean;
}

export function AttendanceEntryRow({
  student,
  attendance,
  draft,
  onStatusChange,
  onNoteChange,
  selected = false,
  onSelectedChange,
  disabled = false,
  statusOptions,
  showNotes = false,
}: AttendanceEntryRowProps) {
  return (
    <tr
      style={{
        background: draft.dirty
          ? "var(--warning-soft, rgba(217,119,6,.055))"
          : undefined,
      }}
    >
      {onSelectedChange ? (
        <td style={{ padding: "8px 6px" }}>
          <input
            type="checkbox"
            checked={selected}
            disabled={disabled}
            aria-label={`Select ${student.name}`}
            onChange={(event) =>
              onSelectedChange(event.target.checked)
            }
          />
        </td>
      ) : null}

      <td style={{ padding: "8px 7px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 180,
          }}
        >
          <EntityAvatar
            name={student.name}
            imageUrl={student.imageUrl}
            size="sm"
          />
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {student.name}
            </span>
            <span
              style={{
                display: "block",
                marginTop: 2,
                fontSize: 10,
                color:
                  "var(--muted-foreground, #64748b)",
              }}
            >
              {student.admissionNumber ??
                student.studentId ??
                "—"}
            </span>
          </span>
        </div>
      </td>

      <td style={{ padding: "8px 7px" }}>
        <AttendanceStatusPicker
          value={draft.status}
          onChange={onStatusChange}
          options={statusOptions}
          disabled={disabled}
          compact
          wrap={false}
        />
      </td>

      <td style={{ padding: "8px 7px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexWrap: "wrap",
          }}
        >
          <CaptureMethodBadge
            method={attendance?.captureMethod}
          />
          <AttendanceVerificationBadge
            status={attendance?.verificationStatus}
          />
        </div>
      </td>

      {showNotes ? (
        <td style={{ padding: "8px 7px" }}>
          <input
            type="text"
            value={draft.note ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onNoteChange?.(event.target.value)
            }
            placeholder="Note"
            style={{
              minWidth: 150,
              width: "100%",
              minHeight: 34,
              padding: "0 8px",
              borderRadius: 8,
              border:
                "1px solid var(--border, rgba(15,23,42,.10))",
              background: "var(--background, #fff)",
              color: "inherit",
              font: "inherit",
              fontSize: 11,
              boxSizing: "border-box",
            }}
          />
        </td>
      ) : null}
    </tr>
  );
}

export default AttendanceEntryRow;
