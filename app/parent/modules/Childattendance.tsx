"use client";

/**
 * app/parent/modules/ChildAttendance.tsx
 * --------------------------------------------------------------------------
 * ELEEVEON CHILD ATTENDANCE — PARENT PORTAL
 *
 * Read-only attendance experience for parents and guardians.
 * - resolves the signed-in parent from the active membership;
 * - shows only children linked through studentParents;
 * - supports daily history, term summaries and compact analytics;
 * - follows the Eleeveon compact toolbar / cards / table standard;
 * - remains offline-first by reading directly from Dexie.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAccount } from "../../context/account-context";
import { useSettings } from "../../context/settings-context";
import { useActiveBranch } from "../../context/active-branch-context";
import { useActiveMembership } from "../../context/active-membership-context";

import {
  db,
  type AcademicPeriod,
  type AcademicStructure,
  type Attendance,
  type AttendanceStatus,
  type Class,
  type Parent,
  type Student,
  type StudentAttendanceSummary,
  type StudentEnrollment,
  type StudentParent,
} from "../../lib/db/db";

import { useDataRevision } from "../../hooks/useDataRevision";
import { useBackgroundLoader } from "../../hooks/useBackgroundLoader";
import { useEntityMediaUrls } from "../../hooks/useEntityMediaUrls";

type ViewMode = "cards" | "table" | "analytics";
type StatusFilter = "all" | AttendanceStatus;
type TenantRow = {
  accountId?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
  isDeleted?: boolean;
  active?: boolean;
  status?: string | null;
};
type WorkspaceSession = {
  membership?: Record<string, unknown> | null;
  schoolId?: string | null;
  branchId?: string | null;
};
type AttendanceDay = {
  id: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  className: string;
  periodName: string;
};
type ChildView = {
  student: Student;
  id: string;
  name: string;
  admissionNumber: string;
  className: string;
  photo?: string;
};

const OPEN_WORKSPACE_KEY = "eleeveon_open_workspace";
const idOf = (value: unknown) =>
  value === undefined || value === null ? "" : String(value).trim();
const sameId = (a: unknown, b: unknown) => idOf(a) === idOf(b);
const tableSafe = (name: string) => (db as any)[name];

function storageValue(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.localStorage.getItem(key) ||
      window.sessionStorage.getItem(key)
    );
  } catch {
    return null;
  }
}

function storedJson<T>(key: string): T | null {
  const raw = storageValue(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function firstId(...values: unknown[]) {
  for (const value of values) {
    const id = idOf(value);
    if (id && id !== "0") return id;
  }
  return "";
}

function isActive(row: TenantRow) {
  const status = String(row.status || "").toLowerCase();
  return (
    !row.isDeleted &&
    row.active !== false &&
    !["inactive", "deleted", "archived", "suspended"].includes(status)
  );
}

function safePhoto(value: unknown) {
  const url = String(value || "");
  return !url || url.startsWith("blob:") ? undefined : url;
}

function toDateValue(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const date = toDateValue(value);
  if (!date) return value || "—";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function monthLabel(value: string) {
  const date = toDateValue(`${value}-01`);
  if (!date) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(status: AttendanceStatus) {
  return String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusIcon(status: AttendanceStatus) {
  if (status === "present") return "✓";
  if (status === "late") return "◷";
  if (status === "absent") return "×";
  if (["excused", "medical"].includes(status)) return "+";
  if (["trip", "sports", "remote"].includes(status)) return "↗";
  if (status === "holiday") return "—";
  return "•";
}

function statusGroup(status: AttendanceStatus) {
  if (status === "present") return "positive";
  if (status === "absent" || status === "suspended") return "negative";
  if (status === "late") return "warning";
  if (["excused", "medical", "sports", "trip", "remote"].includes(status)) {
    return "info";
  }
  return "neutral";
}

function initialRange(period?: AcademicPeriod) {
  if (period?.startDate || period?.endDate) {
    return {
      from: period.startDate || "",
      to: period.endDate || "",
    };
  }

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export default function ChildAttendance() {
  const router = useRouter();
  const revision = useDataRevision();
  const { loading, setLoading } = useBackgroundLoader();
  const { accountId, authenticated, loading: accountLoading } = useAccount();
  const { settings, loading: settingsLoading } = useSettings();
  const {
    activeSchool,
    activeSchoolId,
    activeBranch,
    activeBranchId,
    loading: contextLoading,
  } = useActiveBranch();
  const { activeMembership } = useActiveMembership();

  const openWorkspace = useMemo(
    () => storedJson<WorkspaceSession>(OPEN_WORKSPACE_KEY),
    [],
  );
  const storedMembership = useMemo(
    () => storedJson<Record<string, unknown>>("activeMembership"),
    [],
  );
  const membership = (
    openWorkspace?.membership || activeMembership || storedMembership || {}
  ) as Record<string, unknown>;

  const schoolId = firstId(
    openWorkspace?.schoolId,
    membership.schoolId,
    (membership.school as { id?: unknown } | undefined)?.id,
    activeSchoolId,
    (activeSchool as { id?: unknown } | null)?.id,
    (settings as { schoolId?: unknown } | null)?.schoolId,
    storageValue("activeSchoolId"),
  );
  const branchId = firstId(
    openWorkspace?.branchId,
    membership.branchId,
    membership.schoolBranchId,
    (membership.branch as { id?: unknown } | undefined)?.id,
    activeBranchId,
    (activeBranch as { id?: unknown } | null)?.id,
    (settings as { branchId?: unknown } | null)?.branchId,
    storageValue("activeBranchId"),
  );
  const parentId = firstId(
    membership.parentId,
    membership.parentLocalId,
    (membership.parent as { id?: unknown } | undefined)?.id,
    storageValue("activeParentId"),
  );

  const role = String(membership.role || "").toLowerCase();
  const permissionValues = useMemo(() => {
    const raw = membership.permissions;
    if (Array.isArray(raw)) return raw.map(String);
    if (raw && typeof raw === "object") {
      return Object.entries(raw)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([key]) => key);
    }
    return [];
  }, [membership.permissions]);
  const canView =
    role === "parent" ||
    permissionValues.some((permission) =>
      [
        "attendance.view",
        "attendance.read",
        "child_attendance.view",
        "parent.attendance.view",
      ].includes(permission),
    );

  const primary = settings?.primaryColor || "var(--primary-color, #2563eb)";

  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentParents, setStudentParents] = useState<StudentParent[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [structures, setStructures] = useState<AcademicStructure[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<Attendance[]>([]);
  const [summaryRows, setSummaryRows] = useState<StudentAttendanceSummary[]>([]);

  const [childId, setChildId] = useState("");
  const [structureId, setStructureId] = useState(
    String(settings?.currentAcademicStructureId || ""),
  );
  const [periodId, setPeriodId] = useState(
    String(settings?.currentAcademicPeriodId || ""),
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const mediaByStudentId = useEntityMediaUrls({
    accountId,
    ownerTable: "students",
    rows: students,
    fields: [
      { fieldKey: "photo", mediaIdKey: "photoMediaId" },
      { fieldKey: "coverPhoto", mediaIdKey: "coverPhotoMediaId" },
    ],
  });

  const sameTenant = (row: TenantRow) =>
    (!row.accountId || row.accountId === accountId) &&
    (!row.schoolId || sameId(row.schoolId, schoolId)) &&
    (!row.branchId || sameId(row.branchId, branchId)) &&
    !row.isDeleted;

  const clearData = () => {
    setParents([]);
    setStudents([]);
    setStudentParents([]);
    setClasses([]);
    setStructures([]);
    setPeriods([]);
    setEnrollments([]);
    setAttendanceRows([]);
    setSummaryRows([]);
  };

  const load = async () => {
    if (!authenticated || !accountId || !schoolId || !branchId || !canView) {
      clearData();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [
        parentRows,
        studentRows,
        linkRows,
        classRows,
        structureRows,
        periodRows,
        enrollmentRows,
        attendanceData,
        summaryData,
      ] = await Promise.all([
        tableSafe("parents")?.toArray?.() || [],
        tableSafe("students")?.toArray?.() || [],
        tableSafe("studentParents")?.toArray?.() || [],
        tableSafe("classes")?.toArray?.() || [],
        tableSafe("academicStructures")?.toArray?.() || [],
        tableSafe("academicPeriods")?.toArray?.() || [],
        tableSafe("studentEnrollments")?.toArray?.() || [],
        tableSafe("attendance")?.toArray?.() || [],
        tableSafe("studentAttendanceSummaries")?.toArray?.() || [],
      ]);

      setParents((parentRows as Parent[]).filter((row: any) => sameTenant(row)));
      setStudents(
        (studentRows as Student[])
          .filter(
            (row: any) =>
              sameTenant(row) &&
              !["withdrawn", "graduated"].includes(
                String(row.status || "").toLowerCase(),
              ),
          )
          .sort((a, b) => a.fullName.localeCompare(b.fullName)),
      );
      setStudentParents(
        (linkRows as StudentParent[]).filter((row: any) => sameTenant(row)),
      );
      setClasses(
        (classRows as Class[])
          .filter((row: any) => sameTenant(row) && isActive(row))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setStructures(
        (structureRows as AcademicStructure[])
          .filter((row: any) => sameTenant(row) && isActive(row))
          .sort((a, b) => b.startDate.localeCompare(a.startDate)),
      );
      setPeriods(
        (periodRows as AcademicPeriod[])
          .filter((row: any) => sameTenant(row) && isActive(row))
          .sort((a, b) => Number(a.order || 0) - Number(b.order || 0)),
      );
      setEnrollments(
        (enrollmentRows as StudentEnrollment[]).filter((row: any) =>
          sameTenant(row),
        ),
      );
      setAttendanceRows(
        (attendanceData as Attendance[]).filter((row: any) => sameTenant(row)),
      );
      setSummaryRows(
        (summaryData as StudentAttendanceSummary[]).filter((row: any) =>
          sameTenant(row),
        ),
      );
    } catch (error) {
      console.error("Failed to load child attendance:", error);
      clearData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountLoading || contextLoading) return;
    if (!authenticated || !accountId) router.replace("/login");
    else if (!schoolId || !branchId) router.replace("/account");
  }, [
    accountLoading,
    contextLoading,
    authenticated,
    accountId,
    schoolId,
    branchId,
    router,
  ]);

  useEffect(() => {
    if (accountLoading || settingsLoading || contextLoading) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authenticated,
    accountId,
    schoolId,
    branchId,
    accountLoading,
    settingsLoading,
    contextLoading,
    revision,
    canView,
  ]);

  const classMap = useMemo(
    () => new Map(classes.map((row) => [idOf(row.id), row])),
    [classes],
  );
  const structureMap = useMemo(
    () => new Map(structures.map((row) => [idOf(row.id), row])),
    [structures],
  );
  const periodMap = useMemo(
    () => new Map(periods.map((row) => [idOf(row.id), row])),
    [periods],
  );

  const resolvedParentId = useMemo(() => {
    if (parentId) return parentId;
    const membershipEmail = String(
      membership.email ||
        (membership.user as { email?: unknown } | undefined)?.email ||
        "",
    ).toLowerCase();
    const membershipPhone = String(
      membership.phone ||
        (membership.user as { phone?: unknown } | undefined)?.phone ||
        "",
    ).replace(/\s+/g, "");

    const match = parents.find((parent) => {
      const email = String(parent.email || "").toLowerCase();
      const phone = String(parent.phone || "").replace(/\s+/g, "");
      return (
        (membershipEmail && email === membershipEmail) ||
        (membershipPhone && phone === membershipPhone)
      );
    });
    return idOf(match?.id);
  }, [parentId, membership, parents]);

  const children = useMemo<ChildView[]>(() => {
    if (!resolvedParentId) return [];
    const linkedIds = new Set(
      studentParents
        .filter((link) => sameId(link.parentId, resolvedParentId))
        .map((link) => idOf(link.studentId)),
    );

    return students
      .filter((student) => linkedIds.has(idOf(student.id)))
      .map((student) => {
        const studentId = idOf(student.id);
        const activeEnrollment = enrollments.find(
          (row) => sameId(row.studentId, studentId) && row.status === "active",
        );
        const classIdValue =
          idOf(activeEnrollment?.classId) || idOf(student.currentClassId);
        return {
          student,
          id: studentId,
          name: student.fullName || "Unnamed child",
          admissionNumber: student.admissionNumber || "No admission number",
          className: classMap.get(classIdValue)?.name || "Class not assigned",
          photo:
            mediaByStudentId[studentId]?.photo || safePhoto(student.photo),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    resolvedParentId,
    studentParents,
    students,
    enrollments,
    classMap,
    mediaByStudentId,
  ]);

  useEffect(() => {
    if (!childId && children.length) setChildId(children[0].id);
    if (childId && !children.some((child) => child.id === childId)) {
      setChildId(children[0]?.id || "");
    }
  }, [children, childId]);

  useEffect(() => {
    if (!structureId && settings?.currentAcademicStructureId) {
      setStructureId(String(settings.currentAcademicStructureId));
    }
    if (!periodId && settings?.currentAcademicPeriodId) {
      setPeriodId(String(settings.currentAcademicPeriodId));
    }
  }, [
    structureId,
    periodId,
    settings?.currentAcademicStructureId,
    settings?.currentAcademicPeriodId,
  ]);

  const filteredPeriods = useMemo(
    () =>
      structureId
        ? periods.filter((row) =>
            sameId(row.academicStructureId, structureId),
          )
        : periods,
    [periods, structureId],
  );

  useEffect(() => {
    if (periodId && !filteredPeriods.some((row) => sameId(row.id, periodId))) {
      setPeriodId(filteredPeriods[0] ? idOf(filteredPeriods[0].id) : "");
    }
  }, [filteredPeriods, periodId]);

  useEffect(() => {
    const range = initialRange(periodMap.get(periodId));
    setDateFrom(range.from);
    setDateTo(range.to);
  }, [periodId, periodMap]);

  const selectedChild = children.find((child) => child.id === childId);
  const selectedStructure = structureMap.get(structureId);
  const selectedPeriod = periodMap.get(periodId);

  const attendanceHistory = useMemo<AttendanceDay[]>(() => {
    if (!childId) return [];
    const query = search.trim().toLowerCase();

    return attendanceRows
      .filter((row) => {
        if (row.isDeleted || !sameId(row.studentId, childId)) return false;
        if (structureId && !sameId(row.academicStructureId, structureId)) {
          return false;
        }
        if (periodId && !sameId(row.academicPeriodId, periodId)) return false;
        if (dateFrom && row.date < dateFrom) return false;
        if (dateTo && row.date > dateTo) return false;
        if (statusFilter !== "all" && row.status !== statusFilter) return false;
        if (!query) return true;
        return `${row.date} ${statusLabel(row.status)} ${row.note || ""}`
          .toLowerCase()
          .includes(query);
      })
      .map((row) => ({
        id: idOf(row.id),
        date: row.date,
        status: row.status,
        note: row.note,
        className: classMap.get(idOf(row.classId))?.name || "Class",
        periodName: periodMap.get(idOf(row.academicPeriodId))?.name || "Period",
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [
    childId,
    attendanceRows,
    structureId,
    periodId,
    dateFrom,
    dateTo,
    statusFilter,
    search,
    classMap,
    periodMap,
  ]);

  const termSummary = useMemo(() => {
    const rows = summaryRows.filter(
      (row) =>
        !row.isDeleted &&
        sameId(row.studentId, childId) &&
        (!structureId || sameId(row.academicStructureId, structureId)) &&
        (!periodId || sameId(row.academicPeriodId, periodId)),
    );

    if (!rows.length) return null;
    const opened = rows.reduce((sum, row) => sum + Number(row.daysOpened || 0), 0);
    const present = rows.reduce(
      (sum, row) => sum + Number(row.daysPresent || 0),
      0,
    );
    const absent = rows.reduce(
      (sum, row) => sum + Number(row.daysAbsent || 0),
      0,
    );
    const late = rows.reduce((sum, row) => sum + Number(row.timesLate || 0), 0);

    return {
      opened,
      present,
      absent,
      late,
      percent: opened ? Math.round((present / opened) * 100) : 0,
      note: rows.find((row) => row.note)?.note,
    };
  }, [summaryRows, childId, structureId, periodId]);

  const computedSummary = useMemo(() => {
    const count = (status: AttendanceStatus) =>
      attendanceHistory.filter((row) => row.status === status).length;
    const present = count("present");
    const absent = count("absent");
    const late = count("late");
    const excused = attendanceHistory.filter((row) =>
      ["excused", "medical", "sports", "trip"].includes(row.status),
    ).length;
    const attended = present + late + count("remote");
    const countedDays = attendanceHistory.filter(
      (row) => row.status !== "holiday",
    ).length;

    return {
      total: attendanceHistory.length,
      present,
      absent,
      late,
      excused,
      rate: countedDays ? Math.round((attended / countedDays) * 100) : 0,
    };
  }, [attendanceHistory]);

  const monthlyStats = useMemo(() => {
    const map = new Map<
      string,
      { month: string; total: number; attended: number; absent: number; late: number }
    >();

    attendanceHistory.forEach((row) => {
      const key = monthKey(row.date);
      const current = map.get(key) || {
        month: key,
        total: 0,
        attended: 0,
        absent: 0,
        late: 0,
      };
      if (row.status !== "holiday") current.total += 1;
      if (["present", "late", "remote"].includes(row.status)) {
        current.attended += 1;
      }
      if (row.status === "absent") current.absent += 1;
      if (row.status === "late") current.late += 1;
      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [attendanceHistory]);

  const activeFilterCount = [
    childId,
    structureId,
    periodId,
    dateFrom,
    dateTo,
    statusFilter !== "all" ? statusFilter : "",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setStructureId(String(settings?.currentAcademicStructureId || ""));
    setPeriodId(String(settings?.currentAcademicPeriodId || ""));
    setStatusFilter("all");
    setSearch("");
    const range = initialRange(periodMap.get(periodId));
    setDateFrom(range.from);
    setDateTo(range.to);
  };

  const loadingContext = accountLoading || settingsLoading || contextLoading;

  if (loadingContext || loading) {
    return (
      <div className="attendance-page loading-page">
        <div className="spinner" />
        <span>Loading attendance…</span>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!canView) {
    return (
      <div
        className="attendance-page empty-page"
        style={{ "--primary": primary } as React.CSSProperties}
      >
        <div className="empty-icon">!</div>
        <h2>Attendance unavailable</h2>
        <p>Your parent account does not currently have access to attendance.</p>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div
      className="attendance-page"
      style={{ "--primary": primary } as React.CSSProperties}
    >
        <div className="toolbar">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search dates, status or notes…"
              aria-label="Search attendance"
            />
            {search ? (
              <button className="clear-search" onClick={() => setSearch("")} aria-label="Clear search">
                ×
              </button>
            ) : null}
          </div>
          <button
            className={`icon-button ${filterOpen ? "active" : ""}`}
            onClick={() => setFilterOpen(true)}
            aria-label="Attendance filters"
          >
            ☷
            {activeFilterCount ? <span className="button-badge">{activeFilterCount}</span> : null}
          </button>
          <button className="icon-button" onClick={() => setMoreOpen(true)} aria-label="More options">
            ⋯
          </button>
        </div>

        {children.length > 1 ? (
          <div className="child-strip" aria-label="Choose child">
            {children.map((child) => (
              <button
                key={child.id}
                className={`child-chip ${child.id === childId ? "selected" : ""}`}
                onClick={() => setChildId(child.id)}
              >
                <span className="mini-avatar">
                  {child.photo ? <img src={child.photo} alt="" /> : child.name.charAt(0).toUpperCase()}
                </span>
                <span>
                  <strong>{child.name}</strong>
                  <small>{child.className}</small>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {selectedChild ? (
          <section className="child-header">
            <div className="child-avatar">
              {selectedChild.photo ? (
                <img src={selectedChild.photo} alt={selectedChild.name} />
              ) : (
                selectedChild.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="child-copy">
              <div className="child-name-row">
                <h1>{selectedChild.name}</h1>
                <button className="sync-dot" onClick={() => setStatusOpen(true)} aria-label="Data status" />
              </div>
              <p>{selectedChild.admissionNumber} · {selectedChild.className}</p>
              <div className="context-line">
                <span>{selectedStructure?.name || "Academic year"}</span>
                <i>•</i>
                <span>{selectedPeriod?.name || "All periods"}</span>
              </div>
            </div>
            <div className={`rate-ring ${computedSummary.rate >= 75 ? "good" : computedSummary.rate >= 50 ? "fair" : "low"}`}>
              <strong>{termSummary?.percent ?? computedSummary.rate}%</strong>
              <small>attendance</small>
            </div>
          </section>
        ) : null}

        {selectedChild ? (
          <div className="summary-grid">
            <article className="summary-card">
              <span className="summary-mark positive">✓</span>
              <div><strong>{termSummary?.present ?? computedSummary.present}</strong><small>Present</small></div>
            </article>
            <article className="summary-card">
              <span className="summary-mark negative">×</span>
              <div><strong>{termSummary?.absent ?? computedSummary.absent}</strong><small>Absent</small></div>
            </article>
            <article className="summary-card">
              <span className="summary-mark warning">◷</span>
              <div><strong>{termSummary?.late ?? computedSummary.late}</strong><small>Late</small></div>
            </article>
            <article className="summary-card">
              <span className="summary-mark info">+</span>
              <div><strong>{computedSummary.excused}</strong><small>Excused</small></div>
            </article>
          </div>
        ) : null}

        {!resolvedParentId ? (
          <div className="empty-state">
            <div className="empty-icon">⌁</div>
            <h2>Parent profile not linked</h2>
            <p>This login needs a parentId or parentLocalId on its active membership.</p>
          </div>
        ) : !children.length ? (
          <div className="empty-state">
            <div className="empty-icon">♧</div>
            <h2>No linked children</h2>
            <p>No active student-parent relationship was found for this parent profile.</p>
          </div>
        ) : viewMode === "analytics" ? (
          <section className="analytics-view">
            <div className="analytics-card overview-card">
              <div>
                <span>Attendance rate</span>
                <strong>{termSummary?.percent ?? computedSummary.rate}%</strong>
                <small>{termSummary?.opened ?? computedSummary.total} recorded school days</small>
              </div>
              <div className="donut" style={{ "--value": `${termSummary?.percent ?? computedSummary.rate}%` } as React.CSSProperties}>
                <span>{termSummary?.percent ?? computedSummary.rate}%</span>
              </div>
            </div>

            <div className="analytics-card">
              <div className="section-heading">
                <div><strong>Monthly pattern</strong><small>Based on the selected range</small></div>
              </div>
              {monthlyStats.length ? (
                <div className="month-list">
                  {monthlyStats.map((month) => {
                    const rate = month.total ? Math.round((month.attended / month.total) * 100) : 0;
                    return (
                      <div className="month-row" key={month.month}>
                        <div><strong>{monthLabel(month.month)}</strong><small>{month.absent} absent · {month.late} late</small></div>
                        <div className="month-progress"><span style={{ width: `${rate}%` }} /></div>
                        <b>{rate}%</b>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted-empty">No monthly attendance records match the filters.</p>
              )}
            </div>

            {termSummary?.note ? (
              <div className="analytics-card note-card"><strong>School note</strong><p>{termSummary.note}</p></div>
            ) : null}
          </section>
        ) : attendanceHistory.length ? (
          viewMode === "table" ? (
            <div className="table-shell">
              <div className="table-title"><strong>Attendance history ({attendanceHistory.length})</strong></div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Date</th><th>Status</th><th>Class</th><th>Note</th></tr></thead>
                  <tbody>
                    {attendanceHistory.map((row) => (
                      <tr key={row.id || `${row.date}-${row.status}`}>
                        <td>{formatDate(row.date)}</td>
                        <td><span className={`status-pill ${statusGroup(row.status)}`}>{statusLabel(row.status)}</span></td>
                        <td>{row.className}</td>
                        <td>{row.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="attendance-list">
              {attendanceHistory.map((row) => (
                <article className="attendance-card" key={row.id || `${row.date}-${row.status}`}>
                  <div className={`status-symbol ${statusGroup(row.status)}`}>{statusIcon(row.status)}</div>
                  <div className="attendance-main">
                    <div className="attendance-topline">
                      <strong>{formatDate(row.date, { weekday: "short", day: "2-digit", month: "short" })}</strong>
                      <span className={`status-pill ${statusGroup(row.status)}`}>{statusLabel(row.status)}</span>
                    </div>
                    <p>{row.className} · {row.periodName}</p>
                    {row.note ? <small className="attendance-note">{row.note}</small> : null}
                  </div>
                </article>
              ))}
            </div>
          )
        ) : selectedChild ? (
          <div className="empty-state compact-empty">
            <div className="empty-icon">○</div>
            <h2>No attendance records</h2>
            <p>Try another period, date range or attendance status.</p>
            <button className="primary-button" onClick={resetFilters}>Reset filters</button>
          </div>
        ) : null}

        {filterOpen ? (
          <div className="sheet-layer" role="presentation" onMouseDown={() => setFilterOpen(false)}>
            <aside className="sheet" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
              <div className="sheet-head"><div><strong>Attendance filters</strong><small>Choose the child and reporting period</small></div><button onClick={() => setFilterOpen(false)}>×</button></div>
              <div className="sheet-body">
                <label><span>Child</span><select value={childId} onChange={(event) => setChildId(event.target.value)}>{children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}</select></label>
                <label><span>Academic structure</span><select value={structureId} onChange={(event) => { setStructureId(event.target.value); setPeriodId(""); }}><option value="">All structures</option>{structures.map((row) => <option key={idOf(row.id)} value={idOf(row.id)}>{row.name}</option>)}</select></label>
                <label><span>Academic period</span><select value={periodId} onChange={(event) => setPeriodId(event.target.value)}><option value="">All periods</option>{filteredPeriods.map((row) => <option key={idOf(row.id)} value={idOf(row.id)}>{row.name}</option>)}</select></label>
                <div className="two-column"><label><span>From</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label><span>To</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label></div>
                <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">All statuses</option>{(["present", "absent", "late", "excused", "medical", "sports", "trip", "holiday", "remote", "suspended"] as AttendanceStatus[]).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>
              </div>
              <div className="sheet-actions"><button className="secondary-button" onClick={resetFilters}>Reset</button><button className="primary-button" onClick={() => setFilterOpen(false)}>Apply</button></div>
            </aside>
          </div>
        ) : null}

        {moreOpen ? (
          <div className="sheet-layer" role="presentation" onMouseDown={() => setMoreOpen(false)}>
            <aside className="sheet short-sheet" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
              <div className="sheet-head"><div><strong>View options</strong><small>Change how attendance is displayed</small></div><button onClick={() => setMoreOpen(false)}>×</button></div>
              <div className="view-options">
                {(["cards", "table", "analytics"] as ViewMode[]).map((mode) => (
                  <button key={mode} className={viewMode === mode ? "selected" : ""} onClick={() => { setViewMode(mode); setMoreOpen(false); }}><span>{mode === "cards" ? "▤" : mode === "table" ? "▦" : "⌁"}</span><div><strong>{mode.charAt(0).toUpperCase() + mode.slice(1)}</strong><small>{mode === "cards" ? "Mobile-friendly history" : mode === "table" ? "Compact detailed rows" : "Rates and monthly pattern"}</small></div>{viewMode === mode ? <b>✓</b> : null}</button>
                ))}
              </div>
            </aside>
          </div>
        ) : null}

        {statusOpen ? (
          <div className="sheet-layer" role="presentation" onMouseDown={() => setStatusOpen(false)}>
            <aside className="sheet short-sheet" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
              <div className="sheet-head"><div><strong>Attendance data</strong><small>Offline-first parent view</small></div><button onClick={() => setStatusOpen(false)}>×</button></div>
              <div className="status-panel"><span className="large-dot" /><div><strong>Available on this device</strong><p>Attendance is read from the latest local school data. New records appear after synchronization.</p></div></div>
            </aside>
          </div>
        ) : null}

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .attendance-page{--surface:var(--card-background,#fff);--border:var(--border-color,#e5e7eb);--text:var(--text-color,#111827);--muted:var(--muted-color,#6b7280);--soft:var(--soft-background,#f8fafc);min-height:100%;color:var(--text);padding:10px 12px 34px;background:var(--page-background,transparent)}
  .loading-page,.empty-page{display:grid;place-items:center;align-content:center;gap:10px;min-height:55vh;text-align:center}.spinner{width:28px;height:28px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
  .toolbar{display:grid;grid-template-columns:minmax(0,1fr) 40px 40px;gap:7px;position:sticky;top:0;z-index:15;padding:4px 0 10px;background:var(--page-background,var(--surface))}.search-box{height:40px;display:flex;align-items:center;gap:8px;padding:0 10px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}.search-box input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--text);font:inherit;font-size:13px}.search-icon{font-size:21px;color:var(--muted)}.clear-search{border:0;background:transparent;color:var(--muted);font-size:20px}.icon-button{position:relative;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);font-size:21px;cursor:pointer}.icon-button.active{border-color:var(--primary);color:var(--primary)}.button-badge{position:absolute;right:-4px;top:-5px;min-width:17px;height:17px;padding:0 4px;display:grid;place-items:center;border-radius:10px;background:var(--primary);color:#fff;font-size:9px;font-weight:800}
  .child-strip{display:flex;gap:7px;overflow:auto;padding:1px 0 9px;scrollbar-width:none}.child-strip::-webkit-scrollbar{display:none}.child-chip{flex:0 0 auto;display:flex;align-items:center;gap:7px;padding:6px 9px 6px 6px;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);text-align:left}.child-chip.selected{border-color:var(--primary);box-shadow:0 0 0 1px color-mix(in srgb,var(--primary) 25%,transparent)}.child-chip strong,.child-chip small{display:block}.child-chip strong{font-size:11px}.child-chip small{font-size:9px;color:var(--muted);margin-top:1px}.mini-avatar{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;overflow:hidden;background:color-mix(in srgb,var(--primary) 13%,var(--soft));color:var(--primary);font-size:12px;font-weight:800}.mini-avatar img,.child-avatar img{width:100%;height:100%;object-fit:cover}
  .child-header{display:grid;grid-template-columns:52px minmax(0,1fr) auto;align-items:center;gap:10px;padding:12px;border:1px solid var(--border);border-radius:16px;background:var(--surface)}.child-avatar{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;overflow:hidden;background:color-mix(in srgb,var(--primary) 14%,var(--soft));color:var(--primary);font-size:20px;font-weight:900}.child-copy{min-width:0}.child-name-row{display:flex;align-items:center;gap:7px}.child-copy h1{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px}.child-copy p{margin:3px 0 0;color:var(--muted);font-size:10px}.context-line{display:flex;align-items:center;gap:5px;margin-top:5px;color:var(--muted);font-size:9px}.context-line i{font-style:normal}.sync-dot{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px color-mix(in srgb,#22c55e 15%,transparent)}.rate-ring{width:60px;height:60px;border-radius:50%;display:grid;place-content:center;text-align:center;border:5px solid #d1d5db;background:var(--surface)}.rate-ring.good{border-color:#22c55e}.rate-ring.fair{border-color:#f59e0b}.rate-ring.low{border-color:#ef4444}.rate-ring strong{font-size:14px}.rate-ring small{font-size:7px;color:var(--muted)}
  .summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:8px 0}.summary-card{display:flex;align-items:center;gap:7px;min-width:0;padding:9px;border:1px solid var(--border);border-radius:13px;background:var(--surface)}.summary-mark{width:26px;height:26px;flex:0 0 auto;display:grid;place-items:center;border-radius:8px;font-weight:900}.positive{background:color-mix(in srgb,#22c55e 13%,var(--surface));color:#15803d}.negative{background:color-mix(in srgb,#ef4444 13%,var(--surface));color:#dc2626}.warning{background:color-mix(in srgb,#f59e0b 15%,var(--surface));color:#b45309}.info{background:color-mix(in srgb,#3b82f6 13%,var(--surface));color:#2563eb}.neutral{background:var(--soft);color:var(--muted)}.summary-card strong,.summary-card small{display:block}.summary-card strong{font-size:14px}.summary-card small{font-size:8px;color:var(--muted);white-space:nowrap}
  .attendance-list{display:grid;gap:7px}.attendance-card{display:flex;gap:9px;padding:10px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}.status-symbol{width:34px;height:34px;flex:0 0 auto;display:grid;place-items:center;border-radius:10px;font-size:16px;font-weight:900}.attendance-main{flex:1;min-width:0}.attendance-topline{display:flex;justify-content:space-between;align-items:center;gap:8px}.attendance-topline strong{font-size:12px}.status-pill{display:inline-flex;align-items:center;justify-content:center;padding:3px 7px;border-radius:999px;font-size:8px;font-weight:800;white-space:nowrap}.attendance-main p{margin:4px 0 0;font-size:9px;color:var(--muted)}.attendance-note{display:block;margin-top:6px;padding-top:6px;border-top:1px dashed var(--border);font-size:9px;color:var(--text)}
  .table-shell{overflow:hidden;border:1px solid var(--border);border-radius:14px;background:var(--surface)}.table-title{padding:10px 12px;border-bottom:1px solid var(--border);font-size:11px}.table-scroll{overflow:auto}table{width:100%;border-collapse:collapse;min-width:570px}th,td{padding:9px 11px;border-bottom:1px solid var(--border);text-align:left;font-size:10px}th{position:sticky;top:0;background:var(--soft);color:var(--muted);font-size:9px;text-transform:uppercase;letter-spacing:.04em}tbody tr:last-child td{border-bottom:0}
  .analytics-view{display:grid;gap:8px}.analytics-card{padding:12px;border:1px solid var(--border);border-radius:15px;background:var(--surface)}.overview-card{display:flex;align-items:center;justify-content:space-between}.overview-card span,.overview-card strong,.overview-card small{display:block}.overview-card span{font-size:10px;color:var(--muted)}.overview-card strong{margin-top:2px;font-size:25px}.overview-card small{font-size:9px;color:var(--muted)}.donut{width:76px;height:76px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--primary) var(--value),var(--border) 0);position:relative}.donut:after{content:"";position:absolute;inset:8px;border-radius:50%;background:var(--surface)}.donut span{position:relative;z-index:1;font-size:12px;font-weight:900}.section-heading strong,.section-heading small{display:block}.section-heading strong{font-size:12px}.section-heading small{margin-top:2px;font-size:9px;color:var(--muted)}.month-list{display:grid;gap:11px;margin-top:13px}.month-row{display:grid;grid-template-columns:105px minmax(80px,1fr) 34px;align-items:center;gap:9px}.month-row strong,.month-row small{display:block}.month-row strong{font-size:10px}.month-row small{font-size:8px;color:var(--muted);margin-top:2px}.month-progress{height:6px;border-radius:10px;background:var(--border);overflow:hidden}.month-progress span{display:block;height:100%;border-radius:inherit;background:var(--primary)}.month-row b{font-size:10px;text-align:right}.note-card strong{font-size:11px}.note-card p{margin:6px 0 0;font-size:10px;line-height:1.55;color:var(--muted)}.muted-empty{margin:13px 0 0;color:var(--muted);font-size:10px}
  .empty-state{display:grid;justify-items:center;text-align:center;padding:44px 18px;border:1px dashed var(--border);border-radius:16px;background:var(--surface)}.compact-empty{margin-top:8px}.empty-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--primary) 11%,var(--soft));color:var(--primary);font-size:20px;font-weight:900}.empty-state h2,.empty-page h2{margin:10px 0 3px;font-size:14px}.empty-state p,.empty-page p{max-width:380px;margin:0;color:var(--muted);font-size:10px;line-height:1.55}
  .sheet-layer{position:fixed;inset:0;z-index:1000;display:flex;justify-content:flex-end;background:rgba(15,23,42,.38);backdrop-filter:blur(2px)}.sheet{width:min(410px,94vw);height:100%;display:flex;flex-direction:column;background:var(--surface);box-shadow:-16px 0 40px rgba(0,0,0,.16)}.short-sheet{height:auto;max-height:78vh;align-self:flex-end;border-radius:20px 0 0 0}.sheet-head{display:flex;align-items:center;justify-content:space-between;padding:15px;border-bottom:1px solid var(--border)}.sheet-head strong,.sheet-head small{display:block}.sheet-head strong{font-size:13px}.sheet-head small{margin-top:2px;font-size:9px;color:var(--muted)}.sheet-head button{width:32px;height:32px;border:1px solid var(--border);border-radius:10px;background:var(--soft);color:var(--text);font-size:19px}.sheet-body{flex:1;overflow:auto;display:grid;align-content:start;gap:12px;padding:15px}.sheet-body label>span{display:block;margin-bottom:5px;color:var(--muted);font-size:9px;font-weight:700}.sheet-body input,.sheet-body select{width:100%;height:40px;padding:0 10px;border:1px solid var(--border);border-radius:11px;outline:0;background:var(--surface);color:var(--text);font:inherit;font-size:11px}.sheet-body input:focus,.sheet-body select:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 12%,transparent)}.two-column{display:grid;grid-template-columns:1fr 1fr;gap:9px}.sheet-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 15px;border-top:1px solid var(--border)}.primary-button,.secondary-button{height:39px;border-radius:11px;font-weight:800;font-size:10px}.primary-button{border:1px solid var(--primary);background:var(--primary);color:#fff}.secondary-button{border:1px solid var(--border);background:var(--surface);color:var(--text)}.empty-state .primary-button{margin-top:12px;padding:0 16px}
  .view-options{display:grid;gap:7px;padding:12px}.view-options button{display:grid;grid-template-columns:34px minmax(0,1fr) 20px;align-items:center;gap:9px;padding:10px;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);text-align:left}.view-options button.selected{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 6%,var(--surface))}.view-options button>span{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:var(--soft);font-size:17px}.view-options strong,.view-options small{display:block}.view-options strong{font-size:11px}.view-options small{margin-top:2px;font-size:9px;color:var(--muted)}.view-options b{color:var(--primary)}.status-panel{display:flex;gap:11px;padding:16px}.large-dot{width:14px;height:14px;flex:0 0 auto;margin-top:2px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 5px color-mix(in srgb,#22c55e 14%,transparent)}.status-panel strong{font-size:11px}.status-panel p{margin:5px 0 0;color:var(--muted);font-size:9px;line-height:1.55}
  @media(max-width:700px){.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.short-sheet{width:100%;border-radius:20px 20px 0 0}.sheet-layer{align-items:flex-end}.child-header{grid-template-columns:48px minmax(0,1fr) auto}.child-avatar{width:48px;height:48px}.rate-ring{width:54px;height:54px}.attendance-page{padding-inline:9px}.month-row{grid-template-columns:90px minmax(70px,1fr) 32px}}
  @media(min-width:900px){.attendance-page{max-width:1120px;margin:0 auto;padding-top:14px}.attendance-list{grid-template-columns:repeat(2,minmax(0,1fr))}.summary-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.analytics-view{grid-template-columns:1fr 1fr}.overview-card,.note-card{grid-column:span 1}.sheet{width:430px}.short-sheet{height:100%;max-height:none;align-self:stretch;border-radius:0}}
`;