"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ATTENDANCE_STATUSES,
  DEFAULT_ATTENDANCE_STATUS,
  type Attendance,
  type AttendanceSession,
  type AttendanceStatus,
} from "../../../lib/attendance";
import { ResponsiveDataView } from "../../shared";
import { AttendanceCardEntry } from "./AttendanceCardEntry";
import { AttendanceEntryHeader } from "./AttendanceEntryHeader";
import { AttendanceEntryToolbar } from "./AttendanceEntryToolbar";
import { AttendanceTableEntry } from "./AttendanceTableEntry";
import { BulkAttendanceActions } from "./BulkAttendanceActions";
import type {
  AttendanceDraft,
  AttendanceEntryChange,
  AttendanceEntrySummary,
  AttendanceEntryViewMode,
  AttendanceStudent,
} from "./types";

export interface AttendanceEntryProps {
  students: readonly AttendanceStudent[];
  records: readonly Attendance[];
  date: string;
  onDateChange?: (date: string) => void;
  session?: AttendanceSession | null;
  defaultStatus?: AttendanceStatus;
  statusOptions?: readonly AttendanceStatus[];
  initialViewMode?: AttendanceEntryViewMode;
  editable?: boolean;
  loading?: boolean;
  saving?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  showNotes?: boolean;
  enableSelection?: boolean;
  primaryAction?: ReactNode;
  filterAction?: ReactNode;
  moreAction?: ReactNode;
  onChange?: (
    changes: readonly AttendanceEntryChange[],
    summary: AttendanceEntrySummary,
  ) => void;
  saveMode?: "changes" | "all";
  onSave?: (
    entries: readonly AttendanceEntryChange[],
  ) => void | Promise<void>;
}

function buildDrafts(
  students: readonly AttendanceStudent[],
  records: readonly Attendance[],
  defaultStatus: AttendanceStatus,
): Map<string, AttendanceDraft> {
  const recordMap = new Map(
    records
      .filter((record) => !record.isDeleted)
      .map((record) => [record.studentId, record]),
  );

  return new Map(
    students.map((student) => {
      const record = recordMap.get(student.id);
      return [
        student.id,
        {
          studentId: student.id,
          status: record?.status ?? defaultStatus,
          note: record?.note ?? null,
          dirty: false,
        },
      ];
    }),
  );
}

function summarize(
  drafts: ReadonlyMap<string, AttendanceDraft>,
  records: ReadonlyMap<string, Attendance>,
): AttendanceEntrySummary {
  const byStatus: Record<string, number> = {};
  let changed = 0;

  for (const draft of drafts.values()) {
    byStatus[draft.status] =
      (byStatus[draft.status] ?? 0) + 1;
    if (draft.dirty) changed += 1;
  }

  return {
    total: drafts.size,
    entered: records.size,
    unentered: Math.max(0, drafts.size - records.size),
    changed,
    byStatus,
  };
}

export function AttendanceEntry({
  students,
  records,
  date,
  onDateChange,
  session,
  defaultStatus = DEFAULT_ATTENDANCE_STATUS,
  statusOptions = ATTENDANCE_STATUSES,
  initialViewMode = "cards",
  editable = true,
  loading = false,
  saving = false,
  title,
  subtitle,
  showNotes = false,
  enableSelection = true,
  primaryAction,
  filterAction,
  moreAction,
  onChange,
  saveMode = "changes",
  onSave,
}: AttendanceEntryProps) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] =
    useState<AttendanceEntryViewMode>(
      initialViewMode,
    );
  const [drafts, setDrafts] = useState<
    Map<string, AttendanceDraft>
  >(() => buildDrafts(students, records, defaultStatus));
  const [selectedIds, setSelectedIds] = useState<
    Set<string>
  >(() => new Set());

  const attendanceByStudentId = useMemo(
    () =>
      new Map(
        records
          .filter((record) => !record.isDeleted)
          .map((record) => [
            record.studentId,
            record,
          ]),
      ),
    [records],
  );

  useEffect(() => {
    setDrafts(
      buildDrafts(students, records, defaultStatus),
    );
    setSelectedIds(new Set());
  }, [date, defaultStatus, records, students]);

  const filteredStudents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return students;

    return students.filter((student) =>
      [
        student.name,
        student.studentId,
        student.admissionNumber,
        student.className,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [query, students]);

  const changes = useMemo<AttendanceEntryChange[]>(
    () =>
      students.flatMap((student) => {
        const draft = drafts.get(student.id);
        if (!draft?.dirty) return [];
        return [
          {
            student,
            attendance:
              attendanceByStudentId.get(student.id),
            draft,
          },
        ];
      }),
    [attendanceByStudentId, drafts, students],
  );

  const summary = useMemo(
    () => summarize(drafts, attendanceByStudentId),
    [attendanceByStudentId, drafts],
  );

  const saveEntries = useMemo<AttendanceEntryChange[]>(
    () =>
      saveMode === "all"
        ? students.flatMap((student) => {
            const draft = drafts.get(student.id);
            if (!draft) return [];
            return [{ student, attendance: attendanceByStudentId.get(student.id), draft }];
          })
        : changes,
    [attendanceByStudentId, changes, drafts, saveMode, students],
  );

  useEffect(() => {
    onChange?.(changes, summary);
  }, [changes, onChange, summary]);

  const updateDraft = (
    studentId: string,
    patch: Partial<AttendanceDraft>,
  ) => {
    setDrafts((current) => {
      const next = new Map(current);
      const previous = next.get(studentId);
      if (!previous) return current;

      const record = attendanceByStudentId.get(studentId);
      const updated = { ...previous, ...patch };

      updated.dirty =
        updated.status !==
          (record?.status ?? defaultStatus) ||
        (updated.note ?? "") !==
          (record?.note ?? "");

      next.set(studentId, updated);
      return next;
    });
  };

  const setSelected = (
    studentId: string,
    selected: boolean,
  ) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) next.add(studentId);
      else next.delete(studentId);
      return next;
    });
  };

  const applyBulkStatus = (
    status: AttendanceStatus,
  ) => {
    setDrafts((current) => {
      const next = new Map(current);
      for (const studentId of selectedIds) {
        const previous = next.get(studentId);
        if (!previous) continue;
        const record =
          attendanceByStudentId.get(studentId);
        next.set(studentId, {
          ...previous,
          status,
          dirty:
            status !==
              (record?.status ?? defaultStatus) ||
            (previous.note ?? "") !==
              (record?.note ?? ""),
        });
      }
      return next;
    });
  };

  const saveAction =
    onSave && saveEntries.length > 0 ? (
      <button
        type="button"
        disabled={!editable || saving}
        onClick={() => void onSave(saveEntries)}
        style={{
          minHeight: 36,
          padding: "0 11px",
          border: 0,
          borderRadius: 10,
          background: "var(--primary, #2563eb)",
          color: "#fff",
          font: "inherit",
          fontSize: 12,
          fontWeight: 800,
          cursor:
            !editable || saving
              ? "not-allowed"
              : "pointer",
          opacity: !editable || saving ? 0.6 : 1,
        }}
      >
        {saving
          ? "Saving..."
          : `Save ${saveEntries.length}`}
      </button>
    ) : (
      primaryAction
    );

  return (
    <section style={{ display: "grid", gap: 11 }}>
      <AttendanceEntryHeader
        title={title}
        subtitle={subtitle}
        date={date}
        session={session}
        studentCount={students.length}
        enteredCount={summary.entered}
        changedCount={summary.changed}
      />

      <AttendanceEntryToolbar
        query={query}
        onQueryChange={setQuery}
        date={date}
        onDateChange={onDateChange ?? (() => undefined)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        resultCount={filteredStudents.length}
        primaryAction={saveAction}
        filterAction={filterAction}
        moreAction={moreAction}
        disabled={!editable}
      />

      <ResponsiveDataView
        mode={viewMode}
        loading={loading}
        empty={!filteredStudents.length}
        cards={
          <AttendanceCardEntry
            students={filteredStudents}
            attendanceByStudentId={
              attendanceByStudentId
            }
            draftsByStudentId={drafts}
            onStatusChange={(studentId, status) =>
              updateDraft(studentId, { status })
            }
            onNoteChange={(studentId, note) =>
              updateDraft(studentId, { note })
            }
            disabled={!editable || saving}
            selectedStudentIds={
              enableSelection ? selectedIds : undefined
            }
            onStudentSelectedChange={
              enableSelection
                ? setSelected
                : undefined
            }
            statusOptions={statusOptions}
            showNotes={showNotes}
          />
        }
        table={
          <AttendanceTableEntry
            students={filteredStudents}
            attendanceByStudentId={
              attendanceByStudentId
            }
            draftsByStudentId={drafts}
            onStatusChange={(studentId, status) =>
              updateDraft(studentId, { status })
            }
            onNoteChange={(studentId, note) =>
              updateDraft(studentId, { note })
            }
            disabled={!editable || saving}
            selectedStudentIds={
              enableSelection ? selectedIds : undefined
            }
            onStudentSelectedChange={
              enableSelection
                ? setSelected
                : undefined
            }
            onSelectAll={
              enableSelection
                ? (selected) =>
                    setSelectedIds(
                      selected
                        ? new Set(
                            filteredStudents.map(
                              (student) => student.id,
                            ),
                          )
                        : new Set(),
                    )
                : undefined
            }
            statusOptions={statusOptions}
            showNotes={showNotes}
          />
        }
      />

      {enableSelection ? (
        <BulkAttendanceActions
          selectedCount={selectedIds.size}
          onApplyStatus={applyBulkStatus}
          onClearSelection={() =>
            setSelectedIds(new Set())
          }
          disabled={!editable || saving}
          statusOptions={statusOptions}
        />
      ) : null}
    </section>
  );
}

export default AttendanceEntry;
