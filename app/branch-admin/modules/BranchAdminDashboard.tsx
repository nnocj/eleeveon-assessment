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

import {
  ActivityFeed,
  CalendarPreview,
  DashboardBackground,
  DashboardHeader,
  DashboardSection,
  DashboardWidget,
  DashboardWidgets,
  QuickActionGrid,
  StatisticCard,
  StatisticGrid,
  WelcomeHero,
} from "../../components/dashboard";

import {
  CommunicationIcon,
  AssessmentIcon,
  AttendanceIcon,
  ReportsIcon,
  StudentIcon,
  TeacherIcon,
  ParentIcon,
  CalendarIcon,
} from "../../components/icons";

import {
  Button,
  Dialog,
  EmptyState,
} from "../../components/ui";
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

  if (loading || accountLoading || settingsLoading) {
    return (
      <DashboardBackground primaryColor={primary}>
        <section className="eds-dashboard-state">
          <div className="eds-dashboard-state-spinner" />
          <h2>Opening branch dashboard...</h2>
          <p>
            Preparing your school home, attendance,
            announcements and activity.
          </p>
        </section>
      </DashboardBackground>
    );
  }

  if (!authenticated || !accountId) {
    return (
      <DashboardBackground primaryColor={primary}>
        <section className="eds-dashboard-state">
          <h2>Redirecting to login...</h2>
          <p>
            You must sign in before viewing the branch
            dashboard.
          </p>
        </section>
      </DashboardBackground>
    );
  }

  const quickActions = [
    {
      key: "students",
      label: "Student",
      icon: <StudentIcon />,
      onClick: () => openRoute("students"),
    },
    {
      key: "studentAttendance",
      label: "Attendance",
      icon: <AttendanceIcon />,
      onClick: () => openRoute("studentAttendance"),
    },
    {
      key: "assessmentEntries",
      label: "Assessment",
      icon: <AssessmentIcon />,
      onClick: () => openRoute("assessmentEntries"),
    },
    {
      key: "studentReports",
      label: "Reports",
      icon: <ReportsIcon />,
      onClick: () => openRoute("studentReports"),
    },
    {
      key: "announcements",
      label: "Announce",
      icon: <CommunicationIcon />,
      onClick: () => openRoute("announcements"),
    },
  ];

  const heroStats = [
    { label: "Students", value: summary.students },
    { label: "Teachers", value: summary.teachers },
    { label: "Classes", value: summary.classes },
  ];

  return (
    <DashboardBackground primaryColor={primary}>
      <style>{branchDashboardToolbarCss}</style>

      <div className="branch-dashboard-toolbar">
        <DashboardHeader
          query={query}
          onQueryChange={setQuery}
          onClear={() => setQuery("")}
          onRefresh={load}
          onMore={() => setMoreOpen(true)}
          placeholder="Search students, attendance, reports..."
          active={Boolean(summary.students || summary.classes)}
          statusLabel={summary.branchName}
        />
      </div>

      {q ? (
        <section className="eds-dashboard-search-results">
          <DashboardSection
            eyebrow="Search results"
            title={
              searchResults.length
                ? `Matching “${query.trim()}”`
                : "No matches found"
            }
            action={<b>{searchResults.length}</b>}
          >
            {searchResults.map((item) => (
              <button
                key={item.key}
                type="button"
                className="eds-dashboard-search-row"
                onClick={() => openRoute(item.routeKey)}
              >
                <span className="eds-dashboard-search-icon">
                  {item.icon}
                </span>
                <span className="eds-dashboard-search-copy">
                  <strong>{item.label}</strong>
                  <small>{item.note}</small>
                  <em>{areaLabel(item.area)}</em>
                </span>
                <b>{item.value}</b>
              </button>
            ))}

            {!searchResults.length ? (
              <EmptyState
                icon="⌕"
                title="Nothing matches that search"
                description="Try a module name such as students, attendance, reports, fees or settings."
                compact
              />
            ) : null}
          </DashboardSection>
        </section>
      ) : (
        <>
          <WelcomeHero
            greeting={greeting}
            name={userName}
            schoolName={summary.schoolName}
            branchName={summary.branchName}
            motto={motto}
            slide={activeHeroSlide}
            slides={heroSlides}
            slideIndex={heroSlideIndex}
            stats={heroStats}
            onAdvance={advanceHero}
            onSlideChange={setHeroSlideIndex}
            onSlideAction={() => {
              if (activeHeroSlide) {
                openHeroAction(activeHeroSlide);
              }
            }}
          />

          <QuickActionGrid actions={quickActions} />

          <DashboardWidgets>
            <DashboardWidget>
              <DashboardSection
                eyebrow="Today"
                title="Attendance"
                action={
                  <button
                    type="button"
                    onClick={() => openRoute("studentAttendance")}
                  >
                    Open
                  </button>
                }
              >
                <StatisticGrid>
                  <StatisticCard
                    label="Present"
                    value={summary.presentToday}
                    icon={<AttendanceIcon />}
                  />
                  <StatisticCard
                    label="Absent"
                    value={summary.absentToday}
                  />
                  <StatisticCard
                    label="Late"
                    value={summary.lateToday}
                  />
                  <StatisticCard
                    label="Teachers"
                    value={summary.teacherPresentToday}
                    icon={<TeacherIcon />}
                  />
                </StatisticGrid>
              </DashboardSection>
            </DashboardWidget>

            <DashboardWidget>
              <DashboardSection
                eyebrow="School day"
                title="Upcoming"
                action={
                  <button
                    type="button"
                    onClick={() => openRoute("calendar")}
                  >
                    Calendar
                  </button>
                }
              >
                <CalendarPreview
                  items={events.map((event, index) => ({
                    id: idOf(event) || String(index),
                    date: dateLabel(
                      event.startAt ||
                      event.startDate ||
                      event.date,
                    ).split(",")[0],
                    title: text(
                      event.title || event.name,
                      "School event",
                    ),
                    description: text(
                      event.location || event.venue,
                      "School calendar",
                    ),
                    onClick: () => openRoute("calendar"),
                  }))}
                />
              </DashboardSection>
            </DashboardWidget>

            <DashboardWidget>
              <DashboardSection
                eyebrow="Notice board"
                title="Announcements"
                action={
                  <button
                    type="button"
                    onClick={() => openRoute("announcements")}
                  >
                    View all
                  </button>
                }
              >
                <ActivityFeed
                  items={announcements.map((item, index) => ({
                    id: idOf(item) || String(index),
                    title: text(item.title, "Announcement"),
                    meta: text(
                      item.message ||
                      item.body ||
                      item.content,
                      "Open to read this school update.",
                    ).slice(0, 100),
                    icon: <CommunicationIcon />,
                    onClick: () => openRoute("announcements"),
                  }))}
                  emptyText="No announcements published."
                />
              </DashboardSection>
            </DashboardWidget>

            <DashboardWidget>
              <DashboardSection
                eyebrow="Latest changes"
                title="Recent activity"
                action={<b>{recent.length}</b>}
              >
                <ActivityFeed
                  items={recent.map((item, index) => ({
                    id: `${item._kind}-${idOf(item) || index}`,
                    title: item._title,
                    meta: `${item._kind} · ${dateLabel(item._date)}`,
                    icon: item._icon,
                  }))}
                  emptyText="School activity will appear here."
                />
              </DashboardSection>
            </DashboardWidget>
          </DashboardWidgets>
        </>
      )}

      <Dialog
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Branch home"
        description="Useful dashboard controls and direct destinations."
        footer={
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setMoreOpen(false)}
          >
            Close
          </Button>
        }
      >
        <div className="eds-dashboard-more-list">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setMoreOpen(false);
              void load();
            }}
          >
            Refresh dashboard
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setMoreOpen(false);
              openRoute("branchSettings");
            }}
          >
            Branch identity and settings
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setMoreOpen(false);
              openRoute("calendar");
            }}
          >
            School calendar
          </Button>
        </div>
      </Dialog>
    </DashboardBackground>
  );
}

const branchDashboardToolbarCss = `

/* Theme-safe compact dashboard toolbar -------------------------------- */
.branch-dashboard-toolbar {
  width: 100%;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: visible;
}

.branch-dashboard-toolbar
.eds-dashboard-header {
  position: relative;
  top: auto;
  width: min(100%, 380px);
  max-width: 380px;
  flex: 0 1 380px;
  margin: 0;

  background:
    color-mix(
      in srgb,
      var(
        --eds-header-bg,
        var(--eds-surface, #ffffff)
      ) 96%,
      transparent
    ) !important;

  color:
    var(
      --eds-text,
      #111827
    ) !important;

  border-color:
    var(
      --eds-border,
      rgba(15,23,42,.09)
    ) !important;

  box-shadow:
    var(
      --eds-shadow-soft,
      0 10px 26px rgba(15,23,42,.07)
    ) !important;
}

.branch-dashboard-toolbar
.eds-dashboard-header input {
  background: transparent !important;
  color:
    var(
      --eds-text-strong,
      var(--eds-text, #111827)
    ) !important;
  caret-color:
    var(
      --eds-primary,
      var(--primary-color, #2563eb)
    );
}

.branch-dashboard-toolbar
.eds-dashboard-header input::placeholder {
  color:
    var(
      --eds-text-muted,
      #667085
    ) !important;
  opacity: .9;
}

.branch-dashboard-toolbar
.eds-dashboard-header button {
  color:
    var(
      --eds-text-strong,
      var(--eds-text, #111827)
    );
  border-color:
    var(
      --eds-border,
      rgba(15,23,42,.09)
    );
}

.branch-dashboard-toolbar
.eds-dashboard-header button:hover {
  background:
    var(
      --eds-primary-softer,
      color-mix(
        in srgb,
        var(--primary-color, #2563eb) 7%,
        transparent
      )
    );
}

/*
 * Dashboard delegates vertical scrolling to the document/window.
 * It must not create another page-level scrolling context.
 */
.eds-dashboard,
.eds-dashboard-inner,
.eds-dashboard-search-results,
.eds-dashboard-widgets,
.eds-dashboard-widget {
  height: auto !important;
  max-height: none !important;
  overflow-y: visible !important;
}

.eds-dashboard {
  overflow-x: clip !important;
}

.eds-dashboard-inner {
  min-height: 0;
}

@media (min-width: 1100px) {
  .branch-dashboard-toolbar
  .eds-dashboard-header {
    width:
      clamp(
        300px,
        27vw,
        380px
      );
    max-width: 380px;
    flex-basis:
      clamp(
        300px,
        27vw,
        380px
      );
  }
}

@media (min-width: 700px) and (max-width: 1099px) {
  .branch-dashboard-toolbar
  .eds-dashboard-header {
    width:
      clamp(
        300px,
        42vw,
        360px
      );
    max-width: 360px;
    flex-basis:
      clamp(
        300px,
        42vw,
        360px
      );
  }
}

@media (max-width: 699px) {
  .branch-dashboard-toolbar {
    justify-content: stretch;
  }

  .branch-dashboard-toolbar
  .eds-dashboard-header {
    width: 100%;
    max-width: none;
    flex-basis: 100%;
  }
}



/* Final single-window-scroll ownership -------------------------------- */
html {
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

body {
  overflow-x: hidden;
  overflow-y: visible;
}

.eds-dashboard,
.eds-dashboard-inner,
.eds-dashboard-state,
.eds-dashboard-search-results,
.eds-dashboard-widgets,
.eds-dashboard-widget,
.eds-dashboard-section,
.eds-dashboard-background,
.eds-dashboard-hero,
.eds-welcome-hero,
.branch-dashboard-toolbar {
  height: auto !important;
  max-height: none !important;
  min-height: 0;
  overflow-y: visible !important;
  overscroll-behavior-y: auto !important;
  scrollbar-gutter: auto !important;
}

.eds-dashboard,
.eds-dashboard-inner,
.eds-dashboard-background {
  overflow-x: clip !important;
}

.eds-dashboard-search-results,
.eds-dashboard-widgets,
.eds-dashboard-widget,
.eds-dashboard-section {
  overflow-x: visible !important;
}

/*
 * Shared dashboard components must not become fixed-height scroll panels.
 * Only deliberately horizontal structures may retain horizontal scrolling.
 */
.eds-dashboard
[data-dashboard-scroll],
.eds-dashboard
.dashboard-scroll-region {
  max-height: none !important;
  overflow-y: visible !important;
}

`;
