"use client";

import type { ReactNode } from "react";
import type {
  Attendance,
  AttendanceStatus,
} from "../../../lib/attendance";
import { StudentAttendanceCard } from "./StudentAttendanceCard";
import type {
  AttendanceDraft,
  AttendanceStudent,
} from "./types";

export interface AttendanceCardEntryProps {
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
  statusOptions?: readonly AttendanceStatus[];
  showNotes?: boolean;
  emptyView?: ReactNode;
}

export function AttendanceCardEntry({
  students,
  attendanceByStudentId,
  draftsByStudentId,
  onStatusChange,
  onNoteChange,
  disabled = false,
  selectedStudentIds,
  onStudentSelectedChange,
  statusOptions,
  showNotes = false,
  emptyView,
}: AttendanceCardEntryProps) {
  if (!students.length) {
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
            No students found.
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
          "repeat(auto-fill, minmax(min(100%, 270px), 1fr))",
        gap: 10,
      }}
    >
      {students.map((student) => {
        const draft = draftsByStudentId.get(student.id);
        if (!draft) return null;

        return (
          <StudentAttendanceCard
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
            disabled={disabled}
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
            statusOptions={statusOptions}
            showNote={showNotes}
          />
        );
      })}
    </div>
  );
}

export default AttendanceCardEntry;
