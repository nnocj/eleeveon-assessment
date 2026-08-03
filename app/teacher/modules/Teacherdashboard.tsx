"use client";

/**
 * app/teacher/modules/TeacherDashboard.tsx
 * ---------------------------------------------------------
 * ELEEVEON TEACHER DASHBOARD V1
 * ---------------------------------------------------------
 * School-first, teacher-focused, offline-first and theme-safe.
 *
 * - Empty search shows a useful teacher home, not module cards.
 * - Typing searches the same navSections used by RolePortalShell.
 * - Teacher, school and branch identity resolve from workspace/context/Dexie.
 * - Dashboard data is restricted to the active teacher where possible.
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
type Tone = "green" | "blue" | "orange" | "purple" | "gray" | "red";

type RouteProps = {
  navigate?: (key: string) => void;
  navSections?: RoleNavSection[];
};

type SearchModule = {
  key: string;
  label: string;
  icon: string;
  section: string;
  note: string;
};

const OPEN_WORKSPACE_KEY = "eleeveon_open_workspace";
const HIDDEN_KEYS = new Set(["teacherHome", "teacherDashboard"]);

const TABLE_NAMES = [
  "schools",
  "branches",
  "appUsers",
  "teachers",
  "classes",
  "classTeachers",
  "classSubjects",
  "subjects",
  "studentEnrollments",
  "attendance",
  "teacherAttendance",
  "assessmentEntries",
  "computedResults",
  "reportCards",
  "announcements",
  "calendarEvents",
  "scheduleTimetables",
  "scheduleSessions",
  "assignments",
  "courseOutlines",
  "payrollItems",
  "staffPaymentRecords",
  "userMemberships",
  "memberships",
  "schoolBranchSettings",
  "portalHighlights",
  "mediaAssets",
] as const;

function clean(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function sameId(a: unknown, b: unknown) {
  const left = clean(a);
  const right = clean(b);
  return Boolean(left && right && left === right);
}

function n(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown, fallback = "") {
  return clean(value) || fallback;
}

function active(row?: AnyRow | null) {
  if (!row || row.isDeleted === true || row.active === false) return false;
  return !["deleted", "archived", "inactive", "disabled", "cancelled"].includes(
    clean(row.status).toLowerCase(),
  );
}

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

async function safeArray(tableName: string): Promise<AnyRow[]> {
  const table = (db as any)[tableName];
  return table?.toArray ? table.toArray() : [];
}

function fullName(row?: AnyRow | null, fallback = "Teacher") {
  return text(
    row?.fullName ||
      row?.name ||
      [row?.firstName, row?.middleName, row?.lastName].filter(Boolean).join(" ") ||
      row?.email,
    fallback,
  );
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateTime(value: unknown) {
  if (!value) return "Not scheduled";
  const date = new Date(value as any);
  if (!Number.isFinite(date.getTime())) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function moduleNote(key: string) {
  const notes: Record<string, string> = {
    mySubjects: "Open subjects and class-subject assignments.",
    myClasses: "View the classes assigned to you.",
    studentAttendance: "Record attendance for your learners.",
    assessmentEntry: "Enter and review assessment scores.",
    courseOutline: "Plan and follow teaching progress.",
    reportRemarks: "Prepare student report remarks.",
    myAttendance: "Review your attendance and clock records.",
    salary: "View salary, payroll and payment records.",
    announcements: "Read school and branch announcements.",
    calendar: "Open events, reminders and academic dates.",
    teacherTimetable: "Review your teaching timetable.",
    messages: "Open conversations and school messages.",
  };
  return notes[key] || "Open this teacher workspace module.";
}

function resolveMediaUrl(asset?: AnyRow | null) {
  return text(
    asset?.publicUrl ||
      asset?.remoteUrl ||
      asset?.previewDataUrl ||
      asset?.thumbnailDataUrl ||
      asset?.localObjectUrl,
  );
}

function imageFromRecord(record: AnyRow | null, assets: AnyRow[]) {
  if (!record) return "";
  const direct = text(
    record.dashboardHeroImage ||
      record.dashboardBannerImage ||
      record.bannerImage ||
      record.photo ||
      record.image ||
      record.fallbackImageUrl,
  );
  if (direct) return direct;

  const ids = [
    record.dashboardHeroImageMediaId,
    record.dashboardBannerImageMediaId,
    record.bannerImageMediaId,
    record.photoMediaId,
    record.mediaAssetId,
    record.posterMediaAssetId,
  ].filter(Boolean);

  for (const id of ids) {
    const asset = assets.find((item) => sameId(item.id, id));
    const url = resolveMediaUrl(asset);
    if (url) return url;
  }
  return "";
}

function Chip({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`td-chip ${tone}`}>{children}</span>;
}

export default function TeacherDashboard({ navigate, navSections }: RouteProps) {
  const router = useRouter();
  const revision = useDataRevision();
  const { loading, setLoading } = useBackgroundLoader();
  const { accountId, authenticated, loading: accountLoading, user } = useAccount();
  const { settings, loading: settingsLoading } = useSettings();
  const { activeSchoolId, activeBranchId, activeSchool, activeBranch } = useActiveBranch();
  const { activeMembership } = useActiveMembership();

  const primary = settings?.primaryColor || "var(--primary-color,#2563eb)";
  const [query, setQuery] = useState("");
  const [rowsByTable, setRowsByTable] = useState<Record<string, AnyRow[]>>({});

  useEffect(() => {
    if (!accountLoading && (!authenticated || !accountId)) router.replace("/login");
  }, [accountLoading, authenticated, accountId, router]);

  async function load() {
    if (!authenticated || !accountId) {
      setRowsByTable({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const entries = await Promise.all(
        TABLE_NAMES.map(async (tableName) => [tableName, await safeArray(tableName)] as const),
      );
      setRowsByTable(Object.fromEntries(entries));
    } catch (error) {
      console.error("Failed to load teacher dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accountLoading || settingsLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, accountId, accountLoading, settingsLoading, revision]);

  const resolved = useMemo(() => {
    const rows = rowsByTable;
    const openWorkspace = safeJson<AnyRow>(OPEN_WORKSPACE_KEY);
    const storedMembership = safeJson<AnyRow>("activeMembership");
    const membership = openWorkspace?.membership || activeMembership || storedMembership || null;

    const memberships = [
      ...(rows.userMemberships || []),
      ...(rows.memberships || []),
    ].filter(active);

    const currentMembership =
      membership ||
      memberships.find((item) =>
        sameId(item.userId || item.appUserId, (user as AnyRow)?.id),
      ) ||
      memberships.find((item) => clean(item.role).toLowerCase() === "teacher") ||
      null;

    const schoolId = text(
      openWorkspace?.schoolId ||
        currentMembership?.schoolId ||
        activeSchoolId ||
        (activeSchool as AnyRow)?.id ||
        (settings as AnyRow)?.schoolId ||
        safeRead("activeSchoolId"),
    );

    const branchId = text(
      openWorkspace?.branchId ||
        currentMembership?.branchId ||
        activeBranchId ||
        (activeBranch as AnyRow)?.id ||
        (settings as AnyRow)?.branchId ||
        safeRead("activeBranchId"),
    );

    const teacherId = text(
      openWorkspace?.teacherId ||
        currentMembership?.teacherId ||
        currentMembership?.teacherLocalId ||
        safeRead("activeTeacherId"),
    );

    const schools = (rows.schools || []).filter(active);
    const branches = (rows.branches || []).filter(active);
    const teachers = (rows.teachers || []).filter(active);
    const appUsers = (rows.appUsers || []).filter(active);

    const school =
      schools.find((item) => sameId(item.id, schoolId)) ||
      (activeSchool as AnyRow) ||
      schools.find((item) => sameId(item.id, branches.find((b) => sameId(b.id, branchId))?.schoolId)) ||
      null;

    const branch =
      branches.find((item) => sameId(item.id, branchId)) ||
      (activeBranch as AnyRow) ||
      branches.find((item) => sameId(item.schoolId, school?.id)) ||
      null;

    const teacher =
      teachers.find((item) => sameId(item.id, teacherId)) ||
      teachers.find((item) => sameId(item.userId || item.appUserId, currentMembership?.userId)) ||
      teachers.find((item) => sameId(item.email, (user as AnyRow)?.email)) ||
      null;

    const appUser =
      appUsers.find((item) => sameId(item.id, currentMembership?.userId || (user as AnyRow)?.id)) ||
      (user as AnyRow) ||
      null;

    const assets = (rows.mediaAssets || []).filter(active);
    const highlights = (rows.portalHighlights || [])
      .filter(active)
      .filter((item) =>
        (!branch?.id || !item.branchId || sameId(item.branchId, branch.id)) &&
        (!item.audiences || item.audiences.includes("teacher") || item.audiences.includes("all")),
      )
      .sort((a, b) => n(a.displayOrder) - n(b.displayOrder));

    const heroImage =
      imageFromRecord(highlights[0] || null, assets) ||
      imageFromRecord(branch, assets) ||
      imageFromRecord(school, assets);

    return {
      membership: currentMembership,
      school,
      branch,
      teacher,
      appUser,
      teacherId: text(teacher?.id || teacherId),
      schoolId: text(school?.id || schoolId),
      branchId: text(branch?.id || branchId),
      teacherName: fullName(teacher || appUser, "Teacher"),
      schoolName: text(school?.name, "Your School"),
      branchName: text(branch?.name, "Main Campus"),
      motto: text(school?.motto || (settings as AnyRow)?.schoolMotto, "Learning today. Leading tomorrow."),
      heroImage,
    };
  }, [rowsByTable, activeMembership, activeSchoolId, activeBranchId, activeSchool, activeBranch, settings, user]);

  const scoped = useMemo(() => {
    const result: Record<string, AnyRow[]> = {};
    Object.entries(rowsByTable).forEach(([table, rows]) => {
      result[table] = rows.filter((row) => {
        if (!active(row)) return false;
        if (row.accountId && accountId && !sameId(row.accountId, accountId)) return false;
        if (row.schoolId && resolved.schoolId && !sameId(row.schoolId, resolved.schoolId)) return false;
        if (row.branchId && resolved.branchId && !sameId(row.branchId, resolved.branchId)) return false;
        return true;
      });
    });
    return result;
  }, [rowsByTable, resolved.schoolId, resolved.branchId, accountId]);

  const teacherData = useMemo(() => {
    const teacherId = resolved.teacherId;
    const classSubjects = (scoped.classSubjects || []).filter((row) =>
      teacherId ? sameId(row.teacherId, teacherId) : false,
    );
    const classTeachers = (scoped.classTeachers || []).filter((row) =>
      teacherId ? sameId(row.teacherId, teacherId) : false,
    );

    const subjectIds = new Set(classSubjects.map((row) => clean(row.subjectId)).filter(Boolean));
    const classIds = new Set(
      [...classSubjects, ...classTeachers].map((row) => clean(row.classId)).filter(Boolean),
    );

    const subjects = (scoped.subjects || []).filter((row) => subjectIds.has(clean(row.id)));
    const classes = (scoped.classes || []).filter((row) => classIds.has(clean(row.id)));
    const enrollments = (scoped.studentEnrollments || []).filter((row) => classIds.has(clean(row.classId)));
    const today = todayKey();

    const todayAttendance = (scoped.attendance || []).filter(
      (row) => classIds.has(clean(row.classId)) && clean(row.date || row.createdAt).startsWith(today),
    );

    const myAttendance = (scoped.teacherAttendance || []).filter((row) =>
      teacherId ? sameId(row.teacherId, teacherId) : false,
    );

    const assessmentEntries = (scoped.assessmentEntries || []).filter((row) =>
      teacherId ? sameId(row.teacherId, teacherId) || subjectIds.has(clean(row.subjectId)) : false,
    );

    const sessions = (scoped.scheduleSessions || []).filter((row) =>
      teacherId
        ? sameId(row.teacherId, teacherId) || classIds.has(clean(row.classId))
        : false,
    );

    const events = (scoped.calendarEvents || [])
      .filter((row) => {
        const audience = clean(row.audience).toLowerCase();
        return !audience || ["all", "staff", "teachers", "teacher"].includes(audience);
      })
      .sort((a, b) => new Date(a.startAt || a.startDate || a.date || 0).getTime() - new Date(b.startAt || b.startDate || b.date || 0).getTime());

    const announcements = (scoped.announcements || [])
      .filter((row) => {
        const audience = clean(row.audience).toLowerCase();
        return !audience || ["all", "staff", "teachers", "teacher"].includes(audience);
      })
      .sort((a, b) => new Date(b.publishedAt || b.publishAt || b.updatedAt || 0).getTime() - new Date(a.publishedAt || a.publishAt || a.updatedAt || 0).getTime());

    const payroll = [
      ...(scoped.payrollItems || []),
      ...(scoped.staffPaymentRecords || []),
    ].filter((row) => teacherId ? sameId(row.teacherId, teacherId) : false);

    return {
      classSubjects,
      subjects,
      classes,
      enrollments,
      todayAttendance,
      myAttendance,
      assessmentEntries,
      sessions,
      events: events.slice(0, 4),
      announcements: announcements.slice(0, 4),
      payroll,
      uniqueStudents: new Set(enrollments.map((row) => clean(row.studentId)).filter(Boolean)).size,
      attendancePresent: todayAttendance.filter((row) => clean(row.status).toLowerCase() === "present").length,
    };
  }, [scoped, resolved.teacherId]);

  const modules = useMemo<SearchModule[]>(() => {
    const result: SearchModule[] = [];
    const seen = new Set<string>();
    (navSections || []).forEach((section) => {
      section.items.forEach((item) => {
        if (HIDDEN_KEYS.has(item.key) || seen.has(item.key)) return;
        seen.add(item.key);
        result.push({
          key: item.key,
          label: item.label,
          icon: item.icon,
          section: section.title,
          note: moduleNote(item.key),
        });
      });
    });
    return result;
  }, [navSections]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return modules.filter((item) =>
      `${item.label} ${item.section} ${item.note}`.toLowerCase().includes(q),
    );
  }, [modules, query]);

  function openRoute(key: string) {
    if (navigate) return navigate(key);
    try {
      window.dispatchEvent(new CustomEvent("eleeveon:portal-route", { detail: { key } }));
      window.dispatchEvent(new CustomEvent("role-portal:navigate", { detail: { key } }));
      window.dispatchEvent(new CustomEvent("portal:navigate", { detail: key }));
    } catch {
      // Optional RolePortalShell events.
    }
  }

  if (loading || accountLoading || settingsLoading) {
    return <State primary={primary} title="Opening your workspace..." text="Loading your classes, subjects, timetable and school updates." />;
  }

  if (!authenticated || !accountId) {
    return <State primary={primary} title="Redirecting to login..." text="Sign in to open your teacher workspace." />;
  }

  return (
    <main className="td-page" style={{ "--td-primary": primary } as React.CSSProperties}>
      <style>{css}</style>

      <section className="td-search-card">
        <span className="td-status" title="Teacher workspace ready" />
        <label className="td-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search subjects, attendance, assessments..."
            aria-label="Search teacher modules"
          />
        </label>
        {query ? (
          <button type="button" className="td-round" onClick={() => setQuery("")} aria-label="Clear search">✕</button>
        ) : null}
        <button type="button" className="td-refresh" onClick={load} aria-label="Refresh dashboard">↻</button>
      </section>

      {query.trim() ? (
        <section className="td-search-results">
          <div className="td-section-head"><div><span>Search results</span><h2>{searchResults.length} module{searchResults.length === 1 ? "" : "s"}</h2></div></div>
          <div className="td-result-list">
            {searchResults.map((item) => (
              <button key={item.key} type="button" className="td-result" onClick={() => openRoute(item.key)}>
                <span className="td-result-icon">{item.icon}</span>
                <span className="td-result-main"><strong>{item.label}</strong><small>{item.note}</small><em>{item.section}</em></span>
                <span className="td-chevron">›</span>
              </button>
            ))}
            {!searchResults.length ? <Empty title="No matching teacher module" text="Try subjects, attendance, assessment, reports or salary." /> : null}
          </div>
        </section>
      ) : (
        <>
          <section
            className={`td-hero ${resolved.heroImage ? "has-image" : ""}`}
            style={
              resolved.heroImage
                ? {
                    backgroundImage: `linear-gradient(90deg,rgba(7,15,32,.88),rgba(7,15,32,.32)),url(${JSON.stringify(resolved.heroImage).slice(1,-1)})`,
                  }
                : undefined
            }
          >
            <div className="td-hero-copy">
              <span>{greeting()}</span>
              <h1>{resolved.teacherName}</h1>
              <p>
                Welcome to <strong>{resolved.schoolName}</strong>
                <small className="td-branch-name">{resolved.branchName}</small>
              </p>
              <blockquote>“{resolved.motto}”</blockquote>
            </div>
            <div className="td-hero-stats">
              <span><b>{teacherData.subjects.length}</b> Subjects</span>
              <span><b>{teacherData.classes.length}</b> Classes</span>
              <span><b>{teacherData.uniqueStudents}</b> Students</span>
            </div>
          </section>

          <section className="td-quick-actions">
            <button type="button" onClick={() => openRoute("studentAttendance")}><span>✓</span><b>Take Attendance</b><small>Record today’s class attendance</small></button>
            <button type="button" onClick={() => openRoute("assessmentEntry")}><span>✎</span><b>Enter Scores</b><small>Continue assessment entry</small></button>
            <button type="button" onClick={() => openRoute("courseOutline")}><span>📚</span><b>My Subjects</b><small>Open assigned subjects</small></button>
            <button type="button" onClick={() => openRoute("teacherReportRemarks")}><span>💬</span><b>Report Remarks</b><small>Prepare student remarks</small></button>
          </section>

          <section className="td-dashboard-grid">
            <article className="td-card td-today">
              <div className="td-section-head"><div><span>Today</span><h2>Classroom pulse</h2></div><Chip tone={teacherData.todayAttendance.length ? "green" : "orange"}>{teacherData.todayAttendance.length ? "Started" : "Pending"}</Chip></div>
              <div className="td-pulse-grid">
                <div><strong>{teacherData.attendancePresent}</strong><span>Present recorded</span></div>
                <div><strong>{teacherData.todayAttendance.length}</strong><span>Attendance entries</span></div>
                <div><strong>{teacherData.assessmentEntries.length}</strong><span>Score entries</span></div>
                <div><strong>{teacherData.myAttendance.length}</strong><span>My attendance records</span></div>
              </div>
              <button type="button" className="td-link" onClick={() => openRoute("studentAttendance")}>Open student attendance <span>→</span></button>
            </article>

            <article className="td-card">
              <div className="td-section-head"><div><span>Teaching</span><h2>My workload</h2></div></div>
              <div className="td-workload-list">
                <div><span>📚</span><p><b>{teacherData.classSubjects.length} class-subject links</b><small>Subjects connected to your classes</small></p></div>
                <div><span>🏷</span><p><b>{teacherData.classes.length} assigned classes</b><small>{teacherData.uniqueStudents} learners across those classes</small></p></div>
                <div><span>🗓</span><p><b>{teacherData.sessions.length} timetable sessions</b><small>Teaching sessions currently available</small></p></div>
              </div>
              <button type="button" className="td-link" onClick={() => openRoute("myClasses")}>View my classes <span>→</span></button>
            </article>
          </section>

          <section className="td-content-grid">
            <article className="td-card">
              <div className="td-section-head"><div><span>Schedule</span><h2>Upcoming</h2></div><button type="button" onClick={() => openRoute("teacherTimetable")}>View all</button></div>
              <div className="td-feed">
                {teacherData.events.map((event, index) => (
                  <div key={event.id || index} className="td-feed-row"><span>🗓</span><p><b>{text(event.title || event.name, "School event")}</b><small>{dateTime(event.startAt || event.startDate || event.date)}</small></p></div>
                ))}
                {!teacherData.events.length ? <MiniEmpty icon="🗓" text="No upcoming teacher events yet." /> : null}
              </div>
            </article>

            <article className="td-card">
              <div className="td-section-head"><div><span>School updates</span><h2>Announcements</h2></div><button type="button" onClick={() => openRoute("announcements")}>View all</button></div>
              <div className="td-feed">
                {teacherData.announcements.map((item, index) => (
                  <div key={item.id || index} className="td-feed-row"><span>📣</span><p><b>{text(item.title, "Announcement")}</b><small>{text(item.body || item.description, "Open to read the full update.")}</small></p></div>
                ))}
                {!teacherData.announcements.length ? <MiniEmpty icon="📣" text="No teacher announcements yet." /> : null}
              </div>
            </article>
          </section>

          <section className="td-card td-progress-card">
            <div className="td-section-head"><div><span>Teaching progress</span><h2>Your workspace at a glance</h2></div></div>
            <div className="td-progress-grid">
              <button type="button" onClick={() => openRoute("courseOutline")}><span>📖</span><strong>Course Outline</strong><small>Keep lessons aligned with the term plan.</small></button>
              <button type="button" onClick={() => openRoute("assessmentEntry")}><span>📝</span><strong>Assessment Entry</strong><small>{teacherData.assessmentEntries.length} score record(s) available.</small></button>
              <button type="button" onClick={() => openRoute("myAttendance")}><span>🕒</span><strong>My Attendance</strong><small>Review your presence and clock records.</small></button>
              <button type="button" onClick={() => openRoute("salary")}><span>💰</span><strong>Salary</strong><small>{teacherData.payroll.length} payroll/payment record(s).</small></button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function State({ primary, title, text: body }: { primary: string; title: string; text: string }) {
  return <main className="td-page" style={{ "--td-primary": primary } as React.CSSProperties}><style>{css}</style><section className="td-state"><div className="td-spinner"/><h2>{title}</h2><p>{body}</p></section></main>;
}

function Empty({ title, text: body }: { title: string; text: string }) {
  return <section className="td-empty"><div>⌕</div><h3>{title}</h3><p>{body}</p></section>;
}

function MiniEmpty({ icon, text: body }: { icon: string; text: string }) {
  return <div className="td-mini-empty"><span>{icon}</span><p>{body}</p></div>;
}

const css = `
@keyframes tdSpin{to{transform:rotate(360deg)}}
.td-page{--ease:cubic-bezier(.2,.8,.2,1);min-height:100dvh;width:100%;padding:8px;padding-bottom:max(42px,env(safe-area-inset-bottom));background:radial-gradient(circle at top left,color-mix(in srgb,var(--td-primary) 9%,transparent),transparent 30rem),var(--bg,#f7f8fb);color:var(--text,#111827);font-family:var(--font-family,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);overflow-x:hidden}.td-page *{box-sizing:border-box;min-width:0}.td-page button,.td-page input{font:inherit}.td-page button{cursor:pointer;-webkit-tap-highlight-color:transparent}.td-search-card,.td-card,.td-result,.td-state,.td-empty{background:var(--card-bg,var(--surface,#fff));border:1px solid var(--border,rgba(0,0,0,.1));box-shadow:0 12px 30px rgba(15,23,42,.05)}
.td-search-card{display:flex;align-items:center;gap:8px;padding:8px;border-radius:24px}.td-status{width:10px;height:10px;flex:0 0 auto;border-radius:999px;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.12)}.td-search{flex:1;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:8px;min-height:44px;padding:0 12px;border-radius:18px;background:color-mix(in srgb,var(--muted,#64748b) 7%,transparent)}.td-search>span{font-size:18px;color:var(--muted,#64748b);font-weight:1000}.td-search input{width:100%;min-height:42px;border:0;outline:0;background:transparent;color:var(--text,#111827);font-weight:750}.td-round,.td-refresh{width:42px;height:42px;flex:0 0 auto;display:grid;place-items:center;border-radius:999px;border:1px solid var(--border,rgba(0,0,0,.1));background:var(--surface,#fff);color:var(--text,#111827);font-weight:1000}.td-refresh{border-color:var(--td-primary);background:var(--td-primary);color:#fff}
.td-hero{position:relative;min-height:270px;margin-top:10px;border-radius:30px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;color:#fff;background:linear-gradient(135deg,color-mix(in srgb,var(--td-primary) 95%,#111827),color-mix(in srgb,var(--td-primary) 55%,#0f172a));box-shadow:0 22px 60px color-mix(in srgb,var(--td-primary) 20%,transparent);background-position:center;background-size:cover}.td-hero:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 85% 18%,rgba(255,255,255,.18),transparent 26%);pointer-events:none}.td-hero-copy,.td-hero-stats{position:relative;z-index:1}.td-hero-copy>span{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;opacity:.85}.td-hero h1{margin:7px 0 4px;font-size:clamp(28px,7vw,48px);line-height:.98;letter-spacing:-.06em}.td-hero p{margin:0;font-size:14px}.td-hero p strong{display:inline}.td-branch-name{display:block;width:max-content;max-width:100%;margin-top:7px;padding:5px 9px;border:1px solid rgba(255,255,255,.22);border-radius:10px;background:rgba(255,255,255,.12);backdrop-filter:blur(8px);font-size:11px;font-weight:850}.td-hero blockquote{margin:18px 0 0;max-width:38rem;font-size:13px;line-height:1.55;font-weight:750;opacity:.9}.td-hero-stats{display:flex;flex-wrap:wrap;gap:8px;margin-top:26px}.td-hero-stats span{display:flex;align-items:baseline;gap:5px;padding:8px 11px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(255,255,255,.12);backdrop-filter:blur(10px);font-size:11px;font-weight:850}.td-hero-stats b{font-size:15px}.td-hero-stats strong{font-size:18px;font-weight:850;letter-spacing:-.035em}.td-hero-stats span{margin-top:2px;font-size:9px;font-weight:750;text-transform:uppercase;letter-spacing:.06em;opacity:.74}
.td-quick-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.td-quick-actions button{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:9px;align-items:center;padding:11px;border:1px solid var(--border,rgba(0,0,0,.1));border-radius:21px;background:var(--card-bg,var(--surface,#fff));color:var(--text,#111827);text-align:left;box-shadow:0 12px 30px rgba(15,23,42,.045)}.td-quick-actions button>span{grid-row:span 2;width:39px;height:39px;display:grid;place-items:center;border-radius:15px;background:color-mix(in srgb,var(--td-primary) 11%,transparent);color:var(--td-primary);font-size:18px;font-weight:1000}.td-quick-actions b,.td-quick-actions small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.td-quick-actions b{font-size:12px;font-weight:1000}.td-quick-actions small{margin-top:2px;color:var(--muted,#64748b);font-size:10px;font-weight:750}
.td-dashboard-grid,.td-content-grid{display:grid;gap:10px;margin-top:10px}.td-card{padding:14px;border-radius:25px}.td-section-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.td-section-head span{color:var(--muted,#64748b);font-size:10px;font-weight:1000;text-transform:uppercase;letter-spacing:.09em}.td-section-head h2{margin:3px 0 0;font-size:17px;font-weight:1000;letter-spacing:-.035em}.td-section-head button{border:0;background:transparent;color:var(--td-primary);font-size:11px;font-weight:950}.td-chip{display:inline-flex;align-items:center;min-height:25px;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:950}.td-chip.green{background:rgba(34,197,94,.12);color:#16a34a}.td-chip.orange{background:rgba(245,158,11,.14);color:#b45309}.td-chip.gray{background:color-mix(in srgb,var(--muted,#64748b) 13%,transparent);color:var(--muted,#64748b)}
.td-pulse-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.td-pulse-grid div{padding:12px;border-radius:18px;background:color-mix(in srgb,var(--muted,#64748b) 7%,transparent)}.td-pulse-grid strong,.td-pulse-grid span{display:block}.td-pulse-grid strong{font-size:23px;font-weight:1000;letter-spacing:-.05em}.td-pulse-grid span{margin-top:3px;color:var(--muted,#64748b);font-size:10px;font-weight:850}.td-link{width:100%;display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:11px 12px;border:0;border-radius:16px;background:color-mix(in srgb,var(--td-primary) 9%,transparent);color:var(--td-primary);font-size:11px;font-weight:950}.td-workload-list,.td-feed{display:grid;gap:8px;margin-top:12px}.td-workload-list>div,.td-feed-row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:9px;align-items:center;padding:9px;border-radius:17px;background:color-mix(in srgb,var(--muted,#64748b) 6%,transparent)}.td-workload-list>div>span,.td-feed-row>span{width:36px;height:36px;display:grid;place-items:center;border-radius:14px;background:color-mix(in srgb,var(--td-primary) 10%,transparent)}.td-workload-list p,.td-feed-row p{margin:0}.td-workload-list b,.td-workload-list small,.td-feed-row b,.td-feed-row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.td-workload-list b,.td-feed-row b{font-size:12px;font-weight:1000}.td-workload-list small,.td-feed-row small{margin-top:3px;color:var(--muted,#64748b);font-size:10px;font-weight:750}.td-mini-empty{display:grid;place-items:center;gap:6px;min-height:120px;color:var(--muted,#64748b);text-align:center}.td-mini-empty span{font-size:25px}.td-mini-empty p{margin:0;font-size:11px;font-weight:800}
.td-progress-card{margin-top:10px}.td-progress-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}.td-progress-grid button{display:block;padding:12px;border:1px solid var(--border,rgba(0,0,0,.09));border-radius:19px;background:color-mix(in srgb,var(--muted,#64748b) 5%,var(--surface,#fff));color:var(--text,#111827);text-align:left}.td-progress-grid button>span{display:grid;place-items:center;width:38px;height:38px;margin-bottom:9px;border-radius:15px;background:color-mix(in srgb,var(--td-primary) 10%,transparent)}.td-progress-grid strong,.td-progress-grid small{display:block}.td-progress-grid strong{font-size:12px;font-weight:1000}.td-progress-grid small{margin-top:4px;color:var(--muted,#64748b);font-size:10px;line-height:1.45;font-weight:750}
.td-search-results{margin-top:10px}.td-result-list{display:grid;gap:7px;margin-top:9px}.td-result{width:100%;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px;border-radius:21px;color:inherit;text-align:left}.td-result-icon{width:45px;height:45px;display:grid;place-items:center;border-radius:17px;background:color-mix(in srgb,var(--td-primary) 11%,transparent);font-size:21px}.td-result-main strong,.td-result-main small,.td-result-main em{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.td-result-main strong{font-size:13px;font-weight:1000}.td-result-main small{margin-top:3px;color:var(--muted,#64748b);font-size:11px;font-weight:750}.td-result-main em{margin-top:3px;color:var(--td-primary);font-size:10px;font-weight:900;font-style:normal}.td-chevron{color:var(--muted,#64748b);font-size:20px;font-weight:1000}.td-empty{display:grid;place-items:center;align-content:center;gap:8px;min-height:230px;padding:20px;border-radius:24px;border-style:dashed;text-align:center}.td-empty>div{width:55px;height:55px;display:grid;place-items:center;border-radius:20px;background:color-mix(in srgb,var(--td-primary) 11%,transparent);font-size:24px}.td-empty h3{margin:0;font-size:17px;font-weight:1000}.td-empty p{margin:0;color:var(--muted,#64748b);font-size:12px;line-height:1.55}.td-state{min-height:min(430px,calc(100dvh - 24px));display:grid;place-items:center;align-content:center;gap:10px;padding:22px;border-radius:28px;text-align:center}.td-spinner{width:38px;height:38px;border:4px solid color-mix(in srgb,var(--td-primary) 17%,transparent);border-top-color:var(--td-primary);border-radius:999px;animation:tdSpin .8s linear infinite}.td-state h2{margin:0;font-size:21px;font-weight:1000}.td-state p{max-width:34rem;margin:0;color:var(--muted,#64748b);font-size:12px;line-height:1.6}
@media(min-width:700px){.td-page{padding:12px}.td-hero{padding:22px}.td-quick-actions{grid-template-columns:repeat(4,minmax(0,1fr))}.td-dashboard-grid,.td-content-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.td-progress-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.td-result-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:1080px){.td-page{padding:16px}.td-search-card,.td-hero,.td-quick-actions,.td-dashboard-grid,.td-content-grid,.td-progress-card,.td-search-results{max-width:1180px;margin-left:auto;margin-right:auto}.td-hero,.td-quick-actions,.td-dashboard-grid,.td-content-grid,.td-progress-card,.td-search-results{margin-top:12px}}
@media(max-width:480px){.td-page{padding:7px}.td-hero{min-height:270px;padding:22px;border-radius:30px}.td-quick-actions button{padding:9px}.td-progress-grid{grid-template-columns:minmax(0,1fr)}}
`;
