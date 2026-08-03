"use client";

/**
 * app/parent/modules/Parentdashboard.tsx
 * ---------------------------------------------------------
 * ELEEVEON PARENT DASHBOARD V2
 * ---------------------------------------------------------
 * Golden Standard Parent Home.
 * Parent-scoped, offline-first, mobile-first, theme-safe.
 *
 * Workspace-session aligned:
 * - Prefer the selected workspace session written by /select-role and opened
 *   by RolePortalShell.
 * - Fall back to ActiveMembershipProvider and ActiveBranchContext only if the
 *   selected workspace does not provide parentLocalId/schoolId/branchId.
 * - This prevents the parent dashboard from reading another member's children
 *   when a multi-role user switches workspaces.
 * - Parentdashboard receives NAV_SECTIONS from app/parent/page.tsx so dashboard
 *   modules always match the actual Parent Portal menu.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAccount } from "../../context/account-context";
import { useSettings } from "../../context/settings-context";
import { useActiveBranch } from "../../context/active-branch-context";
import { useActiveMembership } from "../../context/active-membership-context";
import { db } from "../../lib/db/db";
import type { RoleNavSection } from "../../components/role-portals/RolePortalShell";

type AnyRow = Record<string, any>;
type ViewMode = "cards" | "table" | "analytics";
type AreaFilter = "all" | "children" | "fees" | "communication" | "timetable" | "preferences" | "other";
type Tone = "green" | "red" | "blue" | "gray" | "orange" | "purple";

type RouteProps = {
  navigate?: (key: string) => void;
  navSections?: RoleNavSection[];
};

type DashboardModule = {
  key: string;
  label: string;
  icon: string;
  area: Exclude<AreaFilter, "all">;
  value: string | number;
  note: string;
  tone: Tone;
  routeKey: string;
};

type CountMetric = {
  value: string | number;
  note: string;
  tone: Tone;
};

const HIDDEN_DASHBOARD_KEYS = new Set(["parentDashboard"]);

const TABLE_NAMES = [
  "schools",
  "branches",
  "appUsers",
  "parents",
  "students",
  "studentParents",
  "studentEnrollments",
  "classes",
  "subjects",
  "classSubjects",
  "attendance",
  "assessmentEntries",
  "computedResults",
  "reportCards",
  "reportCardItems",
  "announcements",
  "announcementRecipients",
  "calendarEvents",
  "calendarEventParticipants",
  "messageThreads",
  "messages",
  "scheduleSessions",
  "scheduleTimetables",
  "studentFeeInvoices",
  "studentFeeInvoiceItems",
  "studentFeePayments",
  "payments",
  "portalHighlights",
  "mediaAssets",
] as const;

const OPEN_WORKSPACE_KEY = "eleeveon_open_workspace";

type OpenWorkspaceSession = {
  membership?: AnyRow | null;
  membershipId?: string | null;
  role?: string | null;
  schoolId?: number | string | null;
  branchId?: number | string | null;
  teacherLocalId?: number | string | null;
  studentLocalId?: number | string | null;
  parentLocalId?: number | string | null;
  memberName?: string | null;
  fullName?: string | null;
  userName?: string | null;
  openedAt?: number;
};

function safeRead(key: string) {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeJson<T>(key: string): T | null {
  const raw = safeRead(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readOpenWorkspaceSession(): OpenWorkspaceSession | null {
  return safeJson<OpenWorkspaceSession>(OPEN_WORKSPACE_KEY);
}

function readStoredActiveMembership(): AnyRow | null {
  return safeJson<AnyRow>("activeMembership");
}

function cleanId(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = String(value).trim();
  return parsed && parsed !== "0" ? parsed : null;
}

function firstId(...values: unknown[]): string | null {
  for (const value of values) {
    const parsed = cleanId(value);
    if (parsed) return parsed;
  }

  return null;
}

function workspaceMembership(openWorkspace?: OpenWorkspaceSession | null, activeMembership?: AnyRow | null) {
  return (
    openWorkspace?.membership ||
    activeMembership ||
    readStoredActiveMembership() ||
    null
  );
}

function selectedParentId(openWorkspace?: OpenWorkspaceSession | null, activeMembership?: AnyRow | null) {
  const membership = workspaceMembership(openWorkspace, activeMembership);

  return firstId(
    openWorkspace?.parentLocalId,
    (openWorkspace as any)?.parentId,
    (openWorkspace as any)?.membership?.parentLocalId,
    (openWorkspace as any)?.membership?.parentId,
    membership?.parentLocalId,
    membership?.localParentId,
    membership?.parentId,
    membership?.parent?.id,
    membership?.guardianLocalId,
    safeRead("activeParentId")
  );
}

function selectedSchoolId(args: {
  openWorkspace?: OpenWorkspaceSession | null;
  activeMembership?: AnyRow | null;
  activeSchoolId?: any;
  activeSchool?: AnyRow | null;
  settings?: AnyRow | null;
}) {
  const membership = workspaceMembership(args.openWorkspace, args.activeMembership);

  return firstId(
    args.openWorkspace?.schoolId,
    membership?.schoolId,
    membership?.school?.id,
    args.activeSchoolId,
    args.activeSchool?.id,
    args.settings?.schoolId,
    safeRead("activeSchoolId")
  );
}

function selectedBranchId(args: {
  openWorkspace?: OpenWorkspaceSession | null;
  activeMembership?: AnyRow | null;
  activeBranchId?: any;
  activeBranch?: AnyRow | null;
  settings?: AnyRow | null;
}) {
  const membership = workspaceMembership(args.openWorkspace, args.activeMembership);

  return firstId(
    args.openWorkspace?.branchId,
    membership?.branchId,
    membership?.schoolBranchId,
    membership?.branch?.id,
    args.activeBranchId,
    args.activeBranch?.id,
    args.settings?.branchId,
    safeRead("activeBranchId")
  );
}

function n(value: any) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: any, fallback = "") {
  return String(value || "").trim() || fallback;
}

function idOf(row?: AnyRow | null) {
  return row?.id ?? row?.localId ?? row?.cloudId ?? row?.payload?.id ?? row?.payload?.localId;
}

function sameId(a: any, b: any) {
  return String(a ?? "") === String(b ?? "");
}

function sameAccount(row: AnyRow, accountId?: string | null) {
  return row && row.isDeleted !== true && (!row.accountId || !accountId || row.accountId === accountId);
}

function scoped(row: AnyRow, args: { accountId?: string | null; schoolId?: any; branchId?: any }) {
  if (!sameAccount(row, args.accountId)) return false;
  const rowSchoolId = row.schoolId ?? row.schoolLocalId ?? row.payload?.schoolId;
  const rowBranchId = row.branchId ?? row.branchLocalId ?? row.payload?.branchId;
  if (args.schoolId && rowSchoolId && !sameId(rowSchoolId, args.schoolId)) return false;
  if (args.branchId && rowBranchId && !sameId(rowBranchId, args.branchId)) return false;
  return true;
}

function activeRow(row: AnyRow) {
  const status = String(row?.status || "").toLowerCase();
  return row?.isDeleted !== true && row?.active !== false && !["deleted", "archived", "inactive", "disabled", "withdrawn"].includes(status);
}

function rowName(row?: AnyRow | null) {
  return text(row?.fullName || row?.name || row?.title || row?.label || row?.email, "Unnamed");
}

function dateLabel(value?: number | string | null) {
  if (!value) return "Not set";
  const time = typeof value === "number" ? value : new Date(value).getTime();
  if (!Number.isFinite(time)) return "Not set";

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(time));
  } catch {
    return "Not set";
  }
}

function todayKey() {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function money(value: any, currency = "GHS") {
  const amount = n(value);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "GHS",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || "GHS"} ${amount.toLocaleString()}`;
  }
}

async function safeArray<T = AnyRow>(tableName: string): Promise<T[]> {
  const table = (db as any)[tableName];
  return table?.toArray ? table.toArray() : [];
}

function areaFromSectionTitle(title: string): Exclude<AreaFilter, "all"> {
  const value = String(title || "").toLowerCase().trim();
  if (value.includes("child")) return "children";
  if (value.includes("fee") || value.includes("payment")) return "fees";
  if (value.includes("communication") || value.includes("message") || value.includes("announcement")) return "communication";
  if (value.includes("calendar") || value.includes("timetable")) return "timetable";
  if (value.includes("preference") || value.includes("profile") || value.includes("setting")) return "preferences";
  return "other";
}

function areaLabel(area: string) {
  const labels: Record<string, string> = {
    all: "All areas",
    children: "My Children",
    fees: "Fees & Payments",
    communication: "Communication",
    timetable: "Timetable",
    preferences: "Preferences",
    other: "Other",
  };
  return labels[area] || area;
}

function statusTone(status?: string): Tone {
  const value = String(status || "").toLowerCase();
  if (["active", "paid", "present", "submitted", "completed", "published", "succeeded", "success"].includes(value)) return "green";
  if (["failed", "overdue", "cancelled", "absent", "withdrawn"].includes(value)) return "red";
  if (["pending", "processing", "draft", "late", "partial"].includes(value)) return "orange";
  if (["scheduled", "issued", "promoted"].includes(value)) return "blue";
  return "gray";
}

function count(rows: AnyRow[]) {
  return rows.filter(activeRow).length;
}

function uniqueCount(rows: AnyRow[], key: string) {
  return new Set(rows.filter(activeRow).map((row) => row[key]).filter((value) => value !== undefined && value !== null && value !== "")).size;
}

function sum(rows: AnyRow[], field: string) {
  return rows.filter(activeRow).reduce((total, row) => total + n(row[field]), 0);
}

function Chip({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`pd-chip ${tone}`}>{children}</span>;
}

function SliderIcon() {
  return (
    <svg className="pd-slider-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h9" />
      <path d="M17 7h3" />
      <circle cx="15" cy="7" r="2" />
      <path d="M4 17h3" />
      <path d="M11 17h9" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}

function Empty({ title, text: body }: { title: string; text: string }) {
  return (
    <section className="pd-empty">
      <div>👨‍👩‍👧</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </section>
  );
}

function buildNavModules(navSections?: RoleNavSection[]): Omit<DashboardModule, "value" | "note" | "tone">[] {
  const unique = new Map<string, Omit<DashboardModule, "value" | "note" | "tone">>();

  (navSections || []).forEach((section) => {
    const area = areaFromSectionTitle(section.title);

    section.items.forEach((item) => {
      if (HIDDEN_DASHBOARD_KEYS.has(item.key)) return;
      if (unique.has(item.key)) return;

      unique.set(item.key, {
        key: item.key,
        label: item.label,
        icon: item.icon,
        area,
        routeKey: item.key,
      });
    });
  });

  return [...unique.values()];
}

function metricFor(routeKey: string, rows: Record<string, AnyRow[]>, summary: AnyRow): CountMetric {
  const metricMap: Record<string, CountMetric> = {
    children: {
      value: summary.children,
      note: `${summary.enrollments} enrollment record(s) across your children.`,
      tone: summary.children ? "green" : "orange",
    },
    childAttendance: {
      value: summary.presentToday || summary.attendance,
      note: `${summary.todayAttendance} attendance record(s) today, ${summary.absent} absent/excused total.`,
      tone: summary.absent ? "orange" : summary.attendance ? "green" : "gray",
    },
    childResults: {
      value: summary.averageScore ? `${summary.averageScore}%` : summary.results,
      note: `${summary.results} computed result record(s) available.`,
      tone: summary.results ? "blue" : "gray",
    },
    childFees: {
      value: summary.feeBalance ? money(summary.feeBalance, summary.currencyCode) : summary.invoices,
      note: `${summary.invoices} invoice(s), ${summary.payments} payment record(s).`,
      tone: summary.feeBalance ? "orange" : summary.invoices ? "green" : "gray",
    },
    payments: {
      value: summary.payments,
      note: `${money(summary.paidTotal, summary.currencyCode)} total payment record value.`,
      tone: summary.payments ? "green" : "gray",
    },
    announcements: {
      value: summary.announcements,
      note: "School and branch announcements visible to parents.",
      tone: summary.announcements ? "blue" : "gray",
    },
    messages: {
      value: summary.messages,
      note: "Parent conversations and school communication threads.",
      tone: summary.messages ? "green" : "gray",
    },
    calendar: {
      value: summary.events,
      note: "Academic events and school calendar items.",
      tone: summary.events ? "blue" : "gray",
    },
    childTimetable: {
      value: summary.sessions,
      note: "Timetable sessions connected to your children’s classes.",
      tone: summary.sessions ? "purple" : "gray",
    },
    localSettings: {
      value: "Open",
      note: "Device display preferences only; branch branding stays protected.",
      tone: "gray",
    },
    parentProfile: {
      value: "Open",
      note: "Parent identity, contact details and account profile.",
      tone: "purple",
    },
  };

  if (metricMap[routeKey]) return metricMap[routeKey];

  const guessedRows = rows[routeKey] || [];
  if (guessedRows.length) {
    return { value: count(guessedRows), note: "Auto-counted from matching local table.", tone: count(guessedRows) ? "green" : "gray" };
  }

  return { value: "Open", note: "Module is listed from Parent navigation. Add a metric mapping when data is ready.", tone: "gray" };
}


export default function Parentdashboard({ navigate, navSections }: RouteProps) {
  const router = useRouter();
  const { accountId, authenticated, loading: accountLoading } = useAccount();
  const { settings, loading: settingsLoading } = useSettings();
  const {
    activeSchoolId,
    activeBranchId,
    activeSchool,
    activeBranch,
  } = useActiveBranch();
  const { activeParentId, activeMembership } = useActiveMembership();

  const primary =
    settings?.primaryColor || "var(--primary-color,#2563eb)";
  const openWorkspace = useMemo(() => readOpenWorkspaceSession(), []);

  const schoolId = selectedSchoolId({
    openWorkspace,
    activeMembership,
    activeSchoolId,
    activeSchool,
    settings: settings as AnyRow,
  });

  const branchId = selectedBranchId({
    openWorkspace,
    activeMembership,
    activeBranchId,
    activeBranch,
    settings: settings as AnyRow,
  });

  const parentId =
    selectedParentId(openWorkspace, activeMembership) ||
    cleanId(activeParentId);

  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [rowsByTable, setRowsByTable] = useState<Record<string, AnyRow[]>>({});

  useEffect(() => {
    if (accountLoading) return;
    if (!authenticated || !accountId) router.replace("/login");
  }, [accountLoading, authenticated, accountId, router]);

  async function load() {
    if (!authenticated || !accountId) {
      setRowsByTable({});
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const loaded = await Promise.all(
        TABLE_NAMES.map(async (tableName) => {
          const tableRows = await safeArray(tableName);
          return [
            tableName,
            tableRows.filter((row) =>
              scoped(row, { accountId, schoolId, branchId }),
            ),
          ] as const;
        }),
      );

      setRowsByTable(Object.fromEntries(loaded));
    } catch (error) {
      console.error("Failed to load parent dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accountLoading || settingsLoading) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authenticated,
    accountId,
    schoolId,
    branchId,
    parentId,
    accountLoading,
    settingsLoading,
  ]);

  const rows = rowsByTable;

  const identity = useMemo(() => {
    const membership = workspaceMembership(openWorkspace, activeMembership);
    const storedUser =
      safeJson<AnyRow>("currentUser") ||
      safeJson<AnyRow>("authUser") ||
      safeJson<AnyRow>("user");

    const branchRows = (rows.branches || []).filter(activeRow);
    const schoolRows = (rows.schools || []).filter(activeRow);
    const parentRows = (rows.parents || []).filter(activeRow);

    const branch =
      branchRows.find((row) => sameId(idOf(row), branchId)) ||
      (activeBranch as AnyRow) ||
      membership?.branch ||
      branchRows[0] ||
      null;

    const resolvedSchoolId =
      cleanId(branch?.schoolId) || schoolId || null;

    const school =
      schoolRows.find((row) => sameId(idOf(row), resolvedSchoolId)) ||
      (activeSchool as AnyRow) ||
      membership?.school ||
      schoolRows[0] ||
      null;

    const membershipParentId = firstId(
      parentId,
      membership?.parentLocalId,
      membership?.parentId,
      membership?.parent?.id,
      activeParentId,
      safeRead("activeParentId"),
    );

    const parent =
      parentRows.find((row) => sameId(idOf(row), membershipParentId)) ||
      parentRows.find((row) =>
        sameId(
          row.email || row.parentEmail,
          membership?.email || membership?.parentEmail,
        ),
      ) ||
      null;

    const userId = firstId(
      membership?.userId,
      membership?.appUserId,
      storedUser?.id,
    );

    const appUser =
      (rows.appUsers || []).find((row) => sameId(idOf(row), userId)) ||
      storedUser ||
      membership?.user ||
      membership?.appUser ||
      null;

    return {
      parent,
      branch,
      school,
      parentName: text(
        parent?.fullName ||
          parent?.name ||
          appUser?.fullName ||
          appUser?.name ||
          openWorkspace?.fullName ||
          openWorkspace?.userName ||
          openWorkspace?.memberName ||
          membership?.fullName ||
          membership?.name,
        "Parent",
      ),
      schoolName: text(
        school?.name ||
          membership?.schoolName ||
          (settings as AnyRow)?.schoolName,
        "School",
      ),
      branchName: text(
        branch?.name ||
          membership?.branchName ||
          (settings as AnyRow)?.branchName,
        "Branch",
      ),
    };
  }, [
    rows.parents,
    rows.branches,
    rows.schools,
    rows.appUsers,
    parentId,
    branchId,
    schoolId,
    openWorkspace,
    activeMembership,
    activeParentId,
    activeBranch,
    activeSchool,
    settings,
  ]);

  const childLinks = useMemo(() => {
    const resolvedParentId = parentId || cleanId(idOf(identity.parent));
    if (!resolvedParentId) return [];

    return (rows.studentParents || []).filter((row) =>
      sameId(row.parentId || row.parentLocalId, resolvedParentId),
    );
  }, [identity.parent, parentId, rows.studentParents]);

  const children = useMemo(() => {
    const students = (rows.students || []).filter(activeRow);
    const linkedIds = new Set(
      childLinks
        .map((row) => cleanId(row.studentId || row.studentLocalId))
        .filter(Boolean),
    );

    if (linkedIds.size) {
      return students.filter((student) =>
        linkedIds.has(cleanId(idOf(student))),
      );
    }

    const membership = workspaceMembership(openWorkspace, activeMembership);
    const parentEmail =
      identity.parent?.email ||
      identity.parent?.parentEmail ||
      membership?.parentEmail;
    const parentPhone =
      identity.parent?.phone ||
      identity.parent?.parentPhone ||
      membership?.parentPhone;

    return students.filter(
      (student) =>
        (parentEmail && sameId(student.parentEmail, parentEmail)) ||
        (parentPhone && sameId(student.parentPhone, parentPhone)),
    );
  }, [
    activeMembership,
    childLinks,
    identity.parent,
    openWorkspace,
    rows.students,
  ]);

  const childIds = useMemo(
    () =>
      new Set(
        children
          .map((child) => cleanId(idOf(child)))
          .filter(Boolean),
      ),
    [children],
  );

  const childClassIds = useMemo(
    () =>
      new Set(
        children
          .map((child) =>
            cleanId(child.currentClassId || child.classId),
          )
          .filter(Boolean),
      ),
    [children],
  );

  const summary = useMemo(() => {
    const today = todayKey();
    const enrollments = (rows.studentEnrollments || []).filter((row) =>
      childIds.has(cleanId(row.studentId)),
    );
    const attendance = (rows.attendance || []).filter((row) =>
      childIds.has(cleanId(row.studentId)),
    );
    const results = (rows.computedResults || []).filter((row) =>
      childIds.has(cleanId(row.studentId)),
    );
    const reportCards = (rows.reportCards || []).filter((row) =>
      childIds.has(cleanId(row.studentId)),
    );
    const invoices = (rows.studentFeeInvoices || []).filter((row) =>
      childIds.has(cleanId(row.studentId)),
    );
    const payments = [
      ...(rows.studentFeePayments || []),
      ...(rows.payments || []),
    ].filter(
      (row) =>
        !row.studentId ||
        childIds.has(cleanId(row.studentId)),
    );
    const todayAttendance = attendance.filter((row) =>
      String(row.date || row.createdAt || "").startsWith(today),
    );
    const sessions = (rows.scheduleSessions || []).filter(
      (row) =>
        (row.studentId && childIds.has(cleanId(row.studentId))) ||
        (row.classId && childClassIds.has(cleanId(row.classId))) ||
        (!row.studentId && !row.classId),
    );

    const averageScore = results.length
      ? Math.round(
          results.reduce(
            (total, row) =>
              total +
              n(
                row.percentage ||
                  row.average ||
                  row.score ||
                  row.totalScore,
              ),
            0,
          ) / Math.max(1, results.length),
        )
      : 0;

    const invoiceTotal = invoices.reduce(
      (total, row) =>
        total +
        n(row.total || row.amount || row.balance || row.netAmount),
      0,
    );
    const paidTotal = payments.reduce(
      (total, row) => total + n(row.amount || row.total),
      0,
    );

    return {
      parentName: identity.parentName,
      schoolName: identity.schoolName,
      branchName: identity.branchName,
      children: children.length,
      enrollments: count(enrollments),
      attendance: count(attendance),
      presentToday: todayAttendance.filter(
        (row) =>
          String(row.status || "").toLowerCase() === "present",
      ).length,
      absentToday: todayAttendance.filter((row) =>
        ["absent", "excused"].includes(
          String(row.status || "").toLowerCase(),
        ),
      ).length,
      lateToday: todayAttendance.filter(
        (row) => String(row.status || "").toLowerCase() === "late",
      ).length,
      todayAttendance: todayAttendance.length,
      results: count(results),
      reportCards: count(reportCards),
      averageScore,
      invoices: count(invoices),
      payments: count(payments),
      paidTotal,
      feeBalance: Math.max(0, invoiceTotal - paidTotal),
      currencyCode: text(
        invoices[0]?.currencyCode ||
          payments[0]?.currencyCode,
        "GHS",
      ),
      announcements: count(rows.announcements || []),
      messages: count(rows.messageThreads || []),
      events: count(rows.calendarEvents || []),
      sessions: count(sessions),
    };
  }, [
    childClassIds,
    childIds,
    children.length,
    identity,
    rows,
  ]);

  const modules = useMemo<DashboardModule[]>(
    () =>
      buildNavModules(navSections).map((module) => ({
        ...module,
        ...metricFor(module.routeKey, rows, summary),
      })),
    [navSections, rows, summary],
  );

  const q = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!q) return [];

    return modules
      .filter((item) =>
        `${item.label} ${item.note} ${item.area}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 12);
  }, [modules, q]);

  const announcements = useMemo(
    () =>
      (rows.announcements || [])
        .filter(activeRow)
        .sort(
          (a, b) =>
            n(b.publishAt || b.sentAt || b.updatedAt || b.createdAt) -
            n(a.publishAt || a.sentAt || a.updatedAt || a.createdAt),
        )
        .slice(0, 4),
    [rows.announcements],
  );

  const events = useMemo(
    () =>
      (rows.calendarEvents || [])
        .filter(activeRow)
        .sort(
          (a, b) =>
            n(a.startAt || a.startDate || a.date) -
            n(b.startAt || b.startDate || b.date),
        )
        .slice(0, 5),
    [rows.calendarEvents],
  );

  const recent = useMemo(() => {
    const source: AnyRow[] = [
      ...(rows.computedResults || [])
        .filter((row) => childIds.has(cleanId(row.studentId)))
        .map((row) => ({
          ...row,
          _kind: "Result",
          _icon: "📊",
          _title: text(
            row.subjectName || row.title,
            "New result available",
          ),
          _date: row.updatedAt || row.createdAt,
        })),
      ...(rows.reportCards || [])
        .filter((row) => childIds.has(cleanId(row.studentId)))
        .map((row) => ({
          ...row,
          _kind: "Report card",
          _icon: "📄",
          _title: text(
            row.title || row.periodName,
            "Report card available",
          ),
          _date:
            row.publishedAt || row.updatedAt || row.createdAt,
        })),
      ...(rows.studentFeePayments || [])
        .filter(
          (row) =>
            !row.studentId ||
            childIds.has(cleanId(row.studentId)),
        )
        .map((row) => ({
          ...row,
          _kind: "Payment",
          _icon: "💳",
          _title: money(
            row.amount || row.total,
            row.currencyCode || "GHS",
          ),
          _date: row.paidAt || row.updatedAt || row.createdAt,
        })),
      ...(rows.announcements || []).map((row) => ({
        ...row,
        _kind: "Announcement",
        _icon: "📣",
        _title: text(row.title, "School announcement"),
        _date:
          row.sentAt ||
          row.publishAt ||
          row.updatedAt ||
          row.createdAt,
      })),
    ];

    return source
      .sort((a, b) => n(b._date) - n(a._date))
      .slice(0, 6);
  }, [childIds, rows]);

  const heroImage = useMemo(() => {
    const media = (rows.mediaAssets || []).filter(activeRow);
    const highlights = (rows.portalHighlights || [])
      .filter(activeRow)
      .filter((row) => {
        const audience = String(
          row.audience || row.portal || row.role || "all",
        ).toLowerCase();
        const status = String(row.status || "").toLowerCase();
        return (
          ["all", "parent", "parents"].includes(audience) &&
          (!status ||
            ["published", "scheduled", "active"].includes(status))
        );
      })
      .sort(
        (a, b) => n(a.displayOrder || a.order) - n(b.displayOrder || b.order),
      );

    const mediaUrl = (mediaId: unknown) => {
      const asset = media.find((row) =>
        sameId(idOf(row), mediaId),
      );

      return text(
        asset?.publicUrl ||
          asset?.remoteUrl ||
          asset?.previewDataUrl ||
          asset?.thumbnailDataUrl ||
          asset?.localObjectUrl,
      );
    };

    const branch = identity.branch;
    const school = identity.school;

    const candidates = [
      ...highlights.flatMap((row) => [
        mediaUrl(row.mediaAssetId),
        mediaUrl(row.posterMediaAssetId),
        row.fallbackImageUrl,
      ]),
      mediaUrl(branch?.bannerImageMediaId),
      branch?.bannerImage,
      mediaUrl(branch?.photoMediaId),
      branch?.photo,
      mediaUrl(school?.bannerImageMediaId),
      school?.bannerImage,
      mediaUrl(school?.photoMediaId),
      school?.photo,
      mediaUrl((settings as AnyRow)?.dashboardHeroImageMediaId),
      (settings as AnyRow)?.dashboardHeroImage,
      mediaUrl((settings as AnyRow)?.dashboardBannerImageMediaId),
      (settings as AnyRow)?.dashboardBannerImage,
      ...media
        .filter(
          (row) =>
            String(row.assetKind || "").toLowerCase() === "image",
        )
        .map(
          (row) =>
            row.publicUrl ||
            row.remoteUrl ||
            row.previewDataUrl ||
            row.thumbnailDataUrl ||
            row.localObjectUrl,
        ),
    ]
      .map((value) => text(value))
      .filter(Boolean);

    return candidates[0] || "";
  }, [
    identity,
    rows.mediaAssets,
    rows.portalHighlights,
    settings,
  ]);

  const motto = text(
    (settings as AnyRow)?.motto ||
      identity.branch?.motto ||
      identity.school?.motto,
    "Learning today. Leading tomorrow.",
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  function openRoute(routeKey: string) {
    if (navigate) {
      navigate(routeKey);
      return;
    }

    try {
      window.dispatchEvent(
        new CustomEvent("eleeveon:portal-route", {
          detail: { key: routeKey },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("role-portal:navigate", {
          detail: { key: routeKey },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("portal:navigate", {
          detail: routeKey,
        }),
      );
    } catch {
      // Optional shell fallback.
    }
  }

  if (loading || accountLoading || settingsLoading) {
    return (
      <State
        primary={primary}
        title="Opening parent dashboard..."
        text="Preparing your children, attendance, fees, announcements and school activity."
      />
    );
  }

  if (!authenticated || !accountId) {
    return (
      <State
        primary={primary}
        title="Redirecting to login..."
        text="You must sign in before viewing the parent portal."
      />
    );
  }

  const quickActions = [
    ["children", "🧒", "Children"],
    ["childAttendance", "✓", "Attendance"],
    ["childResults", "📊", "Results"],
    ["childFees", "💳", "Fees"],
    ["announcements", "📣", "Notices"],
  ] as const;

  return (
    <main
      className="pd-page"
      style={{ "--pd-primary": primary } as React.CSSProperties}
    >
      <style>{css}</style>

      <section className="pd-search-card">
        <span
          className={`status-dot-mini ${
            summary.children ? "green" : "gray"
          }`}
          title={summary.parentName}
        />

        <label className="pd-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search children, attendance, results..."
            aria-label="Search parent modules"
          />
        </label>

        {query ? (
          <button
            className="pd-clear"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            ×
          </button>
        ) : null}

        <button
          className="pd-refresh"
          onClick={() => void load()}
          aria-label="Refresh dashboard"
        >
          ↻
        </button>

        <button
          className="pd-more"
          onClick={() => setMoreOpen(true)}
          aria-label="More options"
        >
          ⋯
        </button>
      </section>

      {q ? (
        <section className="pd-search-results">
          <div className="pd-section-head">
            <div>
              <span>Search results</span>
              <h2>
                {searchResults.length
                  ? `Matching “${query.trim()}”`
                  : "No matches found"}
              </h2>
            </div>
            <b>{searchResults.length}</b>
          </div>

          {searchResults.map((item) => (
            <button
              key={item.key}
              className="parent-row"
              onClick={() => openRoute(item.routeKey)}
            >
              <span className="parent-avatar">{item.icon}</span>
              <span className="parent-main">
                <strong>{item.label}</strong>
                <small>{item.note}</small>
                <em>{areaLabel(item.area)}</em>
              </span>
              <span className="parent-side">
                <Chip tone={item.tone}>{item.value}</Chip>
                <i>›</i>
              </span>
            </button>
          ))}

          {!searchResults.length ? (
            <Empty
              title="Nothing matches that search"
              text="Try children, attendance, results, fees, announcements or calendar."
            />
          ) : null}
        </section>
      ) : (
        <>
          <section
            className={`pd-hero ${heroImage ? "has-image" : ""}`}
            style={
              heroImage
                ? {
                    backgroundImage: `linear-gradient(90deg,rgba(7,15,32,.88),rgba(7,15,32,.32)),url(${JSON.stringify(
                      heroImage,
                    ).slice(1, -1)})`,
                  }
                : undefined
            }
          >
            <div className="pd-hero-copy">
              <span>{greeting}</span>
              <h1>{summary.parentName}</h1>
              <p>
                Welcome to <strong>{summary.schoolName}</strong>
                <small className="pd-branch-name">
                  {summary.branchName}
                </small>
              </p>
              <blockquote>“{motto}”</blockquote>
            </div>

            <div className="pd-hero-stats">
              <span>
                <b>{summary.children}</b>{" "}
                {summary.children === 1 ? "Child" : "Children"}
              </span>
              <span>
                <b>{summary.presentToday}</b> Present
              </span>
              <span>
                <b>
                  {money(
                    summary.feeBalance,
                    summary.currencyCode,
                  )}
                </b>{" "}
                Due
              </span>
            </div>
          </section>

          <section
            className="pd-quick-actions"
            aria-label="Quick actions"
          >
            {quickActions.map(([route, icon, label]) => (
              <button
                key={route}
                onClick={() => openRoute(route)}
              >
                <span>{icon}</span>
                <b>{label}</b>
              </button>
            ))}
          </section>

          <section className="pd-dashboard-grid">
            <article className="pd-card">
              <div className="pd-section-head">
                <div>
                  <span>My family</span>
                  <h2>Children</h2>
                </div>
                <button onClick={() => openRoute("children")}>
                  View all
                </button>
              </div>

              <div className="pd-child-list">
                {children.length ? (
                  children.slice(0, 4).map((child, index) => {
                    const childId = cleanId(idOf(child));
                    const enrollment = (
                      rows.studentEnrollments || []
                    ).find(
                      (row) =>
                        childId &&
                        sameId(row.studentId, childId) &&
                        activeRow(row),
                    );
                    const classId =
                      enrollment?.classId ||
                      child.currentClassId ||
                      child.classId;
                    const classRow = (rows.classes || []).find(
                      (row) => sameId(idOf(row), classId),
                    );
                    const attendanceToday = (
                      rows.attendance || []
                    ).find(
                      (row) =>
                        childId &&
                        sameId(row.studentId, childId) &&
                        String(
                          row.date || row.createdAt || "",
                        ).startsWith(todayKey()),
                    );

                    return (
                      <button
                        key={childId || index}
                        className="pd-child-row"
                        onClick={() => openRoute("children")}
                      >
                        <span className="pd-child-avatar">
                          {text(child.fullName || child.name, "C")
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                        <span>
                          <b>{rowName(child)}</b>
                          <small>
                            {text(
                              classRow?.name,
                              "Class not assigned",
                            )}
                          </small>
                        </span>
                        <Chip
                          tone={statusTone(
                            attendanceToday?.status,
                          )}
                        >
                          {text(
                            attendanceToday?.status,
                            "No mark",
                          )}
                        </Chip>
                      </button>
                    );
                  })
                ) : (
                  <MiniEmpty
                    icon="🧒"
                    text="No linked children were found."
                  />
                )}
              </div>
            </article>

            <article className="pd-card attendance-card">
              <div className="pd-section-head">
                <div>
                  <span>Today</span>
                  <h2>Attendance</h2>
                </div>
                <button
                  onClick={() => openRoute("childAttendance")}
                >
                  Open
                </button>
              </div>

              <div className="attendance-main">
                <strong>{summary.presentToday}</strong>
                <span>children present today</span>
              </div>

              <div className="attendance-grid">
                <div>
                  <b>{summary.absentToday}</b>
                  <small>Absent</small>
                </div>
                <div>
                  <b>{summary.lateToday}</b>
                  <small>Late</small>
                </div>
                <div>
                  <b>{summary.todayAttendance}</b>
                  <small>Recorded</small>
                </div>
                <div>
                  <b>{summary.averageScore || "—"}</b>
                  <small>Average</small>
                </div>
              </div>
            </article>

            <article className="pd-card fees-card">
              <div className="pd-section-head">
                <div>
                  <span>Account</span>
                  <h2>Fees & payments</h2>
                </div>
                <button onClick={() => openRoute("childFees")}>
                  Statement
                </button>
              </div>

              <div className="pd-fee-total">
                <strong>
                  {money(
                    summary.feeBalance,
                    summary.currencyCode,
                  )}
                </strong>
                <span>
                  {summary.feeBalance
                    ? "outstanding balance"
                    : "account currently clear"}
                </span>
              </div>

              <div className="pd-fee-meta">
                <div>
                  <b>{summary.invoices}</b>
                  <small>Invoices</small>
                </div>
                <div>
                  <b>{summary.payments}</b>
                  <small>Payments</small>
                </div>
                <div>
                  <b>
                    {money(
                      summary.paidTotal,
                      summary.currencyCode,
                    )}
                  </b>
                  <small>Paid</small>
                </div>
              </div>
            </article>

            <article className="pd-card">
              <div className="pd-section-head">
                <div>
                  <span>School day</span>
                  <h2>Upcoming</h2>
                </div>
                <button onClick={() => openRoute("calendar")}>
                  Calendar
                </button>
              </div>

              <div className="pd-stack">
                {events.length ? (
                  events.map((event, index) => (
                    <button
                      key={cleanId(idOf(event)) || index}
                      onClick={() => openRoute("calendar")}
                      className="event-row"
                    >
                      <time>
                        {dateLabel(
                          event.startAt ||
                            event.startDate ||
                            event.date,
                        ).split(",")[0]}
                      </time>
                      <span>
                        <b>
                          {text(
                            event.title || event.name,
                            "School event",
                          )}
                        </b>
                        <small>
                          {text(
                            event.location || event.venue,
                            "School calendar",
                          )}
                        </small>
                      </span>
                    </button>
                  ))
                ) : (
                  <MiniEmpty
                    icon="🗓️"
                    text="No upcoming events yet."
                  />
                )}
              </div>
            </article>

            <article className="pd-card announcements-card">
              <div className="pd-section-head">
                <div>
                  <span>Notice board</span>
                  <h2>Announcements</h2>
                </div>
                <button
                  onClick={() => openRoute("announcements")}
                >
                  View all
                </button>
              </div>

              <div className="pd-stack">
                {announcements.length ? (
                  announcements.map((item, index) => (
                    <button
                      key={cleanId(idOf(item)) || index}
                      onClick={() =>
                        openRoute("announcements")
                      }
                      className="notice-row"
                    >
                      <span>📣</span>
                      <div>
                        <b>{text(item.title, "Announcement")}</b>
                        <small>
                          {text(
                            item.message ||
                              item.body ||
                              item.content,
                            "Open to read this school update.",
                          ).slice(0, 100)}
                        </small>
                      </div>
                    </button>
                  ))
                ) : (
                  <MiniEmpty
                    icon="📣"
                    text="No announcements published."
                  />
                )}
              </div>
            </article>
          </section>

          <section className="pd-card pd-recent">
            <div className="pd-section-head">
              <div>
                <span>Latest changes</span>
                <h2>Recent activity</h2>
              </div>
              <b>{recent.length}</b>
            </div>

            <div className="pd-recent-list">
              {recent.length ? (
                recent.map((item, index) => (
                  <article
                    key={`${item._kind}-${
                      cleanId(idOf(item)) || index
                    }`}
                    className="recent-row"
                  >
                    <span>{item._icon}</span>
                    <b>{item._title}</b>
                    <small>
                      {item._kind} · {dateLabel(item._date)}
                    </small>
                  </article>
                ))
              ) : (
                <MiniEmpty
                  icon="✨"
                  text="Your children's school activity will appear here."
                />
              )}
            </div>
          </section>
        </>
      )}

      {moreOpen ? (
        <div
          className="pd-sheet-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <section className="pd-sheet">
            <div className="pd-sheet-head">
              <div>
                <h2>Parent home</h2>
                <p>
                  Useful parent destinations and dashboard controls.
                </p>
              </div>
              <button onClick={() => setMoreOpen(false)}>✕</button>
            </div>

            <div className="pd-menu-list">
              <button
                onClick={() => {
                  setMoreOpen(false);
                  void load();
                }}
              >
                <span>↻</span>
                <b>Refresh dashboard</b>
                <small>Reload family data from this device</small>
              </button>

              <button
                onClick={() => {
                  setMoreOpen(false);
                  openRoute("payments");
                }}
              >
                <span>🧾</span>
                <b>Payment history</b>
                <small>Review payments and receipts</small>
              </button>

              <button
                onClick={() => {
                  setMoreOpen(false);
                  openRoute("messages");
                }}
              >
                <span>✉️</span>
                <b>Messages</b>
                <small>Open school conversations</small>
              </button>

              <button
                onClick={() => {
                  setMoreOpen(false);
                  openRoute("parentProfile");
                }}
              >
                <span>👤</span>
                <b>Parent profile</b>
                <small>Review your contact information</small>
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function MiniEmpty({
  icon,
  text: body,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="mini-empty">
      <span>{icon}</span>
      <p>{body}</p>
    </div>
  );
}

function State({
  primary,
  title,
  text: body,
}: {
  primary: string;
  title: string;
  text: string;
}) {
  return (
    <main
      className="pd-page"
      style={{ "--pd-primary": primary } as React.CSSProperties}
    >
      <style>{css}</style>
      <section className="pd-state">
        <div className="pd-spinner" />
        <h2>{title}</h2>
        <p>{body}</p>
      </section>
    </main>
  );
}

const css = `
@keyframes spin{to{transform:rotate(360deg)}}
.pd-page{--ease:cubic-bezier(.2,.8,.2,1);min-height:100dvh;padding:8px;padding-bottom:max(40px,env(safe-area-inset-bottom));background:radial-gradient(circle at top left,color-mix(in srgb,var(--pd-primary) 10%,transparent),transparent 34rem),var(--bg,#f7f8fb);color:var(--text,#111827);font-family:var(--font-family,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);overflow-x:hidden}
.pd-page *{box-sizing:border-box;min-width:0}
.pd-page button,.pd-page input{font:inherit}
.pd-page button{cursor:pointer;-webkit-tap-highlight-color:transparent}
.pd-search-card,.pd-card,.pd-state,.pd-search-results,.parent-row,.pd-sheet{background:var(--card-bg,var(--surface,#fff));border:1px solid var(--border,rgba(0,0,0,.1));box-shadow:0 12px 30px rgba(15,23,42,.05)}
.pd-search-card{position:sticky;top:6px;z-index:20;display:grid;grid-template-columns:auto minmax(0,1fr) auto auto auto;align-items:center;gap:7px;padding:7px;border-radius:22px;backdrop-filter:blur(16px)}
.status-dot-mini{width:9px;height:9px;border-radius:99px}
.status-dot-mini.green{background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.12)}
.status-dot-mini.gray{background:#94a3b8}
.pd-search{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:8px;min-height:43px;padding:0 12px;border-radius:17px;background:color-mix(in srgb,var(--muted,#64748b) 7%,transparent)}
.pd-search>span{font-size:18px;color:var(--muted,#64748b);font-weight:1000}
.pd-search input{width:100%;border:0;outline:0;background:transparent;color:var(--text,#111827);font-size:14px;font-weight:750}
.pd-search input::placeholder{color:var(--muted,#64748b)}
.pd-clear,.pd-refresh,.pd-more{width:40px;height:40px;border-radius:99px;border:1px solid var(--border,rgba(0,0,0,.1));background:var(--surface,#fff);color:var(--text,#111827);font-size:18px;font-weight:1000}
.pd-refresh{background:var(--pd-primary);border-color:var(--pd-primary);color:#fff}
.pd-hero{position:relative;min-height:270px;margin-top:10px;border-radius:30px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;color:#fff;background:linear-gradient(135deg,color-mix(in srgb,var(--pd-primary) 95%,#111827),color-mix(in srgb,var(--pd-primary) 55%,#0f172a));box-shadow:0 22px 60px color-mix(in srgb,var(--pd-primary) 20%,transparent);background-position:center;background-size:cover}
.pd-hero:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 85% 18%,rgba(255,255,255,.18),transparent 26%);pointer-events:none}
.pd-hero-copy,.pd-hero-stats{position:relative;z-index:1}
.pd-hero-copy>span{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;opacity:.85}
.pd-hero h1{margin:7px 0 4px;font-size:clamp(28px,7vw,48px);line-height:.98;letter-spacing:-.06em}
.pd-hero p{margin:0;font-size:14px}
.pd-branch-name{display:block;width:max-content;max-width:100%;margin-top:7px;padding:5px 9px;border:1px solid rgba(255,255,255,.22);border-radius:10px;background:rgba(255,255,255,.12);backdrop-filter:blur(8px);font-size:11px;font-weight:850}
.pd-hero blockquote{margin:18px 0 0;max-width:38rem;font-size:13px;line-height:1.55;font-weight:750;opacity:.9}
.pd-hero-stats{display:flex;flex-wrap:wrap;gap:8px;margin-top:26px}
.pd-hero-stats span{display:flex;align-items:baseline;gap:5px;padding:8px 11px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(255,255,255,.12);backdrop-filter:blur(10px);font-size:11px;font-weight:850}
.pd-hero-stats b{font-size:15px}
.pd-quick-actions{display:grid;grid-template-columns:repeat(5,minmax(74px,1fr));gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
.pd-quick-actions::-webkit-scrollbar{display:none}
.pd-quick-actions button{min-height:76px;border:1px solid var(--border,rgba(0,0,0,.1));border-radius:22px;background:var(--card-bg,var(--surface,#fff));color:var(--text,#111827);display:grid;place-items:center;align-content:center;gap:7px;box-shadow:0 10px 24px rgba(15,23,42,.04)}
.pd-quick-actions span{width:34px;height:34px;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--pd-primary) 11%,transparent);color:var(--pd-primary);font-size:17px;font-weight:1000}
.pd-quick-actions b{font-size:11px;font-weight:950;white-space:nowrap}
.pd-dashboard-grid{display:grid;gap:10px;margin-top:10px}
.pd-card{padding:14px;border-radius:26px}
.pd-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}
.pd-section-head span{display:block;color:var(--muted,#64748b);font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.1em}
.pd-section-head h2{margin:3px 0 0;font-size:17px;font-weight:1000;letter-spacing:-.035em}
.pd-section-head>button,.pd-section-head>b{border:0;border-radius:999px;padding:7px 10px;background:color-mix(in srgb,var(--pd-primary) 10%,transparent);color:var(--pd-primary);font-size:10px;font-weight:950}
.pd-child-list,.pd-stack,.pd-recent-list{display:grid;gap:7px}
.pd-child-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:9px;width:100%;padding:9px;border:0;border-radius:17px;background:color-mix(in srgb,var(--muted,#64748b) 6%,transparent);color:inherit;text-align:left}
.pd-child-avatar{width:38px;height:38px;display:grid;place-items:center;border-radius:14px;background:color-mix(in srgb,var(--pd-primary) 12%,transparent);color:var(--pd-primary);font-size:15px;font-weight:1000}
.pd-child-row b,.pd-child-row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pd-child-row b{font-size:12px}
.pd-child-row small{margin-top:3px;color:var(--muted,#64748b);font-size:10px;font-weight:750}
.attendance-card{background:linear-gradient(145deg,color-mix(in srgb,var(--pd-primary) 7%,var(--surface,#fff)),var(--surface,#fff))}
.attendance-main strong{display:block;font-size:46px;line-height:1;font-weight:1000;letter-spacing:-.07em}
.attendance-main span{color:var(--muted,#64748b);font-size:12px;font-weight:850}
.attendance-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:15px}
.attendance-grid div,.pd-fee-meta div{padding:10px 7px;border-radius:16px;background:color-mix(in srgb,var(--muted,#64748b) 7%,transparent);text-align:center}
.attendance-grid b,.attendance-grid small,.pd-fee-meta b,.pd-fee-meta small{display:block}
.attendance-grid b,.pd-fee-meta b{font-size:17px}
.attendance-grid small,.pd-fee-meta small{margin-top:3px;color:var(--muted,#64748b);font-size:9px;font-weight:850}
.pd-fee-total strong{display:block;font-size:34px;line-height:1;font-weight:1000;letter-spacing:-.06em}
.pd-fee-total span{display:block;margin-top:6px;color:var(--muted,#64748b);font-size:11px;font-weight:800}
.pd-fee-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:15px}
.event-row,.notice-row{width:100%;border:0;border-radius:17px;padding:9px;background:color-mix(in srgb,var(--muted,#64748b) 6%,transparent);color:inherit;text-align:left}
.event-row{display:grid;grid-template-columns:72px minmax(0,1fr);gap:9px;align-items:center}
.event-row time{font-size:10px;font-weight:950;color:var(--pd-primary)}
.event-row b,.event-row small,.notice-row b,.notice-row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.event-row b,.notice-row b{font-size:12px;font-weight:1000}
.event-row small,.notice-row small{margin-top:3px;color:var(--muted,#64748b);font-size:10px;font-weight:750}
.notice-row{display:grid;grid-template-columns:34px minmax(0,1fr);gap:9px;align-items:center}
.notice-row>span{width:34px;height:34px;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--pd-primary) 10%,transparent)}
.pd-recent{margin-top:10px}
.recent-row{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:9px;align-items:center;padding:9px;border-radius:17px;background:color-mix(in srgb,var(--muted,#64748b) 5%,transparent)}
.recent-row span{grid-row:span 2;width:34px;height:34px;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--pd-primary) 10%,transparent)}
.recent-row b,.recent-row small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.recent-row b{font-size:12px}
.recent-row small{font-size:10px;color:var(--muted,#64748b);font-weight:750}
.mini-empty{min-height:110px;display:grid;place-items:center;align-content:center;text-align:center;color:var(--muted,#64748b)}
.mini-empty span{font-size:26px}
.mini-empty p{margin:6px 0 0;font-size:11px;font-weight:800}
.pd-search-results{margin-top:10px;padding:12px;border-radius:26px}
.parent-row{width:100%;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;margin-top:7px;padding:10px;border-radius:20px;text-align:left;color:inherit}
.parent-avatar{width:46px;height:46px;display:grid;place-items:center;border-radius:17px;background:color-mix(in srgb,var(--pd-primary) 11%,transparent);font-size:21px}
.parent-main strong,.parent-main small,.parent-main em{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.parent-main strong{font-size:13px;font-weight:1000}
.parent-main small{margin-top:3px;color:var(--muted,#64748b);font-size:10px;font-weight:800}
.parent-main em{margin-top:3px;color:var(--pd-primary);font-size:9px;font-style:normal;font-weight:900}
.parent-side{display:flex;align-items:center;gap:7px}
.parent-side i{font-style:normal;color:var(--muted,#64748b)}
.pd-chip{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:950;text-transform:capitalize}
.pd-chip.green{background:rgba(34,197,94,.12);color:#16a34a}
.pd-chip.blue{background:rgba(59,130,246,.12);color:#2563eb}
.pd-chip.orange{background:rgba(245,158,11,.14);color:#b45309}
.pd-chip.purple{background:rgba(147,51,234,.12);color:#7e22ce}
.pd-chip.gray{background:rgba(100,116,139,.12);color:#64748b}
.pd-chip.red{background:rgba(239,68,68,.12);color:#dc2626}
.pd-empty{min-height:220px;display:grid;place-items:center;align-content:center;text-align:center}
.pd-empty div{font-size:28px}
.pd-empty h3{margin:8px 0 0}
.pd-empty p{max-width:30rem;margin:5px 0 0;color:var(--muted,#64748b);font-size:12px}
.pd-sheet-backdrop{position:fixed;inset:0;z-index:80;display:grid;place-items:end center;padding:10px;background:rgba(15,23,42,.5);backdrop-filter:blur(12px)}
.pd-sheet{width:min(520px,100%);padding:14px;border-radius:28px}
.pd-sheet-head{display:flex;justify-content:space-between;gap:10px}
.pd-sheet-head h2{margin:0;font-size:20px}
.pd-sheet-head p{margin:4px 0 0;color:var(--muted,#64748b);font-size:11px}
.pd-sheet-head button{width:38px;height:38px;border:1px solid var(--border,rgba(0,0,0,.1));border-radius:99px;background:var(--surface,#fff);color:inherit}
.pd-menu-list{display:grid;gap:8px;margin-top:12px}
.pd-menu-list button{display:grid;grid-template-columns:40px minmax(0,1fr);column-gap:10px;align-items:center;width:100%;padding:9px;border:1px solid var(--border,rgba(0,0,0,.1));border-radius:18px;background:var(--surface,#fff);color:inherit;text-align:left}
.pd-menu-list button>span{grid-row:span 2;width:40px;height:40px;display:grid;place-items:center;border-radius:14px;background:color-mix(in srgb,var(--pd-primary) 10%,transparent)}
.pd-menu-list button>b,.pd-menu-list button>small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pd-menu-list button>b{font-size:12px}
.pd-menu-list button>small{font-size:10px;color:var(--muted,#64748b)}
.pd-state{min-height:min(430px,calc(100dvh - 32px));width:min(540px,100%);margin:0 auto;display:grid;place-items:center;align-content:center;gap:9px;padding:22px;border-radius:28px;text-align:center}
.pd-spinner{width:38px;height:38px;border-radius:99px;border:4px solid color-mix(in srgb,var(--pd-primary) 18%,transparent);border-top-color:var(--pd-primary);animation:spin .8s linear infinite}
.pd-state h2{margin:0;font-size:21px}
.pd-state p{margin:0;max-width:34rem;color:var(--muted,#64748b);font-size:12px;line-height:1.6}
@media(min-width:760px){.pd-page{padding:12px}.pd-dashboard-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.announcements-card{grid-column:span 2}.pd-recent-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:1180px){.pd-dashboard-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.announcements-card{grid-column:auto}.pd-child-list{max-height:270px;overflow:auto}}
@media(max-width:620px){.pd-search-card{grid-template-columns:auto minmax(0,1fr) auto auto auto}.pd-quick-actions{grid-template-columns:repeat(5,minmax(78px,1fr))}.attendance-grid{grid-template-columns:repeat(2,1fr)}.pd-fee-meta{grid-template-columns:1fr}.pd-hero-stats span:last-child{max-width:100%;overflow:hidden;text-overflow:ellipsis}}
@media(prefers-reduced-motion:reduce){.pd-spinner{animation:none}}
`;

