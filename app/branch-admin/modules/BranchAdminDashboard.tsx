"use client";

/**
 * app/branch-admin/modules/BranchAdminDashboard.tsx
 * ---------------------------------------------------------
 * ELEEVEON BRANCH ADMIN DASHBOARD V5 — PORTAL HIGHLIGHTS
 * ---------------------------------------------------------
 * Golden Standard Branch Home.
 * Branch-scoped, offline-first, mobile-first, theme-safe.
 *
 * What changed in V4:
 * - The dashboard no longer keeps a manually duplicated module list.
 * - It receives the same navSections used by app/branch-admin/page.tsx.
 * - Adding/removing/reordering nav items in branch-admin/page.tsx automatically
 *   updates the dashboard module list.
 * - Counts are still real local Dexie counts, mapped by route key.
 * - Users & Roles now counts unique active visible users, not raw membership rows.
 * - Unknown/new module keys safely appear as Open until a metric is added.
 * - The Dashboard item itself is hidden from the dashboard module list.
 *
 * Workspace-session aligned:
 * - Prefer the selected workspace session written by /select-role and opened
 *   by RolePortalShell.
 * - Fall back to ActiveBranchContext/settings only if the selected workspace
 *   does not provide schoolId/branchId.
 * - This prevents the branch dashboard from counting another branch when a
 *   multi-role user switches workspaces.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAccount } from "../../context/account-context";
import { useSettings } from "../../context/settings-context";
import { useActiveBranch } from "../../context/active-branch-context";
import { useActiveMembership } from "../../context/active-membership-context";
import { db } from "../../lib/db/db";
import type { RoleNavSection } from "../../components/role-portals/RolePortalShell";

import { useDataRevision } from "../../hooks/useDataRevision";
import { useBackgroundLoader } from "../../hooks/useBackgroundLoader";
type AnyRow = Record<string, any>;
type ViewMode = "cards" | "table" | "analytics";
type AreaFilter =
  | "all"
  | "administration"
  | "attendance"
  | "communication"
  | "timetable"
  | "setup"
  | "records"
  | "finance"
  | "control"
  | "other";
type Tone = "green" | "red" | "blue" | "gray" | "orange" | "purple";

type RouteProps = {
  navigate?: (key: string) => void;
  navSections?: RoleNavSection[];
};

type HeroSlide = {
  id: string;
  type: "image" | "video";
  src: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  durationSeconds: number;
  transition: "fade" | "slide";
  actionType?: string;
  actionLabel?: string;
  actionValue?: string;
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

const HIDDEN_DASHBOARD_KEYS = new Set(["branchAdminDashboard"]);

const TABLE_NAMES = [
  "schools",
  "branches",
  "appUsers",
  "students",
  "teachers",
  "parents",
  "classes",
  "classSubjects",
  "studentEnrollments",
  "attendance",
  "teacherAttendance",
  "announcements",
  "messageThreads",
  "calendarEvents",
  "scheduleTimetables",
  "scheduleSessions",
  "scheduleResources",
  "organizations",
  "subjects",
  "curriculums",
  "curriculumPathways",
  "curriculumSubjects",
  "academicStructures",
  "academicPeriods",
  "assessmentStructures",
  "assessmentStructureItems",
  "assessmentApplicabilities",
  "gradingSystems",
  "gradeRules",
  "reportCards",
  "computedResults",
  "studentPromotions",
  "studentReportSnapshots",
  "incomes",
  "expenses",
  "feeStructures",
  "studentFeeInvoices",
  "studentFeePayments",
  "payments",
  "paymentTransactions",
  "paymentSettlements",
  "withdrawalRequests",
  "schoolPayoutSettings",
  "staffPayrollProfiles",
  "payrollRuns",
  "payrollItems",
  "staffPaymentRecords",
  "userMemberships",
  "memberships",
  "schoolBranchSettings",
  "portalHighlights",
  "mediaAssets",
] as const;

const OPEN_WORKSPACE_KEY = "eleeveon_open_workspace";

type OpenWorkspaceSession = {
  membership?: AnyRow | null;
  membershipId?: string | null;
  role?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
  teacherId?: string | null;
  studentId?: string | null;
  parentId?: string | null;
  memberName?: string | null;
  fullName?: string | null;
  userName?: string | null;
  openedAt?: number;
};

function safeRead(key: string) {
  if (typeof window === "undefined") return null;

  try {
    return (
      window.localStorage.getItem(key) || window.sessionStorage.getItem(key)
    );
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

function cleanId(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function firstPermanentId(...values: unknown[]): string | null {
  for (const value of values) {
    const parsed = cleanId(value);
    if (parsed) return parsed;
  }

  return null;
}

function workspaceMembership(
  openWorkspace?: OpenWorkspaceSession | null,
  activeMembership?: AnyRow | null,
) {
  return (
    openWorkspace?.membership ||
    activeMembership ||
    readStoredActiveMembership() ||
    null
  );
}

function selectedSchoolId(args: {
  openWorkspace?: OpenWorkspaceSession | null;
  activeMembership?: AnyRow | null;
  activeSchoolId?: any;
  activeSchool?: AnyRow | null;
  settings?: AnyRow | null;
}) {
  const membership = workspaceMembership(
    args.openWorkspace,
    args.activeMembership,
  );

  return firstPermanentId(
    args.openWorkspace?.schoolId,
    membership?.schoolId,
    membership?.school?.id,
    args.activeSchoolId,
    args.activeSchool?.id,
    args.settings?.schoolId,
    safeRead("activeSchoolId"),
  );
}

function selectedBranchId(args: {
  openWorkspace?: OpenWorkspaceSession | null;
  activeMembership?: AnyRow | null;
  activeBranchId?: any;
  activeBranch?: AnyRow | null;
  settings?: AnyRow | null;
}) {
  const membership = workspaceMembership(
    args.openWorkspace,
    args.activeMembership,
  );

  return firstPermanentId(
    args.openWorkspace?.branchId,
    membership?.branchId,
    membership?.schoolBranchId,
    membership?.branch?.id,
    args.activeBranchId,
    args.activeBranch?.id,
    args.settings?.branchId,
    safeRead("activeBranchId"),
  );
}

function selectedBranchName(args: {
  openWorkspace?: OpenWorkspaceSession | null;
  activeMembership?: AnyRow | null;
  activeBranch?: AnyRow | null;
}) {
  const membership = workspaceMembership(
    args.openWorkspace,
    args.activeMembership,
  );

  return text(
    args.activeBranch?.name ||
      args.openWorkspace?.memberName ||
      args.openWorkspace?.fullName ||
      args.openWorkspace?.userName ||
      membership?.branchName ||
      membership?.branch?.name,
    "Active Branch",
  );
}

function n(value: any) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: any, fallback = "") {
  return String(value || "").trim() || fallback;
}

function idOf(row?: AnyRow): string {
  return cleanId(row?.id ?? row?.payload?.id);
}

function sameAccount(row: AnyRow, accountId?: string | null) {
  return (
    row &&
    row.isDeleted !== true &&
    (!row.accountId || !accountId || row.accountId === accountId)
  );
}

function branchScoped(
  row: AnyRow,
  accountId?: string | null,
  schoolId?: string | null,
  branchId?: string | null,
) {
  if (!sameAccount(row, accountId)) return false;
  const rowSchoolId = row.schoolId ?? row.payload?.schoolId;
  const rowBranchId = row.branchId ?? row.payload?.branchId;
  if (schoolId && rowSchoolId && String(rowSchoolId) !== String(schoolId))
    return false;
  if (branchId && rowBranchId && String(rowBranchId) !== String(branchId))
    return false;
  return true;
}

function activeRow(row: AnyRow) {
  const status = String(row?.status || "").toLowerCase();
  return (
    row?.isDeleted !== true &&
    row?.active !== false &&
    !["deleted", "archived", "inactive", "disabled"].includes(status)
  );
}

function rowName(row?: AnyRow) {
  return text(
    row?.fullName || row?.name || row?.title || row?.label || row?.email,
    "Unnamed",
  );
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
  const value = String(title || "")
    .toLowerCase()
    .trim();
  if (value.includes("admin")) return "administration";
  if (value.includes("attendance")) return "attendance";
  if (value.includes("communication")) return "communication";
  if (value.includes("calendar") || value.includes("timetable"))
    return "timetable";
  if (
    value.includes("setup") ||
    value.includes("academic") ||
    value.includes("curriculum") ||
    value.includes("assessment") ||
    value.includes("grading")
  )
    return "setup";
  if (value.includes("record")) return "records";
  if (value.includes("finance")) return "finance";
  if (value.includes("control") || value.includes("setting")) return "control";
  return "other";
}

function statusTone(status?: string): Tone {
  const value = String(status || "").toLowerCase();
  if (
    [
      "active",
      "paid",
      "sent",
      "succeeded",
      "success",
      "synced",
      "present",
      "published",
    ].includes(value)
  )
    return "green";
  if (
    [
      "failed",
      "overdue",
      "cancelled",
      "expired",
      "suspended",
      "absent",
      "withdrawn",
    ].includes(value)
  )
    return "red";
  if (["pending", "processing", "trial", "draft", "late"].includes(value))
    return "orange";
  if (["scheduled", "issued", "completed", "promoted"].includes(value))
    return "blue";
  return "gray";
}

function areaLabel(area: string) {
  const labels: Record<string, string> = {
    all: "All areas",
    administration: "Administration",
    attendance: "Attendance",
    communication: "Communication",
    timetable: "Calendar & Timetable",
    setup: "Setup",
    records: "Academic Records",
    finance: "Finance",
    control: "Branch Control",
    other: "Other",
  };
  return labels[area] || area;
}

function Chip({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return <span className={`bd-chip ${tone}`}>{children}</span>;
}

function SliderIcon() {
  return (
    <svg className="bd-slider-icon" viewBox="0 0 24 24" aria-hidden="true">
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
    <section className="bd-empty">
      <div>🏠</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </section>
  );
}

function count(rows: AnyRow[]) {
  return rows.filter(activeRow).length;
}

function uniqueCount(rows: AnyRow[], key: string) {
  return new Set(
    rows
      .filter(activeRow)
      .map((row) => row[key])
      .filter((value) => value !== undefined && value !== null && value !== ""),
  ).size;
}

function uniqueUsersRoleCount(rows: AnyRow[]) {
  const users = new Map<string, AnyRow>();

  rows.filter(activeRow).forEach((row) => {
    const key = String(
      row.userId ||
        row.appUserId ||
        row.user?.id ||
        row.appUser?.id ||
        row.email ||
        row.userEmail ||
        row.user?.email ||
        row.appUser?.email ||
        row.id ||
        `${row.role || "user"}-${row.teacherId || row.studentId || row.parentId || row.teacherId || row.studentId || row.parentId || ""}`,
    );

    if (key && key !== "undefined" && key !== "null") {
      users.set(key, row);
    }
  });

  return users.size;
}

function sum(rows: AnyRow[], field: string) {
  return rows
    .filter(activeRow)
    .reduce((total, row) => total + n(row[field]), 0);
}

function buildNavModules(
  navSections?: RoleNavSection[],
): Omit<DashboardModule, "value" | "note" | "tone">[] {
  const unique = new Map<
    string,
    Omit<DashboardModule, "value" | "note" | "tone">
  >();

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

function metricFor(
  routeKey: string,
  rows: Record<string, AnyRow[]>,
  summary: AnyRow,
): CountMetric {
  const metricMap: Record<string, CountMetric> = {
    students: {
      value: summary.students,
      note: `${summary.enrollments} enrollment record(s), ${summary.uniqueEnrolledStudents} unique enrolled student(s).`,
      tone: summary.students
        ? "green"
        : summary.uniqueEnrolledStudents
          ? "orange"
          : "gray",
    },
    teachers: {
      value: summary.teachers,
      note: "Branch teaching staff and profiles.",
      tone: summary.teachers ? "blue" : "orange",
    },
    parents: {
      value: summary.parents,
      note: "Parent and guardian contacts linked to students.",
      tone: summary.parents ? "purple" : "gray",
    },
    classes: {
      value: summary.classes,
      note: `${summary.classSubjects} class subject link(s).`,
      tone: summary.classes ? "blue" : "orange",
    },
    classSubjects: {
      value: summary.classSubjects,
      note: "Connect classes, subjects, curriculum and teachers.",
      tone: summary.classSubjects ? "green" : "gray",
    },
    studentEnrollments: {
      value: summary.enrollments,
      note: "Class placement and academic enrollment records.",
      tone: summary.enrollments ? "green" : "gray",
    },
    studentAttendance: {
      value: summary.presentToday || summary.studentAttendance,
      note: `${summary.todayStudentAttendance} student attendance record(s) today.`,
      tone: summary.presentToday ? "green" : "orange",
    },
    teacherAttendance: {
      value: summary.teacherPresentToday || summary.teacherAttendance,
      note: `${summary.todayTeacherAttendance} teacher attendance record(s) today.`,
      tone: summary.teacherPresentToday ? "green" : "orange",
    },
    announcements: {
      value: summary.announcements,
      note: "Branch broadcasts to teachers, parents, students and accountants.",
      tone: summary.announcements ? "blue" : "gray",
    },
    messages: {
      value: summary.messages,
      note: "Branch conversations and operational follow-ups.",
      tone: summary.messages ? "green" : "gray",
    },
    calendar: {
      value: summary.events,
      note: "Branch events, reminders and academic dates.",
      tone: summary.events ? "blue" : "gray",
    },
    branchTimetable: {
      value: summary.timetables,
      note: `${summary.sessions} timetable session(s) available.`,
      tone: summary.timetables ? "green" : "gray",
    },
    classTimetable: {
      value: summary.sessions,
      note: "Class-level timetable sessions and lesson blocks.",
      tone: summary.sessions ? "blue" : "gray",
    },
    teacherTimetable: {
      value: summary.teachers,
      note: "Teacher lesson allocation and schedule checks.",
      tone: summary.teachers ? "purple" : "gray",
    },
    examTimetable: {
      value: summary.sessions || "Open",
      note: "Exam schedule, rooms, invigilators and conflicts.",
      tone: summary.sessions ? "blue" : "orange",
    },
    resourceTimetable: {
      value: summary.resources || "Open",
      note: "Rooms, halls, resources and booking conflicts.",
      tone: summary.resources ? "green" : "blue",
    },
    organizations: {
      value: summary.organizations,
      note: "Departments, houses, clubs and committees.",
      tone: summary.organizations ? "green" : "gray",
    },
    curriculumSetup: {
      value: summary.curriculums,
      note: `${summary.pathways} pathway(s), ${summary.curriculumSubjects} curriculum subject(s).`,
      tone: summary.curriculums ? "green" : "orange",
    },
    courseOutline: {
      value: "Open",
      note: "Visual course/subject outline connection.",
      tone: "blue",
    },
    curriculumPathways: {
      value: summary.pathways,
      note: "Pathways under branch curriculums.",
      tone: summary.pathways ? "blue" : "gray",
    },
    subjects: {
      value: summary.subjects,
      note: "Branch subjects with media and academic categorization.",
      tone: summary.subjects ? "green" : "orange",
    },
    curriculumSubjects: {
      value: summary.curriculumSubjects,
      note: "Subject rules, credits and curriculum links.",
      tone: summary.curriculumSubjects ? "green" : "gray",
    },
    academicStructures: {
      value: summary.academicStructures,
      note: "Levels, structures and academic organization.",
      tone: summary.academicStructures ? "blue" : "orange",
    },
    academicPeriods: {
      value: summary.academicPeriods,
      note: "Terms, semesters and active school periods.",
      tone: summary.academicPeriods ? "blue" : "orange",
    },
    assessmentStructure: {
      value: summary.assessmentStructures,
      note: `${summary.assessmentItems} assessment item(s).`,
      tone: summary.assessmentStructures ? "purple" : "gray",
    },
    assessmentItems: {
      value: summary.assessmentItems,
      note: "Score items and weights under assessment structures.",
      tone: summary.assessmentItems ? "purple" : "gray",
    },
    assessmentApplicability: {
      value: summary.assessmentApplicabilities,
      note: "Apply assessment systems to class subjects.",
      tone: summary.assessmentApplicabilities ? "green" : "gray",
    },
    gradingSystems: {
      value: summary.gradingSystems,
      note: `${summary.gradingRules} grading rule(s).`,
      tone: summary.gradingSystems ? "purple" : "orange",
    },
    gradingRules: {
      value: summary.gradingRules,
      note: "Grade bands, remarks and GPA rules.",
      tone: summary.gradingRules ? "purple" : "gray",
    },
    studentReports: {
      value: summary.reports,
      note: "Published and draft student report cards.",
      tone: summary.reports ? "green" : "gray",
    },
    broadsheets: {
      value: summary.broadsheets,
      note: "Computed result rows and class broadsheets.",
      tone: summary.broadsheets ? "blue" : "gray",
    },
    promotion: {
      value: summary.promotions,
      note: "Promotion, repeat, graduate and cumulative decisions.",
      tone: summary.promotions ? "green" : "gray",
    },
    cumulativeRecords: {
      value: summary.cumulativeRecords,
      note: "Long-term student academic records.",
      tone: summary.cumulativeRecords ? "blue" : "gray",
    },
    fees: {
      value: summary.pendingFees || summary.fees,
      note: `${summary.fees} fee/invoice record(s), ${summary.pendingFees} pending.`,
      tone: summary.pendingFees ? "orange" : summary.fees ? "green" : "gray",
    },
    incomes: {
      value: money(summary.incomeTotal),
      note: "Branch income records and revenue tracking.",
      tone: summary.incomeTotal ? "green" : "gray",
    },
    expenses: {
      value: money(summary.expenseTotal),
      note: "Branch expenses, categories and vendors.",
      tone: summary.expenseTotal ? "orange" : "gray",
    },
    payroll: {
      value:
        summary.payrollItems || summary.payrollProfiles || summary.teachers,
      note: "Staff pay profiles, runs, items and payouts.",
      tone: summary.payrollItems || summary.payrollProfiles ? "blue" : "gray",
    },
    withdrawMoney: {
      value: summary.withdrawals || "Open",
      note: "Branch withdrawal requests and payout tracking.",
      tone: summary.withdrawals ? "orange" : "gray",
    },
    schoolPayoutSettings: {
      value: summary.payoutSettings || "Open",
      note: "Branch payout method and settlement settings.",
      tone: summary.payoutSettings ? "green" : "purple",
    },
    branchWallet: {
      value: money(
        summary.paymentTotal + summary.incomeTotal - summary.expenseTotal,
      ),
      note: "Estimated branch wallet movement from local records.",
      tone: summary.paymentTotal || summary.incomeTotal ? "green" : "gray",
    },
    settlements: {
      value: summary.settlements,
      note: "Payment settlement history and reconciliation.",
      tone: summary.settlements ? "green" : "gray",
    },
    branchSettings: {
      value: summary.settings || "Open",
      note: "Branch identity, branding and report settings.",
      tone: "purple",
    },
    usersRoles: {
      value: summary.usersRoles,
      note: "Branch-scoped access under the owner/school line of authority.",
      tone: summary.usersRoles ? "green" : "orange",
    },
    localSettings: {
      value: "Open",
      note: "Device display preferences only; branch branding stays protected.",
      tone: "gray",
    },
  };

  if (metricMap[routeKey]) return metricMap[routeKey];

  const guessedTableName = routeKey;
  const guessedRows = rows[guessedTableName] || [];
  if (guessedRows.length) {
    return {
      value: count(guessedRows),
      note: "Auto-counted from matching local table.",
      tone: count(guessedRows) ? "green" : "gray",
    };
  }

  return {
    value: "Open",
    note: "Module is listed from Branch Admin navigation. Add a metric mapping when data is ready.",
    tone: "gray",
  };
}

export default function BranchAdminDashboard({
  navigate,
  navSections,
}: RouteProps) {
  const dataRevision = useDataRevision();
  const router = useRouter();
  const { accountId, authenticated, loading: accountLoading } = useAccount();
  const { settings, loading: settingsLoading } = useSettings();
  const { activeSchoolId, activeBranchId, activeSchool, activeBranch } = useActiveBranch();
  const { activeMembership } = useActiveMembership();
  const primary = settings?.primaryColor || "var(--primary-color,#2563eb)";
  const openWorkspace = useMemo(() => readOpenWorkspaceSession(), []);
  const schoolId = selectedSchoolId({ openWorkspace, activeMembership, activeSchoolId, activeSchool, settings: settings as AnyRow });
  const branchId = selectedBranchId({ openWorkspace, activeMembership, activeBranchId, activeBranch, settings: settings as AnyRow });
  const { loading, setLoading } = useBackgroundLoader();
  const [query, setQuery] = useState("");
  const [rowsByTable, setRowsByTable] = useState<Record<string, AnyRow[]>>({});
  const [moreOpen, setMoreOpen] = useState(false);

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
          return [tableName, tableRows.filter((row) => branchScoped(row, accountId, schoolId, branchId))] as const;
        }),
      );
      setRowsByTable(Object.fromEntries(loaded));
    } catch (error) {
      console.error("Failed to load branch admin dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accountLoading || settingsLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, accountId, schoolId, branchId, accountLoading, settingsLoading, dataRevision]);

  const rows = rowsByTable;

  const identity = useMemo(() => {
    const membership = workspaceMembership(openWorkspace, activeMembership);
    const storedUser =
      safeJson<AnyRow>("currentUser") ||
      safeJson<AnyRow>("authUser") ||
      safeJson<AnyRow>("user");

    const possibleBranchIds = [
      branchId,
      openWorkspace?.branchId,
      membership?.branchId,
      membership?.schoolBranchId,
      membership?.branch?.id,
      (activeBranch as AnyRow)?.id,
      (settings as AnyRow)?.branchId,
      safeRead("activeBranchId"),
    ].map(cleanId).filter(Boolean);

    const possibleSchoolIds = [
      schoolId,
      openWorkspace?.schoolId,
      membership?.schoolId,
      membership?.school?.id,
      (activeSchool as AnyRow)?.id,
      (settings as AnyRow)?.schoolId,
      safeRead("activeSchoolId"),
    ].map(cleanId).filter(Boolean);

    const branchRows = (rows.branches || []).filter(activeRow);
    const schoolRows = (rows.schools || []).filter(activeRow);

    const branch =
      branchRows.find((row) => possibleBranchIds.includes(idOf(row))) ||
      branchRows.find((row) => possibleSchoolIds.includes(cleanId(row.schoolId))) ||
      branchRows[0] ||
      (activeBranch as AnyRow) ||
      membership?.branch ||
      null;

    const resolvedSchoolId = cleanId(branch?.schoolId) || possibleSchoolIds[0] || "";
    const school =
      schoolRows.find((row) => idOf(row) === resolvedSchoolId) ||
      schoolRows.find((row) => possibleSchoolIds.includes(idOf(row))) ||
      schoolRows[0] ||
      (activeSchool as AnyRow) ||
      membership?.school ||
      null;

    const userId = cleanId(
      membership?.userId ||
      membership?.appUserId ||
      openWorkspace?.membership?.userId ||
      storedUser?.id,
    );
    const appUser =
      (rows.appUsers || []).find((row) => idOf(row) === userId) ||
      (rows.appUsers || []).find((row) => cleanId(row.email) === cleanId(membership?.email)) ||
      storedUser ||
      membership?.user ||
      membership?.appUser ||
      null;

    return {
      branch,
      school,
      branchName: text(
        branch?.name || membership?.branchName || (settings as AnyRow)?.branchName,
        "Branch",
      ),
      schoolName: text(
        school?.name || membership?.schoolName || (settings as AnyRow)?.schoolName,
        "School",
      ),
      userName: text(
        appUser?.fullName ||
          appUser?.name ||
          openWorkspace?.fullName ||
          openWorkspace?.userName ||
          openWorkspace?.memberName ||
          membership?.fullName ||
          membership?.userName ||
          membership?.name,
        "Administrator",
      ),
    };
  }, [
    rows.branches,
    rows.schools,
    rows.appUsers,
    branchId,
    schoolId,
    openWorkspace,
    activeMembership,
    activeBranch,
    activeSchool,
    settings,
  ]);

  const summary = useMemo(() => {
    const today = todayKey();
    const students = rows.students || [];
    const teachers = rows.teachers || [];
    const parents = rows.parents || [];
    const classes = rows.classes || [];
    const enrollments = rows.studentEnrollments || [];
    const studentAttendance = rows.attendance || [];
    const teacherAttendance = rows.teacherAttendance || [];
    const todayStudents = studentAttendance.filter((row) => String(row.date || row.createdAt || "").startsWith(today));
    const todayTeachers = teacherAttendance.filter((row) => String(row.date || row.createdAt || "").startsWith(today));
    const statusCount = (value: string) => todayStudents.filter((row) => String(row.status || "").toLowerCase() === value).length;
    return {
      students: count(students),
      teachers: count(teachers),
      parents: count(parents),
      classes: count(classes),
      enrollments: count(enrollments),
      uniqueEnrolledStudents: uniqueCount(enrollments, "studentId"),
      presentToday: statusCount("present"),
      absentToday: statusCount("absent"),
      lateToday: statusCount("late"),
      todayStudentAttendance: todayStudents.length,
      teacherPresentToday: todayTeachers.filter((row) => String(row.status || row.clockIn || "").toLowerCase().includes("present") || row.clockIn).length,
      todayTeacherAttendance: todayTeachers.length,
      announcements: count(rows.announcements || []),
      events: count(rows.calendarEvents || []),
      reports: count(rows.reportCards || []),
      broadsheets: count(rows.computedResults || []),
      branchName: identity.branchName,
      schoolName: identity.schoolName,
    };
  }, [rows, identity]);

  const modules = useMemo<DashboardModule[]>(() => buildNavModules(navSections).map((module) => ({ ...module, ...metricFor(module.routeKey, rows, summary) })), [navSections, rows, summary]);
  const q = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!q) return [];
    return modules.filter((item) => `${item.label} ${item.note} ${item.area}`.toLowerCase().includes(q)).slice(0, 12);
  }, [modules, q]);

  const announcements = useMemo(() => (rows.announcements || []).filter(activeRow).sort((a,b)=>n(b.publishAt || b.sentAt || b.updatedAt || b.createdAt)-n(a.publishAt || a.sentAt || a.updatedAt || a.createdAt)).slice(0,4), [rows.announcements]);
  const events = useMemo(() => (rows.calendarEvents || []).filter(activeRow).sort((a,b)=>n(a.startAt || a.startDate || a.date)-n(b.startAt || b.startDate || b.date)).slice(0,5), [rows.calendarEvents]);
  const recent = useMemo(() => {
    const source: AnyRow[] = [
      ...(rows.students || []).map(row=>({...row,_kind:"Student",_icon:"🧑‍🎓",_title:rowName(row),_date:row.updatedAt||row.createdAt})),
      ...(rows.teachers || []).map(row=>({...row,_kind:"Teacher",_icon:"👨‍🏫",_title:rowName(row),_date:row.updatedAt||row.createdAt})),
      ...(rows.announcements || []).map(row=>({...row,_kind:"Announcement",_icon:"📣",_title:text(row.title,"Announcement"),_date:row.sentAt||row.publishAt||row.updatedAt||row.createdAt})),
      ...(rows.reportCards || []).map(row=>({...row,_kind:"Report",_icon:"📄",_title:text(row.title||row.studentName,"Student report"),_date:row.updatedAt||row.createdAt})),
    ];
    return source.sort((a,b)=>n(b._date)-n(a._date)).slice(0,6);
  }, [rows]);

  const heroSlides = useMemo<HeroSlide[]>(() => {
    const media = (rows.mediaAssets || []).filter(activeRow);
    const now = Date.now();

    const mediaUrl = (mediaId: unknown) => {
      const asset = media.find((row) => idOf(row) === cleanId(mediaId));
      return text(
        asset?.publicUrl ||
          asset?.remoteUrl ||
          asset?.localObjectUrl ||
          asset?.previewDataUrl ||
          asset?.thumbnailDataUrl,
      );
    };

    const defaultImageCandidates = [
      mediaUrl((settings as AnyRow)?.dashboardHeroImageMediaId),
      (settings as AnyRow)?.dashboardHeroImage,
      mediaUrl(identity.branch?.bannerImageMediaId),
      identity.branch?.bannerImage,
      mediaUrl(identity.school?.bannerImageMediaId),
      identity.school?.bannerImage,
      mediaUrl(identity.branch?.photoMediaId),
      identity.branch?.photo,
      mediaUrl(identity.school?.photoMediaId),
      identity.school?.photo,
      mediaUrl((settings as AnyRow)?.dashboardBannerImageMediaId),
      (settings as AnyRow)?.dashboardBannerImage,
    ]
      .map((value) => text(value))
      .filter(Boolean);

    const slides: HeroSlide[] = [];

    // Preserve the existing dashboard image as the permanent first slide.
    if (defaultImageCandidates[0]) {
      slides.push({
        id: "dashboard-hero-image",
        type: "image",
        src: defaultImageCandidates[0],
        durationSeconds: 7,
        transition: "fade",
      });
    }

    const highlightSlides = (rows.portalHighlights || [])
      .filter(activeRow)
      .filter((row) => row?.metadata?.placement !== "gallery")
      .filter((row) => {
        const audiences = Array.isArray(row.audiences)
          ? row.audiences.map((value: unknown) =>
              String(value).toLowerCase(),
            )
          : [
              String(
                row.audience || row.portal || row.role || "all",
              ).toLowerCase(),
            ];

        if (
          !audiences.some((value: string) =>
            ["all", "branch_admin", "branch-admin", "admin"].includes(value),
          )
        ) {
          return false;
        }

        const status = String(row.status || "published").toLowerCase();
        if (!["published", "scheduled", "active"].includes(status)) {
          return false;
        }

        const startAt = Number(row.startAt || 0);
        const endAt = Number(row.endAt || 0);

        if (startAt && startAt > now) return false;
        if (endAt && endAt < now) return false;
        return true;
      })
      .sort(
        (a, b) =>
          n(a.displayOrder || a.order) -
          n(b.displayOrder || b.order),
      )
      .map((row, index): HeroSlide | null => {
        const type =
          String(row.mediaType || "").toLowerCase() === "video"
            ? "video"
            : "image";

        const src =
          mediaUrl(row.mediaAssetId) ||
          (type === "image" ? text(row.fallbackImageUrl) : "");

        const poster =
          mediaUrl(row.posterMediaAssetId) ||
          text(row.fallbackImageUrl);

        if (!src) return null;

        return {
          id: cleanId(idOf(row)) || `portal-highlight-${index}`,
          type,
          src,
          poster: poster || undefined,
          title: text(row.title),
          subtitle: text(row.subtitle || row.description),
          durationSeconds: Math.max(
            3,
            Math.min(30, n(row.durationSeconds || 7)),
          ),
          transition:
            row.transition === "slide" ? "slide" : "fade",
          actionType: text(row.actionType),
          actionLabel: text(row.actionLabel),
          actionValue: text(row.actionValue),
        };
      })
      .filter((row): row is HeroSlide => Boolean(row));

    slides.push(...highlightSlides);
    return slides;
  }, [
    identity,
    rows.mediaAssets,
    rows.portalHighlights,
    settings,
  ]);

  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const activeHeroSlide =
    heroSlides[heroSlideIndex % Math.max(1, heroSlides.length)] || null;

  useEffect(() => {
    if (!heroSlides.length) {
      setHeroSlideIndex(0);
      return;
    }

    if (heroSlideIndex >= heroSlides.length) {
      setHeroSlideIndex(0);
      return;
    }

    // Videos advance when playback ends.
    if (activeHeroSlide?.type === "video") return;

    const timer = window.setTimeout(() => {
      setHeroSlideIndex((current) => (current + 1) % heroSlides.length);
    }, (activeHeroSlide?.durationSeconds || 7) * 1000);

    return () => window.clearTimeout(timer);
  }, [
    activeHeroSlide?.durationSeconds,
    activeHeroSlide?.id,
    activeHeroSlide?.type,
    heroSlideIndex,
    heroSlides.length,
  ]);

  function advanceHero() {
    if (heroSlides.length <= 1) return;
    setHeroSlideIndex((current) => (current + 1) % heroSlides.length);
  }

  function openHeroAction(slide: HeroSlide) {
    if (!slide.actionType || slide.actionType === "none") return;

    if (slide.actionType === "portal_route" && slide.actionValue) {
      openRoute(slide.actionValue);
      return;
    }

    if (
      slide.actionType === "external_url" &&
      slide.actionValue &&
      typeof window !== "undefined"
    ) {
      window.open(slide.actionValue, "_blank", "noopener,noreferrer");
      return;
    }

    if (slide.actionType === "announcement") {
      openRoute("announcements");
      return;
    }

    if (slide.actionType === "calendar_event") {
      openRoute("calendar");
    }
  }

  const branchRecord = identity.branch;
  const schoolRecord = identity.school;
  const motto = text(
    (settings as AnyRow)?.motto ||
      branchRecord?.motto ||
      schoolRecord?.motto,
    "Learning today. Leading tomorrow.",
  );
  const userName = identity.userName;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  function openRoute(routeKey: string) {
    if (navigate) return navigate(routeKey);
    try {
      window.dispatchEvent(new CustomEvent("eleeveon:portal-route", { detail: { key: routeKey } }));
      window.dispatchEvent(new CustomEvent("role-portal:navigate", { detail: { key: routeKey } }));
      window.dispatchEvent(new CustomEvent("portal:navigate", { detail: routeKey }));
    } catch {}
  }

  if (loading || accountLoading || settingsLoading) return <State primary={primary} title="Opening branch dashboard..." text="Preparing your school home, attendance, announcements and activity." />;
  if (!authenticated || !accountId) return <State primary={primary} title="Redirecting to login..." text="You must sign in before viewing the branch dashboard." />;

  const quickActions = [
    ["students","＋","Student"],
    ["studentAttendance","✓","Attendance"],
    ["assessmentEntry","✎","Assessment"],
    ["studentReports","▤","Reports"],
    ["announcements","📣","Announce"],
  ] as const;

  return <main className="bd-page" style={{"--bd-primary":primary} as React.CSSProperties}>
    <style>{css}</style>
    <section className="bd-search-card">
      <span className={`status-dot-mini ${summary.students || summary.classes ? "green" : "gray"}`} title={summary.branchName}/>
      <label className="bd-search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search students, attendance, reports..." aria-label="Search branch modules"/></label>
      {query ? <button className="bd-clear" onClick={()=>setQuery("")} aria-label="Clear search">×</button> : null}
      <button className="bd-refresh" onClick={load} aria-label="Refresh dashboard">↻</button>
      <button className="bd-more" onClick={()=>setMoreOpen(true)} aria-label="More options">⋯</button>
    </section>

    {q ? <section className="bd-search-results">
      <div className="bd-section-head"><div><span>Search results</span><h2>{searchResults.length ? `Matching “${query.trim()}”` : "No matches found"}</h2></div><b>{searchResults.length}</b></div>
      {searchResults.map(item=><button key={item.key} className="branch-row" onClick={()=>openRoute(item.routeKey)}><span className="branch-avatar">{item.icon}</span><span className="branch-main"><strong>{item.label}</strong><small>{item.note}</small><em>{areaLabel(item.area)}</em></span><span className="branch-side"><Chip tone={item.tone}>{item.value}</Chip><i>›</i></span></button>)}
      {!searchResults.length ? <Empty title="Nothing matches that search" text="Try a module name such as students, attendance, reports, fees or settings."/> : null}
    </section> : <>
      <section
        className={`bd-hero ${activeHeroSlide ? "has-media" : ""} ${
          activeHeroSlide?.transition === "slide"
            ? "slide-transition"
            : "fade-transition"
        }`}
      >
        {activeHeroSlide ? (
          <div key={activeHeroSlide.id} className="bd-hero-media">
            {activeHeroSlide.type === "video" ? (
              <video
                src={activeHeroSlide.src}
                poster={activeHeroSlide.poster}
                autoPlay
                muted
                playsInline
                preload="metadata"
                onEnded={advanceHero}
                onError={advanceHero}
              />
            ) : (
              <img src={activeHeroSlide.src} alt="" />
            )}
            <span className="bd-hero-shade" />
          </div>
        ) : null}

        <div className="bd-hero-copy"><span>{greeting}</span><h1>{userName}</h1><p>Welcome to <strong>{summary.schoolName}</strong><small className="bd-branch-name">{summary.branchName}</small></p><blockquote>“{motto}”</blockquote></div>

        {activeHeroSlide?.title ? (
          <div className="bd-highlight-copy">
            <b>{activeHeroSlide.title}</b>
            {activeHeroSlide.subtitle ? (
              <small>{activeHeroSlide.subtitle}</small>
            ) : null}
            {activeHeroSlide.actionLabel ? (
              <button
                type="button"
                onClick={() => openHeroAction(activeHeroSlide)}
              >
                {activeHeroSlide.actionLabel}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="bd-hero-stats"><span><b>{summary.students}</b> Students</span><span><b>{summary.teachers}</b> Teachers</span><span><b>{summary.classes}</b> Classes</span></div>

        {heroSlides.length > 1 ? (
          <div className="bd-hero-dots" aria-label="Hero slides">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={index === heroSlideIndex ? "active" : ""}
                onClick={() => setHeroSlideIndex(index)}
                aria-label={`Show hero slide ${index + 1}`}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="bd-quick-actions" aria-label="Quick actions">{quickActions.map(([route,icon,label])=><button key={route} onClick={()=>openRoute(route)}><span>{icon}</span><b>{label}</b></button>)}</section>

      <section className="bd-dashboard-grid">
        <article className="bd-card attendance-card"><div className="bd-section-head"><div><span>Today</span><h2>Attendance</h2></div><button onClick={()=>openRoute("studentAttendance")}>Open</button></div><div className="attendance-main"><strong>{summary.presentToday}</strong><span>students present</span></div><div className="attendance-grid"><div><b>{summary.absentToday}</b><small>Absent</small></div><div><b>{summary.lateToday}</b><small>Late</small></div><div><b>{summary.teacherPresentToday}</b><small>Teachers</small></div><div><b>{summary.todayStudentAttendance}</b><small>Recorded</small></div></div></article>

        <article className="bd-card"><div className="bd-section-head"><div><span>School day</span><h2>Upcoming</h2></div><button onClick={()=>openRoute("calendar")}>Calendar</button></div><div className="bd-stack">{events.length ? events.map((event,index)=><button key={idOf(event)||index} onClick={()=>openRoute("calendar")} className="event-row"><time>{dateLabel(event.startAt||event.startDate||event.date).split(",")[0]}</time><span><b>{text(event.title||event.name,"School event")}</b><small>{text(event.location||event.venue,"School calendar")}</small></span></button>) : <MiniEmpty icon="🗓️" text="No upcoming events yet."/>}</div></article>

        <article className="bd-card announcements-card"><div className="bd-section-head"><div><span>Notice board</span><h2>Announcements</h2></div><button onClick={()=>openRoute("announcements")}>View all</button></div><div className="bd-stack">{announcements.length ? announcements.map((item,index)=><button key={idOf(item)||index} onClick={()=>openRoute("announcements")} className="notice-row"><span>📣</span><div><b>{text(item.title,"Announcement")}</b><small>{text(item.message||item.body||item.content,"Open to read this school update.").slice(0,100)}</small></div></button>) : <MiniEmpty icon="📣" text="No announcements published."/>}</div></article>

        <article className="bd-card"><div className="bd-section-head"><div><span>At a glance</span><h2>School community</h2></div></div><div className="community-grid"><Metric label="Students" value={summary.students} icon="🧑‍🎓"/><Metric label="Teachers" value={summary.teachers} icon="👨‍🏫"/><Metric label="Parents" value={summary.parents} icon="👪"/><Metric label="Reports" value={summary.reports} icon="📄"/></div></article>
      </section>

      <section className="bd-card bd-recent"><div className="bd-section-head"><div><span>Latest changes</span><h2>Recent activity</h2></div><b>{recent.length}</b></div><div className="bd-recent-list">{recent.length ? recent.map((item,index)=><article key={`${item._kind}-${idOf(item)||index}`} className="recent-row"><span>{item._icon}</span><b>{item._title}</b><small>{item._kind} · {dateLabel(item._date)}</small></article>) : <MiniEmpty icon="✨" text="School activity will appear here."/>}</div></section>
    </>}

    {moreOpen ? <div className="bd-sheet-backdrop" role="dialog" aria-modal="true"><section className="bd-sheet"><div className="bd-sheet-head"><div><h2>Branch home</h2><p>Useful dashboard controls and direct destinations.</p></div><button onClick={()=>setMoreOpen(false)}>✕</button></div><div className="bd-menu-list"><button onClick={()=>{setMoreOpen(false);load()}}><span>↻</span><b>Refresh dashboard</b><small>Reload branch data from this device</small></button><button onClick={()=>{setMoreOpen(false);openRoute("branchSettings")}}><span>⚙</span><b>Branch identity</b><small>Update branding, motto and report settings</small></button><button onClick={()=>{setMoreOpen(false);openRoute("calendar")}}><span>🗓</span><b>School calendar</b><small>Manage dates, events and reminders</small></button></div></section></div> : null}
  </main>;
}

function Metric({label,value,icon}:{label:string;value:string|number;icon:string}){return <div className="metric"><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>}
function MiniEmpty({icon,text:body}:{icon:string;text:string}){return <div className="mini-empty"><span>{icon}</span><p>{body}</p></div>}
function State({primary,title,text:body}:{primary:string;title:string;text:string}){return <main className="bd-page" style={{"--bd-primary":primary} as React.CSSProperties}><style>{css}</style><section className="bd-state"><div className="bd-spinner"/><h2>{title}</h2><p>{body}</p></section></main>}

const css = `
@keyframes spin{to{transform:rotate(360deg)}}
.bd-page{--ease:cubic-bezier(.2,.8,.2,1);min-height:100dvh;padding:8px;padding-bottom:max(40px,env(safe-area-inset-bottom));background:radial-gradient(circle at top left,color-mix(in srgb,var(--bd-primary) 10%,transparent),transparent 34rem),var(--bg,#f7f8fb);color:var(--text,#111827);font-family:var(--font-family,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);overflow-x:hidden}.bd-page *{box-sizing:border-box;min-width:0}.bd-page button,.bd-page input{font:inherit}.bd-page button{cursor:pointer;-webkit-tap-highlight-color:transparent}.bd-search-card,.bd-card,.bd-state,.bd-search-results,.branch-row,.bd-sheet{background:var(--card-bg,var(--surface,#fff));border:1px solid var(--border,rgba(0,0,0,.1));box-shadow:0 12px 30px rgba(15,23,42,.05)}
.bd-search-card{position:sticky;top:6px;z-index:20;display:grid;grid-template-columns:auto minmax(0,1fr) auto auto auto;align-items:center;gap:7px;padding:7px;border-radius:22px;backdrop-filter:blur(16px)}.status-dot-mini{width:9px;height:9px;border-radius:99px}.status-dot-mini.green{background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.12)}.status-dot-mini.gray{background:#94a3b8}.bd-search{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:8px;min-height:43px;padding:0 12px;border-radius:17px;background:color-mix(in srgb,var(--muted,#64748b) 7%,transparent)}.bd-search>span{font-size:18px;color:var(--muted,#64748b);font-weight:1000}.bd-search input{width:100%;border:0;outline:0;background:transparent;color:var(--text,#111827);font-size:14px;font-weight:750}.bd-search input::placeholder{color:var(--muted,#64748b)}.bd-clear,.bd-refresh,.bd-more{width:40px;height:40px;border-radius:99px;border:1px solid var(--border,rgba(0,0,0,.1));background:var(--surface,#fff);color:var(--text,#111827);font-size:18px;font-weight:1000}.bd-refresh{background:var(--bd-primary);border-color:var(--bd-primary);color:#fff}
.bd-hero{position:relative;min-height:270px;margin-top:10px;border-radius:30px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;color:#fff;background:linear-gradient(135deg,color-mix(in srgb,var(--bd-primary) 95%,#111827),color-mix(in srgb,var(--bd-primary) 55%,#0f172a));box-shadow:0 22px 60px color-mix(in srgb,var(--bd-primary) 20%,transparent)}.bd-hero:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 85% 18%,rgba(255,255,255,.18),transparent 26%);pointer-events:none;z-index:1}.bd-hero-media{position:absolute;inset:0;z-index:0}.bd-hero-media img,.bd-hero-media video{width:100%;height:100%;object-fit:cover;display:block}.bd-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,15,32,.88),rgba(7,15,32,.32))}.bd-hero.fade-transition .bd-hero-media{animation:bdHeroFade .55s ease}.bd-hero.slide-transition .bd-hero-media{animation:bdHeroSlide .55s ease}@keyframes bdHeroFade{from{opacity:.25}to{opacity:1}}@keyframes bdHeroSlide{from{opacity:.5;transform:translateX(3%)}to{opacity:1;transform:none}}.bd-hero-copy,.bd-hero-stats,.bd-highlight-copy,.bd-hero-dots{position:relative;z-index:2}.bd-hero-copy>span{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;opacity:.85}.bd-hero h1{margin:7px 0 4px;font-size:clamp(28px,7vw,48px);line-height:.98;letter-spacing:-.06em}.bd-hero p{margin:0;font-size:14px}.bd-branch-name{display:block;width:max-content;max-width:100%;margin-top:7px;padding:5px 9px;border:1px solid rgba(255,255,255,.22);border-radius:10px;background:rgba(255,255,255,.12);backdrop-filter:blur(8px);font-size:11px;font-weight:850}.bd-hero blockquote{margin:18px 0 0;max-width:38rem;font-size:13px;line-height:1.55;font-weight:750;opacity:.9}.bd-hero-stats{display:flex;flex-wrap:wrap;gap:8px;margin-top:26px}.bd-hero-stats span{display:flex;align-items:baseline;gap:5px;padding:8px 11px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(255,255,255,.12);backdrop-filter:blur(10px);font-size:11px;font-weight:850}.bd-hero-stats b{font-size:15px}.bd-highlight-copy{align-self:flex-start;display:grid;gap:3px;margin-top:auto;margin-bottom:10px;max-width:min(520px,90%)}.bd-highlight-copy>b{font-size:15px}.bd-highlight-copy>small{font-size:10px;line-height:1.45;opacity:.88}.bd-highlight-copy>button{width:max-content;margin-top:5px;padding:7px 10px;border:1px solid rgba(255,255,255,.25);border-radius:999px;background:rgba(255,255,255,.14);color:#fff;font-size:10px;font-weight:900;backdrop-filter:blur(8px)}.bd-hero-dots{position:absolute;right:16px;bottom:16px;display:flex;gap:5px}.bd-hero-dots button{width:7px;height:7px;padding:0;border:0;border-radius:99px;background:rgba(255,255,255,.42)}.bd-hero-dots button.active{width:20px;background:#fff}
.bd-quick-actions{display:grid;grid-template-columns:repeat(5,minmax(74px,1fr));gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}.bd-quick-actions::-webkit-scrollbar{display:none}.bd-quick-actions button{min-height:76px;border:1px solid var(--border,rgba(0,0,0,.1));border-radius:22px;background:var(--card-bg,var(--surface,#fff));color:var(--text,#111827);display:grid;place-items:center;align-content:center;gap:7px;box-shadow:0 10px 24px rgba(15,23,42,.04)}.bd-quick-actions span{width:34px;height:34px;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--bd-primary) 11%,transparent);color:var(--bd-primary);font-size:17px;font-weight:1000}.bd-quick-actions b{font-size:11px;font-weight:950;white-space:nowrap}
.bd-dashboard-grid{display:grid;gap:10px;margin-top:10px}.bd-card{padding:14px;border-radius:26px}.bd-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}.bd-section-head span{display:block;color:var(--muted,#64748b);font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.1em}.bd-section-head h2{margin:3px 0 0;font-size:17px;font-weight:1000;letter-spacing:-.035em}.bd-section-head>button,.bd-section-head>b{border:0;border-radius:999px;padding:7px 10px;background:color-mix(in srgb,var(--bd-primary) 10%,transparent);color:var(--bd-primary);font-size:10px;font-weight:950}.attendance-card{background:linear-gradient(145deg,color-mix(in srgb,var(--bd-primary) 7%,var(--surface,#fff)),var(--surface,#fff))}.attendance-main strong{display:block;font-size:46px;line-height:1;font-weight:1000;letter-spacing:-.07em}.attendance-main span{color:var(--muted,#64748b);font-size:12px;font-weight:850}.attendance-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:15px}.attendance-grid div{padding:10px 7px;border-radius:16px;background:color-mix(in srgb,var(--muted,#64748b) 7%,transparent);text-align:center}.attendance-grid b,.attendance-grid small{display:block}.attendance-grid b{font-size:17px}.attendance-grid small{margin-top:3px;color:var(--muted,#64748b);font-size:9px;font-weight:850}
.bd-stack{display:grid;gap:7px}.event-row,.notice-row{width:100%;border:0;border-radius:17px;padding:9px;background:color-mix(in srgb,var(--muted,#64748b) 6%,transparent);color:inherit;text-align:left}.event-row{display:grid;grid-template-columns:72px minmax(0,1fr);gap:9px;align-items:center}.event-row time{font-size:10px;font-weight:950;color:var(--bd-primary)}.event-row b,.event-row small,.notice-row b,.notice-row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.event-row b,.notice-row b{font-size:12px;font-weight:1000}.event-row small,.notice-row small{margin-top:3px;color:var(--muted,#64748b);font-size:10px;font-weight:750}.notice-row{display:grid;grid-template-columns:34px minmax(0,1fr);gap:9px;align-items:center}.notice-row>span{width:34px;height:34px;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--bd-primary) 10%,transparent)}.community-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.metric{padding:13px;border-radius:18px;background:color-mix(in srgb,var(--muted,#64748b) 6%,transparent)}.metric span,.metric strong,.metric small{display:block}.metric span{font-size:18px}.metric strong{margin-top:10px;font-size:24px;line-height:1;font-weight:1000;letter-spacing:-.05em}.metric small{margin-top:4px;color:var(--muted,#64748b);font-size:10px;font-weight:850}
.bd-recent{margin-top:10px}.bd-recent-list{display:grid;gap:7px}.recent-row{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:9px;align-items:center;padding:9px;border-radius:17px;background:color-mix(in srgb,var(--muted,#64748b) 5%,transparent)}.recent-row span{grid-row:span 2;width:34px;height:34px;display:grid;place-items:center;border-radius:13px;background:color-mix(in srgb,var(--bd-primary) 10%,transparent)}.recent-row b,.recent-row small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.recent-row b{font-size:12px}.recent-row small{font-size:10px;color:var(--muted,#64748b);font-weight:750}.mini-empty{min-height:110px;display:grid;place-items:center;align-content:center;text-align:center;color:var(--muted,#64748b)}.mini-empty span{font-size:26px}.mini-empty p{margin:6px 0 0;font-size:11px;font-weight:800}
.bd-search-results{margin-top:10px;padding:12px;border-radius:26px}.branch-row{width:100%;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;margin-top:7px;padding:10px;border-radius:20px;text-align:left;color:inherit}.branch-avatar{width:46px;height:46px;display:grid;place-items:center;border-radius:17px;background:color-mix(in srgb,var(--bd-primary) 11%,transparent);font-size:21px}.branch-main strong,.branch-main small,.branch-main em{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.branch-main strong{font-size:13px;font-weight:1000}.branch-main small{margin-top:3px;color:var(--muted,#64748b);font-size:10px;font-weight:800}.branch-main em{margin-top:3px;color:var(--bd-primary);font-size:9px;font-style:normal;font-weight:900}.branch-side{display:flex;align-items:center;gap:7px}.branch-side i{font-style:normal;color:var(--muted,#64748b)}.bd-chip{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:950}.bd-chip.green{background:rgba(34,197,94,.12);color:#16a34a}.bd-chip.blue{background:rgba(59,130,246,.12);color:#2563eb}.bd-chip.orange{background:rgba(245,158,11,.14);color:#b45309}.bd-chip.purple{background:rgba(147,51,234,.12);color:#7e22ce}.bd-chip.gray{background:rgba(100,116,139,.12);color:#64748b}.bd-chip.red{background:rgba(239,68,68,.12);color:#dc2626}.bd-empty{min-height:220px;display:grid;place-items:center;align-content:center;text-align:center}.bd-empty div{font-size:28px}.bd-empty h3{margin:8px 0 0}.bd-empty p{max-width:30rem;margin:5px 0 0;color:var(--muted,#64748b);font-size:12px}
.bd-sheet-backdrop{position:fixed;inset:0;z-index:80;display:grid;place-items:end center;padding:10px;background:rgba(15,23,42,.5);backdrop-filter:blur(12px)}.bd-sheet{width:min(520px,100%);padding:14px;border-radius:28px}.bd-sheet-head{display:flex;justify-content:space-between;gap:10px}.bd-sheet-head h2{margin:0;font-size:20px}.bd-sheet-head p{margin:4px 0 0;color:var(--muted,#64748b);font-size:11px}.bd-sheet-head button{width:38px;height:38px;border:1px solid var(--border,rgba(0,0,0,.1));border-radius:99px;background:var(--surface,#fff);color:inherit}.bd-menu-list{display:grid;gap:8px;margin-top:12px}.bd-menu-list button{display:grid;grid-template-columns:40px minmax(0,1fr);column-gap:10px;align-items:center;width:100%;padding:9px;border:1px solid var(--border,rgba(0,0,0,.1));border-radius:18px;background:var(--surface,#fff);color:inherit;text-align:left}.bd-menu-list button>span{grid-row:span 2;width:40px;height:40px;display:grid;place-items:center;border-radius:14px;background:color-mix(in srgb,var(--bd-primary) 10%,transparent);color:var(--bd-primary)}.bd-menu-list b,.bd-menu-list small{display:block}.bd-menu-list b{font-size:12px}.bd-menu-list small{color:var(--muted,#64748b);font-size:10px}.bd-state{min-height:min(420px,calc(100dvh - 20px));display:grid;place-items:center;align-content:center;text-align:center;border-radius:28px}.bd-spinner{width:38px;height:38px;border:4px solid color-mix(in srgb,var(--bd-primary) 18%,transparent);border-top-color:var(--bd-primary);border-radius:99px;animation:spin .8s linear infinite}.bd-state h2{margin:10px 0 0}.bd-state p{max-width:32rem;margin:5px 0 0;color:var(--muted,#64748b);font-size:12px}
@media(min-width:700px){.bd-page{padding:12px}.bd-dashboard-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.bd-recent-list{grid-template-columns:repeat(2,minmax(0,1fr))}.bd-sheet-backdrop{place-items:center}.bd-hero{min-height:320px;padding:30px}.community-grid{grid-template-columns:repeat(4,1fr)}}
@media(min-width:1080px){.bd-page{padding:16px}.bd-search-card,.bd-hero,.bd-quick-actions,.bd-dashboard-grid,.bd-recent,.bd-search-results{max-width:1180px;margin-left:auto;margin-right:auto}.bd-dashboard-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.bd-recent-list{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:560px){.bd-page{padding:7px}.bd-search-card{grid-template-columns:auto minmax(0,1fr) auto auto}.bd-clear{display:none}.bd-quick-actions{grid-template-columns:repeat(5,82px)}.bd-hero{min-height:290px;padding:18px}.bd-hero-stats{gap:6px}.attendance-grid{grid-template-columns:repeat(2,1fr)}.branch-row{grid-template-columns:auto minmax(0,1fr)}.branch-side{grid-column:1/-1;justify-content:flex-end}}
`;
