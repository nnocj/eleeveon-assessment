"use client";

import type {
  Attendance,
  AttendanceStatus,
} from "../../../lib/attendance";
import { AttendanceEntryRow } from "./AttendanceEntryRow";
import type {
  AttendanceDraft,
  AttendanceStudent,
} from "./types";

export interface AttendanceTableEntryProps {
  students: readonly AttendanceStudent[];
  attendanceByStudentId: ReadonlyMap<
    string,
    Attendance
  >;
  draftsByStudentId: ReadonlyMap<
    string,
    AttendanceDraft
  >;
  onStatusChange: (
    studentId: string,
    status: AttendanceStatus,
  ) => void;
  onNoteChange?: (
    studentId: string,
    note: string,
  ) => void;
  disabled?: boolean;
  selectedStudentIds?: ReadonlySet<string>;
  onStudentSelectedChange?: (
    studentId: string,
    selected: boolean,
  ) => void;
  onSelectAll?: (selected: boolean) => void;
  statusOptions?: readonly AttendanceStatus[];
  showNotes?: boolean;
}

export function AttendanceTableEntry({
  students,
  attendanceByStudentId,
  draftsByStudentId,
  onStatusChange,
  onNoteChange,
  disabled = false,
  selectedStudentIds,
  onStudentSelectedChange,
  onSelectAll,
  statusOptions,
  showNotes = false,
}: AttendanceTableEntryProps) {
  const allSelected =
    students.length > 0 &&
    students.every((student) =>
      selectedStudentIds?.has(student.id),
    );

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        borderRadius: 14,
        border:
          "1px solid var(--border, rgba(15,23,42,.10))",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "var(--background, #fff)",
        }}
      >
        <thead>
          <tr
            style={{
              textAlign: "left",
              borderBottom:
                "1px solid var(--border, rgba(15,23,42,.10))",
              background:
                "var(--muted, rgba(148,163,184,.07))",
            }}
          >
            {onStudentSelectedChange ? (
              <th style={{ padding: "9px 6px" }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  disabled={disabled || !students.length}
                  aria-label="Select all students"
                  onChange={(event) =>
                    onSelectAll?.(event.target.checked)
                  }
                />
              </th>
            ) : null}
            <th
              style={{
                padding: "9px 7px",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              Student ({students.length})
            </th>
            <th
              style={{
                padding: "9px 7px",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              Status
            </th>
            <th
              style={{
                padding: "9px 7px",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              Capture
            </th>
            {showNotes ? (
              <th
                style={{
                  padding: "9px 7px",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                Note
              </th>
            ) : null}
          </tr>
        </thead>

        <tbody>
          {students.map((student) => {
            const draft =
              draftsByStudentId.get(student.id);
            if (!draft) return null;

            return (
              <AttendanceEntryRow
                key={student.id}
                student={student}
                attendance={attendanceByStudentId.get(
                  student.id,
                )}
                draft={draft}
                onStatusChange={(status) =>
                  onStatusChange(student.id, status)
                }
                onNoteChange={
                  onNoteChange
                    ? (note) =>
                        onNoteChange(student.id, note)
                    : undefined
                }
                selected={
                  selectedStudentIds?.has(student.id) ??
                  false
                }
                onSelectedChange={
                  onStudentSelectedChange
                    ? (selected) =>
                        onStudentSelectedChange(
                          student.id,
                          selected,
                        )
                    : undefined
                }
                disabled={disabled}
                statusOptions={statusOptions}
                showNotes={showNotes}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AttendanceTableEntry;
