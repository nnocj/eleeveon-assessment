"use client";

/**
 * app/parent/modules/Children.tsx
 * --------------------------------------------------------------------------
 * PARENT PORTAL — MY CHILDREN
 * --------------------------------------------------------------------------
 *
 * Read-only, parent-scoped child directory.
 *
 * Data rules:
 * - resolves the active parent membership;
 * - matches the permanent Parent record;
 * - follows StudentParent links;
 * - exposes only students linked to that parent;
 * - uses string IDs throughout;
 * - resolves student photos from the shared local-first media system;
 * - never exposes map/location tooling or branch-wide student data.
 *
 * UI rules:
 * - compact Branch Admin Students-inspired search/action strip;
 * - cards are the default mobile-first view;
 * - table and summary views live under More;
 * - filters open in a sheet;
 * - student details open in a read-only drawer;
 * - no add, edit, delete, upload, camera, map, or status-changing controls.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAccount } from "../../context/account-context";
import { useSettings } from "../../context/settings-context";
import { useActiveBranch } from "../../context/active-branch-context";
import { useActiveMembership } from "../../context/active-membership-context";

import {
  type Class,
  db,
  type Organization,
  type Parent,
  type Student,
  type StudentEnrollment,
  type StudentParent,
} from "../../lib/db/db";

import { useEntityMediaUrls } from "../../hooks/useEntityMediaUrls";
import { useBranchTableRevision } from "../../hooks/useBranchTableRevision";

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = "cards" | "table" | "summary";
type StudentStatus = "active" | "graduated" | "transferred" | "withdrawn";
type ToastTone = "success" | "error" | "info";

type TenantRow = {
  accountId?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
  isDeleted?: boolean;
  active?: boolean;
  status?: string | null;
};

type ChildView = {
  id: string;
  student: Student;
  photoUrl?: string;
  className: string;
  organizationName: string;
  relationship: string;
  isPrimary: boolean;
  enrollment?: StudentEnrollment;
  status: StudentStatus;
  active: boolean;
};

type SummaryGroup = {
  name: string;
  count: number;
};

// ============================================================================
// HELPERS
// ============================================================================

const idOf = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const sameId = (a: unknown, b: unknown) => idOf(a) === idOf(b);

const safeLower = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const safeRecordMediaValue = (value?: string | null) => {
  const media = String(value || "").trim();
  if (!media) return undefined;
  if (media.startsWith("blob:")) return undefined;
  if (media.startsWith("data:image/")) return undefined;
  return media;
};

const statusLabel = (status?: string | null) => {
  const value = String(status || "active").replaceAll("_", " ");
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const relationshipLabel = (relationship?: string | null) => {
  const value = String(relationship || "guardian").replaceAll("_", " ");
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const statusTone = (
  status?: string | null,
): "green" | "red" | "blue" | "orange" | "gray" => {
  if (!status || status === "active") return "green";
  if (status === "graduated") return "blue";
  if (status === "transferred") return "orange";
  if (status === "withdrawn") return "red";
  return "gray";
};

const isActiveStudent = (student: Student) => {
  const row = student as Student & { active?: boolean };
  if (row.isDeleted) return false;
  if (row.active === false) return false;
  return !["withdrawn", "deleted", "archived", "inactive"].includes(
    safeLower(row.status),
  );
};

const getReadableTextColor = (color: string) => {
  const value = String(color || "").trim();
  if (!value.startsWith("#")) return "#ffffff";

  let hex = value.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((character) => character + character)
      .join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "#ffffff";

  const numeric = Number.parseInt(hex, 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 155 ? "#111827" : "#ffffff";
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not set";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const calculateAge = (student: Student) => {
  if (typeof student.age === "number" && Number.isFinite(student.age)) {
    return student.age;
  }

  if (!student.dateOfBirth) return null;

  const birthDate = new Date(student.dateOfBirth);
  if (!Number.isFinite(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

function groupedCounts(
  rows: ChildView[],
  selector: (row: ChildView) => string,
): SummaryGroup[] {
  const map = new Map<string, number>();

  rows.forEach((row) => {
    const name = selector(row) || "Not set";
    map.set(name, (map.get(name) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// ============================================================================
// SMALL COMPONENTS
// ============================================================================

function Avatar({
  name,
  photo,
  primary,
  size = "normal",
}: {
  name: string;
  photo?: string;
  primary: string;
  size?: "normal" | "large";
}) {
  return (
    <div
      className={`pp-avatar ${size === "large" ? "large" : ""}`}
      style={{
        background: photo ? `url("${photo}") center/cover` : primary,
        color: photo ? "#ffffff" : getReadableTextColor(primary),
        borderColor: photo
          ? "transparent"
          : `color-mix(in srgb, ${primary} 70%, transparent)`,
      }}
      aria-label={`${name} photo`}
    >
      {!photo && String(name || "S").slice(0, 1).toUpperCase()}
    </div>
  );
}

function Chip({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "blue" | "gray" | "orange" | "purple";
}) {
  return <span className={`pp-chip ${tone}`}>{children}</span>;
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <section className="pp-empty">
      <div className="pp-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );
}

function SummarySection({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: SummaryGroup[];
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="pp-summary-section">
      <div className="pp-section-head">
        <div>
          <p>{subtitle}</p>
          <h3>{title}</h3>
        </div>
        <Chip>{items.length} group(s)</Chip>
      </div>

      <div className="pp-summary-list">
        {items.map((item) => {
          const percentage = total
            ? Math.round((item.count / total) * 100)
            : 0;

          return (
            <article key={item.name} className="pp-summary-row">
              <div className="pp-summary-row-top">
                <strong>{item.name}</strong>
                <span>{item.count}</span>
              </div>
              <div className="pp-progress-track">
                <div style={{ width: `${percentage}%` }} />
              </div>
              <small>{percentage}% of linked children</small>
            </article>
          );
        })}

        {!items.length && (
          <EmptyState
            icon="📊"
            title="No summary data"
            text="There is no information available for this summary."
          />
        )}
      </div>
    </section>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function Children() {
  const router = useRouter();
  const dataRevision = useBranchTableRevision([
    "parents",
    "studentParents",
    "students",
    "classes",
    "organizations",
    "studentEnrollments",
    "mediaAssets",
    "mediaBlobs",
  ]);

  const {
    accountId,
    authenticated,
    loading: accountLoading,
  } = useAccount();

  const { settings, loading: settingsLoading } = useSettings();

  const {
    activeSchool,
    activeSchoolId,
    activeBranch,
    activeBranchId,
    loading: contextLoading,
  } = useActiveBranch();

  const membershipContext = useActiveMembership() as any;
  const activeMembership = membershipContext?.activeMembership;

  const activeParentId = idOf(
    membershipContext?.activeParentId ||
      activeMembership?.parentLocalId ||
      activeMembership?.parentId,
  );

  const schoolId = idOf(
    activeSchoolId || activeSchool?.id || settings?.schoolId,
  );
  const branchId = idOf(
    activeBranchId || activeBranch?.id || settings?.branchId,
  );

  const primary =
    settings?.primaryColor || "var(--primary-color, #2563eb)";
  const primaryText = getReadableTextColor(primary);

  const [loading, setLoading] = useState(true);
  const [parents, setParents] = useState<Parent[]>([]);
  const [studentParents, setStudentParents] = useState<StudentParent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [filterClassId, setFilterClassId] = useState("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | StudentStatus
  >("all");
  const [filterRelationship, setFilterRelationship] = useState("all");

  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildView | null>(null);

  const [toast, setToast] = useState<{
    tone: ToastTone;
    message: string;
  } | null>(null);

  const resolvedMediaById = useEntityMediaUrls({
    accountId,
    ownerTable: "students",
    rows: students,
    fields: [{ fieldKey: "photo", mediaIdKey: "photoMediaId" }],
  });

  const showToast = (tone: ToastTone, message: string) => {
    setToast({ tone, message });
    window.setTimeout(
      () => setToast((current) => (current?.message === message ? null : current)),
      3800,
    );
  };

  useEffect(() => {
    if (accountLoading || contextLoading) return;

    if (!authenticated || !accountId) {
      router.replace("/login");
      return;
    }

    if (!schoolId || !branchId) {
      router.replace("/account");
    }
  }, [
    accountLoading,
    contextLoading,
    authenticated,
    accountId,
    schoolId,
    branchId,
    router,
  ]);

  const sameTenant = (row: TenantRow) =>
    (!row.accountId || sameId(row.accountId, accountId)) &&
    (!row.schoolId || sameId(row.schoolId, schoolId)) &&
    (!row.branchId || sameId(row.branchId, branchId)) &&
    !row.isDeleted;

  const clearData = () => {
    setParents([]);
    setStudentParents([]);
    setStudents([]);
    setClasses([]);
    setOrganizations([]);
    setEnrollments([]);
  };

  const load = async () => {
    if (!authenticated || !accountId || !schoolId || !branchId) {
      clearData();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [
        parentRows,
        linkRows,
        studentRows,
        classRows,
        organizationRows,
        enrollmentRows,
      ] = await Promise.all([
        db.parents.toArray(),
        db.studentParents.toArray(),
        db.students.toArray(),
        db.classes.toArray(),
        db.organizations.toArray(),
        db.studentEnrollments.toArray(),
      ]);

      const scopedParents = parentRows.filter((row) =>
        sameTenant(row as TenantRow),
      );
      const scopedLinks = linkRows.filter((row) =>
        sameTenant(row as TenantRow),
      );
      const scopedStudents = studentRows.filter((row) =>
        sameTenant(row as TenantRow),
      );

      const parentIds = new Set<string>();

      if (activeParentId) parentIds.add(activeParentId);

      const membershipEmail = safeLower(
        activeMembership?.email ||
          activeMembership?.user?.email ||
          membershipContext?.activeUser?.email,
      );

      if (membershipEmail) {
        scopedParents
          .filter((parent) => safeLower(parent.email) === membershipEmail)
          .forEach((parent) => parentIds.add(idOf(parent.id)));
      }

      const matchedParents = scopedParents.filter((parent) =>
        parentIds.has(idOf(parent.id)),
      );

      // Strict parent scoping: an unresolved parent must never fall back to every
      // child in the branch.
      const linkedRows = parentIds.size
        ? scopedLinks.filter((link) => parentIds.has(idOf(link.parentId)))
        : [];

      const childIds = new Set(
        linkedRows.map((link) => idOf(link.studentId)).filter(Boolean),
      );

      const childRows = scopedStudents
        .filter((student) => childIds.has(idOf(student.id)))
        .sort((a, b) =>
          String(a.fullName || "").localeCompare(String(b.fullName || "")),
        );

      setParents(matchedParents);
      setStudentParents(linkedRows);
      setStudents(childRows);

      setClasses(
        classRows
          .filter(
            (row) =>
              sameTenant(row as TenantRow) &&
              row.active !== false &&
              !row.isDeleted,
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      );

      setOrganizations(
        organizationRows
          .filter(
            (row) =>
              sameTenant(row as TenantRow) &&
              row.active !== false &&
              !row.isDeleted,
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      );

      setEnrollments(
        enrollmentRows.filter(
          (row) =>
            sameTenant(row as TenantRow) &&
            childIds.has(idOf(row.studentId)),
        ),
      );
    } catch (error) {
      console.error("Failed to load linked children:", error);
      clearData();
      showToast("error", "Failed to load your linked children.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      accountLoading ||
      contextLoading ||
      settingsLoading
    ) {
      return;
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authenticated,
    accountId,
    schoolId,
    branchId,
    activeParentId,
    accountLoading,
    contextLoading,
    settingsLoading,
    dataRevision,
  ]);

  const classMap = useMemo(
    () => new Map(classes.map((row) => [idOf(row.id), row])),
    [classes],
  );

  const organizationMap = useMemo(
    () => new Map(organizations.map((row) => [idOf(row.id), row])),
    [organizations],
  );

  const activeEnrollmentMap = useMemo(() => {
    const map = new Map<string, StudentEnrollment>();

    enrollments
      .slice()
      .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
      .forEach((enrollment) => {
        const studentId = idOf(enrollment.studentId);
        if (!studentId || map.has(studentId)) return;

        if (enrollment.status === "active") {
          map.set(studentId, enrollment);
        }
      });

    return map;
  }, [enrollments]);

  const linkMap = useMemo(() => {
    const map = new Map<string, StudentParent>();

    studentParents.forEach((link) => {
      const studentId = idOf(link.studentId);
      if (!studentId) return;

      const existing = map.get(studentId);
      if (!existing || link.isPrimary) {
        map.set(studentId, link);
      }
    });

    return map;
  }, [studentParents]);

  const childRows = useMemo<ChildView[]>(() => {
    return students.map((student) => {
      const id = idOf(student.id);
      const enrollment = activeEnrollmentMap.get(id);
      const classId = idOf(enrollment?.classId || student.currentClassId);
      const klass = classMap.get(classId);
      const organization = organizationMap.get(idOf(student.organizationId));
      const link = linkMap.get(id);
      const status = (student.status || "active") as StudentStatus;

      return {
        id,
        student,
        photoUrl:
          resolvedMediaById[id]?.photo ||
          safeRecordMediaValue(student.photo),
        className: klass?.name || "No class assigned",
        organizationName: organization?.name || "No organization",
        relationship: relationshipLabel(link?.relationship),
        isPrimary: Boolean(link?.isPrimary),
        enrollment,
        status,
        active: isActiveStudent(student),
      };
    });
  }, [
    students,
    activeEnrollmentMap,
    classMap,
    organizationMap,
    linkMap,
    resolvedMediaById,
  ]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return childRows
      .filter((item) => {
        const student = item.student;

        if (
          filterClassId !== "all" &&
          !sameId(
            item.enrollment?.classId || student.currentClassId,
            filterClassId,
          )
        ) {
          return false;
        }

        if (filterStatus !== "all" && item.status !== filterStatus) {
          return false;
        }

        if (
          filterRelationship !== "all" &&
          safeLower(item.relationship) !== safeLower(filterRelationship)
        ) {
          return false;
        }

        if (!query) return true;

        return `
          ${student.fullName || ""}
          ${student.admissionNumber || ""}
          ${student.gender || ""}
          ${student.email || ""}
          ${item.className}
          ${item.organizationName}
          ${item.relationship}
          ${item.status}
        `
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) =>
        a.student.fullName.localeCompare(b.student.fullName),
      );
  }, [
    childRows,
    search,
    filterClassId,
    filterStatus,
    filterRelationship,
  ]);

  const activeFilterCount = useMemo(
    () =>
      [filterClassId, filterStatus, filterRelationship].filter(
        (value) => value !== "all",
      ).length,
    [filterClassId, filterStatus, filterRelationship],
  );

  const relationshipOptions = useMemo(
    () =>
      Array.from(
        new Set(childRows.map((item) => item.relationship).filter(Boolean)),
      ).sort(),
    [childRows],
  );

  const statusSummary = useMemo(
    () => groupedCounts(childRows, (item) => statusLabel(item.status)),
    [childRows],
  );

  const classSummary = useMemo(
    () => groupedCounts(childRows, (item) => item.className),
    [childRows],
  );

  const relationshipSummary = useMemo(
    () => groupedCounts(childRows, (item) => item.relationship),
    [childRows],
  );

  const clearFilters = () => {
    setFilterClassId("all");
    setFilterStatus("all");
    setFilterRelationship("all");
  };

  const openChild = (child: ChildView) => {
    setSelectedChild(child);
  };

  if (
    accountLoading ||
    contextLoading ||
    settingsLoading ||
    loading
  ) {
    return (
      <main
        className="pp-page"
        style={
          {
            "--pp-primary": primary,
            "--pp-primary-text": primaryText,
          } as React.CSSProperties
        }
      >
        <style>{css}</style>
        <section className="pp-state-card">
          <div className="pp-spinner" />
          <h2>Opening your children...</h2>
          <p>
            Checking your parent profile, linked students, classes, and photos.
          </p>
        </section>
      </main>
    );
  }

  if (!authenticated || !accountId) {
    return (
      <main
        className="pp-page"
        style={
          {
            "--pp-primary": primary,
            "--pp-primary-text": primaryText,
          } as React.CSSProperties
        }
      >
        <style>{css}</style>
        <section className="pp-state-card">
          <h2>Redirecting to login...</h2>
          <p>You must sign in before viewing your children.</p>
        </section>
      </main>
    );
  }

  if (!schoolId || !branchId) {
    return (
      <main
        className="pp-page"
        style={
          {
            "--pp-primary": primary,
            "--pp-primary-text": primaryText,
          } as React.CSSProperties
        }
      >
        <style>{css}</style>
        <section className="pp-state-card">
          <h2>Assigned school branch required</h2>
          <p>
            Your parent membership must be connected to a school branch before
            linked children can be shown.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main
      className="pp-page"
      style={
        {
          "--pp-primary": primary,
          "--pp-primary-text": primaryText,
        } as React.CSSProperties
      }
    >
      <style>{css}</style>

      {/* Compact primary action strip */}
      <section className="pp-action-strip">
        <label className="pp-search-box">
          <span aria-hidden="true">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your children..."
            aria-label="Search your children"
          />
          {search && (
            <button
              type="button"
              className="pp-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </label>

        <button
          type="button"
          className={`pp-filter-button ${
            activeFilterCount > 0 ? "active" : ""
          }`}
          onClick={() => setFilterOpen(true)}
          aria-label="Open filters"
          title="Filter"
        >
          <span aria-hidden="true">☷</span>
          {activeFilterCount > 0 && (
            <b className="pp-action-count">{activeFilterCount}</b>
          )}
        </button>

        <button
          type="button"
          className="pp-more-button"
          onClick={() => setMoreOpen(true)}
          aria-label="More options"
          title="More"
        >
          ⋯
        </button>
      </section>

      {/* Active filter chips only when useful */}
      {(activeFilterCount > 0 || search) && (
        <section className="pp-active-filters">
          {search && (
            <button type="button" onClick={() => setSearch("")}>
              Search: {search} <span>×</span>
            </button>
          )}

          {filterClassId !== "all" && (
            <button type="button" onClick={() => setFilterClassId("all")}>
              {classMap.get(filterClassId)?.name || "Class"} <span>×</span>
            </button>
          )}

          {filterStatus !== "all" && (
            <button type="button" onClick={() => setFilterStatus("all")}>
              {statusLabel(filterStatus)} <span>×</span>
            </button>
          )}

          {filterRelationship !== "all" && (
            <button
              type="button"
              onClick={() => setFilterRelationship("all")}
            >
              {filterRelationship} <span>×</span>
            </button>
          )}
        </section>
      )}

      {/* Cards */}
      {viewMode === "cards" && (
        <section className="pp-content-section">
          <div className="pp-card-grid">
            {filteredRows.map((child) => {
              const age = calculateAge(child.student);

              return (
                <article
                  key={child.id}
                  className="pp-child-card"
                  onClick={() => openChild(child)}
                >
                  <div className="pp-child-main">
                    <Avatar
                      name={child.student.fullName}
                      photo={child.photoUrl}
                      primary={primary}
                    />

                    <div className="pp-child-copy">
                      <div className="pp-name-line">
                        <h3>{child.student.fullName}</h3>
                        <span
                          className={`pp-status-dot ${statusTone(
                            child.status,
                          )}`}
                          title={statusLabel(child.status)}
                        />
                      </div>

                      <p>
                        {child.className}
                        {child.student.admissionNumber
                          ? ` · ${child.student.admissionNumber}`
                          : ""}
                      </p>

                      <div className="pp-card-meta">
                        <span>{child.relationship}</span>
                        {age !== null && <span>{age} years</span>}
                        {child.student.gender && (
                          <span>{child.student.gender}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="pp-row-more"
                      onClick={(event) => {
                        event.stopPropagation();
                        openChild(child);
                      }}
                      aria-label={`View ${child.student.fullName}`}
                    >
                      ›
                    </button>
                  </div>

                  <div className="pp-card-footer">
                    <span>{child.organizationName}</span>
                    <strong>{statusLabel(child.status)}</strong>
                  </div>
                </article>
              );
            })}
          </div>

          {!filteredRows.length && (
            <EmptyState
              icon="🧒"
              title={
                childRows.length
                  ? "No children match your filters"
                  : "No linked children found"
              }
              text={
                childRows.length
                  ? "Clear or adjust the current search and filters."
                  : activeParentId || parents.length
                    ? "The school has not linked a student to this parent profile yet."
                    : "Your login is not connected to a permanent parent profile in this branch."
              }
            />
          )}
        </section>
      )}

      {/* Table */}
      {viewMode === "table" && (
        <section className="pp-table-card">
          <div className="pp-section-head">
            <div>
              <p>Parent directory</p>
              <h3>Children ({filteredRows.length})</h3>
            </div>
            <Chip tone="blue">Read only</Chip>
          </div>

          <div className="pp-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Relationship</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th aria-label="Action" />
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((child) => {
                  const age = calculateAge(child.student);

                  return (
                    <tr key={child.id}>
                      <td>
                        <button
                          type="button"
                          className="pp-table-student"
                          onClick={() => openChild(child)}
                        >
                          <Avatar
                            name={child.student.fullName}
                            photo={child.photoUrl}
                            primary={primary}
                          />
                          <span>
                            <strong>{child.student.fullName}</strong>
                            <small>
                              {child.student.admissionNumber ||
                                "No admission number"}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <strong>{child.className}</strong>
                        <small>{child.organizationName}</small>
                      </td>
                      <td>{child.relationship}</td>
                      <td>{child.student.gender || "Not set"}</td>
                      <td>{age === null ? "Not set" : age}</td>
                      <td>
                        <Chip tone={statusTone(child.status)}>
                          {statusLabel(child.status)}
                        </Chip>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="pp-table-action"
                          onClick={() => openChild(child)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!filteredRows.length && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon="🧒"
                        title="No children found"
                        text="No linked children match the current filters."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Summary */}
      {viewMode === "summary" && (
        <section className="pp-summary-grid">
          <SummarySection
            title="Children by Class"
            subtitle="Class distribution"
            items={classSummary}
          />
          <SummarySection
            title="Relationship"
            subtitle="Parent relationship"
            items={relationshipSummary}
          />
          <SummarySection
            title="Student Status"
            subtitle="Current standing"
            items={statusSummary}
          />
        </section>
      )}

      {/* Filters sheet */}
      {filterOpen && (
        <div className="pp-layer">
          <button
            type="button"
            className="pp-overlay"
            aria-label="Close filters"
            onClick={() => setFilterOpen(false)}
          />

          <section className="pp-sheet">
            <div className="pp-sheet-handle" />

            <div className="pp-sheet-head">
              <div>
                <p>My Children</p>
                <h2>Filter children</h2>
              </div>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                aria-label="Close filters"
              >
                ×
              </button>
            </div>

            <div className="pp-form-grid">
              <label>
                <span>Class</span>
                <select
                  value={filterClassId}
                  onChange={(event) => setFilterClassId(event.target.value)}
                >
                  <option value="all">All classes</option>
                  {classes.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Status</span>
                <select
                  value={filterStatus}
                  onChange={(event) =>
                    setFilterStatus(
                      event.target.value as "all" | StudentStatus,
                    )
                  }
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="graduated">Graduated</option>
                  <option value="transferred">Transferred</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </label>

              <label>
                <span>Relationship</span>
                <select
                  value={filterRelationship}
                  onChange={(event) =>
                    setFilterRelationship(event.target.value)
                  }
                >
                  <option value="all">All relationships</option>
                  {relationshipOptions.map((relationship) => (
                    <option key={relationship} value={relationship}>
                      {relationship}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="pp-sheet-actions">
              <button
                type="button"
                className="secondary"
                onClick={clearFilters}
              >
                Clear
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => setFilterOpen(false)}
              >
                Apply
              </button>
            </div>
          </section>
        </div>
      )}

      {/* More sheet */}
      {moreOpen && (
        <div className="pp-layer">
          <button
            type="button"
            className="pp-overlay"
            aria-label="Close more options"
            onClick={() => setMoreOpen(false)}
          />

          <section className="pp-sheet compact">
            <div className="pp-sheet-handle" />

            <div className="pp-sheet-head">
              <div>
                <p>View options</p>
                <h2>More</h2>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close more options"
              >
                ×
              </button>
            </div>

            <div className="pp-menu-list">
              <button
                type="button"
                className={viewMode === "cards" ? "active" : ""}
                onClick={() => {
                  setViewMode("cards");
                  setMoreOpen(false);
                }}
              >
                <span>▦</span>
                <div>
                  <strong>Cards</strong>
                  <small>Compact mobile-friendly child list</small>
                </div>
                <b>›</b>
              </button>

              <button
                type="button"
                className={viewMode === "table" ? "active" : ""}
                onClick={() => {
                  setViewMode("table");
                  setMoreOpen(false);
                }}
              >
                <span>☷</span>
                <div>
                  <strong>Table</strong>
                  <small>Detailed desktop and tablet view</small>
                </div>
                <b>›</b>
              </button>

              <button
                type="button"
                className={viewMode === "summary" ? "active" : ""}
                onClick={() => {
                  setViewMode("summary");
                  setMoreOpen(false);
                }}
              >
                <span>◫</span>
                <div>
                  <strong>Summary</strong>
                  <small>Class, relationship, and status breakdowns</small>
                </div>
                <b>›</b>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setMoreOpen(false);
                  await load();
                  showToast("success", "Children refreshed.");
                }}
              >
                <span>↻</span>
                <div>
                  <strong>Refresh</strong>
                  <small>Reload linked children and their details</small>
                </div>
                <b>›</b>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Child details drawer */}
      {selectedChild && (
        <div className="pp-drawer-layer">
          <button
            type="button"
            className="pp-drawer-overlay"
            aria-label="Close child details"
            onClick={() => setSelectedChild(null)}
          />

          <aside className="pp-drawer">
            <div className="pp-drawer-head">
              <div>
                <p>My Child</p>
                <h2>Student details</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChild(null)}
                aria-label="Close child details"
              >
                ×
              </button>
            </div>

            <section className="pp-profile-card">
              <Avatar
                name={selectedChild.student.fullName}
                photo={selectedChild.photoUrl}
                primary={primary}
                size="large"
              />

              <div>
                <h3>{selectedChild.student.fullName}</h3>
                <p>
                  {selectedChild.className}
                  {selectedChild.student.admissionNumber
                    ? ` · ${selectedChild.student.admissionNumber}`
                    : ""}
                </p>
                <div className="pp-chip-row">
                  <Chip tone={statusTone(selectedChild.status)}>
                    {statusLabel(selectedChild.status)}
                  </Chip>
                  <Chip tone="blue">{selectedChild.relationship}</Chip>
                  {selectedChild.isPrimary && (
                    <Chip tone="purple">Primary link</Chip>
                  )}
                </div>
              </div>
            </section>

            <section className="pp-detail-section">
              <div className="pp-section-head">
                <div>
                  <p>School information</p>
                  <h3>Academic profile</h3>
                </div>
              </div>

              <div className="pp-detail-grid">
                <article>
                  <span>Class</span>
                  <strong>{selectedChild.className}</strong>
                </article>
                <article>
                  <span>Organization</span>
                  <strong>{selectedChild.organizationName}</strong>
                </article>
                <article>
                  <span>Admission number</span>
                  <strong>
                    {selectedChild.student.admissionNumber || "Not set"}
                  </strong>
                </article>
                <article>
                  <span>Enrollment</span>
                  <strong>
                    {selectedChild.enrollment
                      ? statusLabel(selectedChild.enrollment.status)
                      : "No active enrollment"}
                  </strong>
                </article>
              </div>
            </section>

            <section className="pp-detail-section">
              <div className="pp-section-head">
                <div>
                  <p>Personal information</p>
                  <h3>Student profile</h3>
                </div>
              </div>

              <div className="pp-detail-list">
                <div>
                  <span>Gender</span>
                  <strong>{selectedChild.student.gender || "Not set"}</strong>
                </div>
                <div>
                  <span>Age</span>
                  <strong>
                    {calculateAge(selectedChild.student) ?? "Not set"}
                  </strong>
                </div>
                <div>
                  <span>Date of birth</span>
                  <strong>
                    {formatDate(selectedChild.student.dateOfBirth)}
                  </strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{selectedChild.student.email || "Not set"}</strong>
                </div>
              </div>
            </section>

            <section className="pp-readonly-note">
              <span>🔒</span>
              <div>
                <strong>School-managed information</strong>
                <p>
                  This page is read-only. Contact the school if any student
                  detail needs to be corrected.
                </p>
              </div>
            </section>
          </aside>
        </div>
      )}

      {toast && (
        <div className={`pp-toast ${toast.tone}`}>
          <span>
            {toast.tone === "success"
              ? "✓"
              : toast.tone === "error"
                ? "!"
                : "i"}
          </span>
          <p>{toast.message}</p>
        </div>
      )}
    </main>
  );
}

// ============================================================================
// CSS
// ============================================================================

const css = `
@keyframes ppSpin {
  to { transform: rotate(360deg); }
}

.pp-page {
  min-height: 100dvh;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 8px;
  padding-bottom: max(32px, env(safe-area-inset-bottom));
  overflow-x: hidden;
  background: var(--bg, #f8fafc);
  color: var(--text, #0f172a);
  font-family: var(--font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  font-size: var(--font-size, 16px);
}

.pp-page *,
.pp-page *::before,
.pp-page *::after {
  box-sizing: border-box;
}

.pp-page button,
.pp-page input,
.pp-page select {
  font: inherit;
}

.pp-state-card {
  width: min(460px, 100%);
  min-height: min(420px, calc(100dvh - 32px));
  margin: 0 auto;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  padding: 24px;
  border: 1px solid var(--border, rgba(148, 163, 184, .22));
  border-radius: 28px;
  background: var(--card, var(--surface, #fff));
  box-shadow: var(--shell-shadow, 0 24px 60px rgba(15, 23, 42, .08));
  text-align: center;
}

.pp-state-card h2,
.pp-state-card p {
  margin: 0;
}

.pp-state-card h2 {
  font-size: 22px;
  font-weight: 1000;
  letter-spacing: -.04em;
}

.pp-state-card p {
  max-width: 34rem;
  color: var(--muted, #64748b);
  font-size: 13px;
  line-height: 1.6;
}

.pp-spinner {
  width: 38px;
  height: 38px;
  border: 4px solid color-mix(in srgb, var(--pp-primary) 18%, transparent);
  border-top-color: var(--pp-primary);
  border-radius: 999px;
  animation: ppSpin .8s linear infinite;
}

.pp-action-strip {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px 44px;
  gap: 7px;
  width: 100%;
  padding: 7px;
  border: 1px solid var(--border, rgba(148, 163, 184, .20));
  border-radius: 20px;
  background: var(--card, var(--surface, #fff));
  box-shadow: 0 10px 26px rgba(15, 23, 42, .055);
}

.pp-search-box {
  min-width: 0;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border: 1px solid var(--input-border, var(--border, rgba(148, 163, 184, .24)));
  border-radius: 14px;
  background: var(--input-bg, var(--surface, #fff));
  color: var(--muted, #64748b);
}

.pp-search-box:focus-within {
  border-color: var(--pp-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pp-primary) 12%, transparent);
}

.pp-search-box > span {
  flex: 0 0 auto;
  font-size: 21px;
  line-height: 1;
}

.pp-search-box input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text, #0f172a);
  font-weight: 760;
}

.pp-search-box input::placeholder {
  color: var(--muted, #94a3b8);
}

.pp-search-clear {
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted, #64748b) 12%, transparent);
  color: var(--muted, #64748b);
  cursor: pointer;
}

.pp-filter-button,
.pp-more-button {
  position: relative;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 1000;
}

.pp-filter-button {
  border: 1px solid color-mix(in srgb, var(--pp-primary) 18%, var(--border, transparent));
  background: color-mix(in srgb, var(--pp-primary) 9%, var(--card, #fff));
  color: var(--pp-primary);
}

.pp-filter-button.active {
  border-color: var(--pp-primary);
  background: var(--pp-primary);
  color: var(--pp-primary-text);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--pp-primary) 24%, transparent);
}

.pp-more-button {
  border: 1px solid var(--border, rgba(148, 163, 184, .24));
  background: var(--card, var(--surface, #fff));
  color: var(--text, #0f172a);
  box-shadow: 0 6px 16px rgba(15, 23, 42, .05);
}

.pp-action-count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 19px;
  height: 19px;
  display: grid;
  place-items: center;
  padding: 0 5px;
  border: 2px solid var(--card, #fff);
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  line-height: 1;
}

.pp-active-filters {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.pp-active-filters button {
  min-height: 29px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 9px;
  border: 1px solid color-mix(in srgb, var(--pp-primary) 18%, var(--border, transparent));
  border-radius: 999px;
  background: color-mix(in srgb, var(--pp-primary) 8%, var(--card, #fff));
  color: var(--pp-primary);
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}

.pp-active-filters button span {
  font-size: 15px;
  line-height: 1;
}

.pp-content-section {
  margin-top: 10px;
}

.pp-card-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.pp-child-card {
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--border, rgba(148, 163, 184, .20));
  border-radius: 19px;
  background: var(--card, var(--surface, #fff));
  box-shadow: 0 9px 22px rgba(15, 23, 42, .045);
  cursor: pointer;
  overflow: hidden;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}

.pp-child-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--pp-primary) 34%, var(--border, transparent));
  box-shadow: 0 13px 28px rgba(15, 23, 42, .07);
}

.pp-child-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
}

.pp-avatar {
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 15px;
  overflow: hidden;
  font-size: 18px;
  font-weight: 1000;
  box-shadow: 0 7px 18px rgba(15, 23, 42, .10);
}

.pp-avatar.large {
  width: 76px;
  height: 76px;
  border-radius: 24px;
  font-size: 28px;
}

.pp-child-copy {
  min-width: 0;
  flex: 1;
}

.pp-name-line {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
}

.pp-name-line h3 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--text, #0f172a);
  font-size: 14px;
  font-weight: 1000;
  letter-spacing: -.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pp-status-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 12%, transparent);
}

.pp-status-dot.green { color: #22c55e; background: #22c55e; }
.pp-status-dot.red { color: #ef4444; background: #ef4444; }
.pp-status-dot.blue { color: #3b82f6; background: #3b82f6; }
.pp-status-dot.orange { color: #f59e0b; background: #f59e0b; }
.pp-status-dot.gray { color: #94a3b8; background: #94a3b8; }

.pp-child-copy > p {
  min-width: 0;
  margin: 3px 0 0;
  overflow: hidden;
  color: var(--muted, #64748b);
  font-size: 11px;
  font-weight: 740;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pp-card-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 5px;
}

.pp-card-meta span {
  min-height: 21px;
  display: inline-flex;
  align-items: center;
  padding: 3px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted, #64748b) 9%, transparent);
  color: var(--muted, #64748b);
  font-size: 9px;
  font-weight: 850;
  text-transform: capitalize;
}

.pp-row-more {
  width: 31px;
  height: 31px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid var(--border, rgba(148, 163, 184, .18));
  border-radius: 999px;
  background: color-mix(in srgb, var(--pp-primary) 7%, var(--card, #fff));
  color: var(--pp-primary);
  font-size: 20px;
  font-weight: 1000;
  cursor: pointer;
}

.pp-card-footer {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px solid var(--border, rgba(148, 163, 184, .13));
}

.pp-card-footer span,
.pp-card-footer strong {
  min-width: 0;
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pp-card-footer span {
  color: var(--muted, #64748b);
  font-weight: 760;
}

.pp-card-footer strong {
  color: var(--pp-primary);
  font-weight: 950;
}

.pp-chip {
  max-width: 100%;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  overflow: hidden;
  font-size: 10px;
  font-weight: 950;
  line-height: 1.1;
  text-overflow: ellipsis;
  text-transform: capitalize;
  white-space: nowrap;
}

.pp-chip.green { background: rgba(34, 197, 94, .13); color: #16a34a; }
.pp-chip.red { background: rgba(239, 68, 68, .13); color: #dc2626; }
.pp-chip.blue { background: rgba(59, 130, 246, .13); color: #2563eb; }
.pp-chip.orange { background: rgba(245, 158, 11, .14); color: #d97706; }
.pp-chip.purple { background: rgba(147, 51, 234, .13); color: #9333ea; }
.pp-chip.gray {
  background: color-mix(in srgb, var(--muted, #64748b) 12%, transparent);
  color: var(--muted, #64748b);
}

.pp-empty {
  min-height: 180px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 7px;
  padding: 18px;
  border: 1px dashed var(--border, rgba(148, 163, 184, .30));
  border-radius: 21px;
  background: var(--card, var(--surface, #fff));
  text-align: center;
}

.pp-empty-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: color-mix(in srgb, var(--pp-primary) 10%, var(--card, #fff));
  font-size: 24px;
}

.pp-empty h3,
.pp-empty p {
  margin: 0;
}

.pp-empty h3 {
  color: var(--text, #0f172a);
  font-size: 16px;
  font-weight: 1000;
  letter-spacing: -.03em;
}

.pp-empty p {
  max-width: 34rem;
  color: var(--muted, #64748b);
  font-size: 12px;
  line-height: 1.55;
}

.pp-table-card,
.pp-summary-section {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid var(--border, rgba(148, 163, 184, .20));
  border-radius: 21px;
  background: var(--card, var(--surface, #fff));
  box-shadow: 0 10px 25px rgba(15, 23, 42, .045);
}

.pp-section-head {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 9px;
  margin-bottom: 9px;
}

.pp-section-head p,
.pp-section-head h3 {
  margin: 0;
}

.pp-section-head p {
  color: var(--pp-primary);
  font-size: 9px;
  font-weight: 950;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.pp-section-head h3 {
  margin-top: 2px;
  color: var(--text, #0f172a);
  font-size: 17px;
  font-weight: 1000;
  letter-spacing: -.035em;
}

.pp-table-scroll {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border, rgba(148, 163, 184, .16));
  border-radius: 16px;
}

.pp-table-scroll table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
  background: var(--card, var(--surface, #fff));
}

.pp-table-scroll th,
.pp-table-scroll td {
  padding: 9px;
  border-bottom: 1px solid var(--border, rgba(148, 163, 184, .14));
  color: var(--text, #0f172a);
  text-align: left;
  vertical-align: middle;
  font-size: 12px;
}

.pp-table-scroll th {
  background: color-mix(in srgb, var(--pp-primary) 5%, var(--card, #fff));
  color: var(--muted, #64748b);
  font-size: 9px;
  font-weight: 1000;
  letter-spacing: .07em;
  text-transform: uppercase;
}

.pp-table-scroll td > strong,
.pp-table-scroll td > small {
  display: block;
}

.pp-table-scroll td > small {
  margin-top: 2px;
  color: var(--muted, #64748b);
  font-size: 10px;
}

.pp-table-student {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.pp-table-student .pp-avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  font-size: 15px;
}

.pp-table-student > span {
  min-width: 0;
}

.pp-table-student strong,
.pp-table-student small {
  display: block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pp-table-student strong {
  font-weight: 950;
}

.pp-table-student small {
  margin-top: 2px;
  color: var(--muted, #64748b);
  font-size: 10px;
}

.pp-table-action {
  min-height: 31px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--pp-primary) 22%, var(--border, transparent));
  border-radius: 999px;
  background: color-mix(in srgb, var(--pp-primary) 8%, var(--card, #fff));
  color: var(--pp-primary);
  font-size: 10px;
  font-weight: 950;
  cursor: pointer;
}

.pp-summary-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
}

.pp-summary-list {
  display: grid;
  gap: 7px;
}

.pp-summary-row {
  padding: 10px;
  border: 1px solid var(--border, rgba(148, 163, 184, .16));
  border-radius: 15px;
  background: color-mix(in srgb, var(--muted, #64748b) 4%, var(--card, #fff));
}

.pp-summary-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pp-summary-row-top strong {
  min-width: 0;
  overflow: hidden;
  color: var(--text, #0f172a);
  font-size: 12px;
  font-weight: 950;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pp-summary-row-top span {
  flex: 0 0 auto;
  color: var(--pp-primary);
  font-size: 12px;
  font-weight: 1000;
}

.pp-progress-track {
  height: 6px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted, #64748b) 12%, transparent);
}

.pp-progress-track div {
  height: 100%;
  border-radius: inherit;
  background: var(--pp-primary);
}

.pp-summary-row small {
  display: block;
  margin-top: 5px;
  color: var(--muted, #64748b);
  font-size: 9px;
  font-weight: 750;
}

.pp-layer,
.pp-drawer-layer {
  position: fixed;
  inset: 0;
  z-index: 90;
}

.pp-overlay,
.pp-drawer-overlay {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(15, 23, 42, .54);
  backdrop-filter: blur(2px);
}

.pp-sheet {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  max-height: min(86dvh, 720px);
  overflow-y: auto;
  padding: 9px 12px max(14px, env(safe-area-inset-bottom));
  border-radius: 25px 25px 0 0;
  background: var(--card, var(--surface, #fff));
  color: var(--text, #0f172a);
  box-shadow: 0 -22px 64px rgba(15, 23, 42, .22);
}

.pp-sheet.compact {
  max-height: min(78dvh, 580px);
}

.pp-sheet-handle {
  width: 42px;
  height: 4px;
  margin: 0 auto 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted, #64748b) 36%, transparent);
}

.pp-sheet-head,
.pp-drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.pp-sheet-head {
  padding-bottom: 10px;
}

.pp-sheet-head p,
.pp-sheet-head h2,
.pp-drawer-head p,
.pp-drawer-head h2 {
  margin: 0;
}

.pp-sheet-head p,
.pp-drawer-head p {
  color: var(--pp-primary);
  font-size: 9px;
  font-weight: 950;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.pp-sheet-head h2,
.pp-drawer-head h2 {
  margin-top: 2px;
  color: var(--text, #0f172a);
  font-size: 20px;
  font-weight: 1000;
  letter-spacing: -.045em;
}

.pp-sheet-head > button,
.pp-drawer-head > button {
  width: 35px;
  height: 35px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 1px solid var(--border, rgba(148, 163, 184, .20));
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted, #64748b) 7%, var(--card, #fff));
  color: var(--text, #0f172a);
  font-size: 20px;
  cursor: pointer;
}

.pp-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.pp-form-grid label {
  display: grid;
  gap: 5px;
}

.pp-form-grid label > span {
  color: var(--muted, #64748b);
  font-size: 10px;
  font-weight: 900;
}

.pp-form-grid select {
  width: 100%;
  min-height: 43px;
  padding: 0 11px;
  border: 1px solid var(--input-border, var(--border, rgba(148, 163, 184, .24)));
  border-radius: 13px;
  outline: 0;
  background: var(--input-bg, var(--surface, #fff));
  color: var(--input-text, var(--text, #0f172a));
  font-weight: 800;
}

.pp-form-grid select:focus {
  border-color: var(--pp-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pp-primary) 11%, transparent);
}

.pp-sheet-actions {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  margin-top: 12px;
  padding-top: 9px;
  background: var(--card, var(--surface, #fff));
}

.pp-sheet-actions button {
  min-height: 43px;
  border-radius: 13px;
  font-weight: 950;
  cursor: pointer;
}

.pp-sheet-actions .secondary {
  border: 1px solid var(--border, rgba(148, 163, 184, .24));
  background: var(--card, var(--surface, #fff));
  color: var(--text, #0f172a);
}

.pp-sheet-actions .primary {
  border: 1px solid var(--pp-primary);
  background: var(--pp-primary);
  color: var(--pp-primary-text);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--pp-primary) 25%, transparent);
}

.pp-menu-list {
  display: grid;
  gap: 7px;
}

.pp-menu-list > button {
  min-width: 0;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 9px;
  min-height: 61px;
  padding: 8px;
  border: 1px solid var(--border, rgba(148, 163, 184, .18));
  border-radius: 16px;
  background: var(--card, var(--surface, #fff));
  color: var(--text, #0f172a);
  text-align: left;
  cursor: pointer;
}

.pp-menu-list > button.active {
  border-color: color-mix(in srgb, var(--pp-primary) 45%, var(--border, transparent));
  background: color-mix(in srgb, var(--pp-primary) 8%, var(--card, #fff));
}

.pp-menu-list > button > span {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--pp-primary) 10%, var(--card, #fff));
  color: var(--pp-primary);
  font-size: 18px;
}

.pp-menu-list > button div {
  min-width: 0;
}

.pp-menu-list > button strong,
.pp-menu-list > button small {
  display: block;
}

.pp-menu-list > button strong {
  color: var(--text, #0f172a);
  font-size: 12px;
  font-weight: 950;
}

.pp-menu-list > button small {
  margin-top: 2px;
  color: var(--muted, #64748b);
  font-size: 10px;
  line-height: 1.4;
}

.pp-menu-list > button > b {
  color: var(--muted, #64748b);
  font-size: 17px;
}

.pp-drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(94vw, 620px);
  max-width: 100vw;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  background: var(--card, var(--surface, #fff));
  color: var(--text, #0f172a);
  box-shadow: -24px 0 70px rgba(15, 23, 42, .22);
}

.pp-drawer-head {
  position: sticky;
  top: 0;
  z-index: 3;
  padding: 3px 0 10px;
  background: var(--card, var(--surface, #fff));
}

.pp-profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border, rgba(148, 163, 184, .18));
  border-radius: 21px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--pp-primary) 10%, var(--card, #fff)),
      var(--card, #fff) 70%
    );
}

.pp-profile-card > div:last-child {
  min-width: 0;
}

.pp-profile-card h3,
.pp-profile-card p {
  margin: 0;
}

.pp-profile-card h3 {
  overflow: hidden;
  color: var(--text, #0f172a);
  font-size: 20px;
  font-weight: 1000;
  letter-spacing: -.045em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pp-profile-card p {
  margin-top: 3px;
  color: var(--muted, #64748b);
  font-size: 11px;
  font-weight: 760;
}

.pp-chip-row {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.pp-detail-section {
  margin-top: 14px;
}

.pp-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.pp-detail-grid article {
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--border, rgba(148, 163, 184, .15));
  border-radius: 15px;
  background: color-mix(in srgb, var(--muted, #64748b) 5%, var(--card, #fff));
}

.pp-detail-grid span,
.pp-detail-grid strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pp-detail-grid span {
  color: var(--muted, #64748b);
  font-size: 9px;
  font-weight: 850;
  text-transform: uppercase;
}

.pp-detail-grid strong {
  margin-top: 4px;
  color: var(--text, #0f172a);
  font-size: 12px;
  font-weight: 950;
}

.pp-detail-list {
  overflow: hidden;
  border: 1px solid var(--border, rgba(148, 163, 184, .16));
  border-radius: 17px;
}

.pp-detail-list > div {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(110px, .65fr) minmax(0, 1fr);
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid var(--border, rgba(148, 163, 184, .13));
}

.pp-detail-list > div:last-child {
  border-bottom: 0;
}

.pp-detail-list span {
  color: var(--muted, #64748b);
  font-size: 10px;
  font-weight: 800;
}

.pp-detail-list strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--text, #0f172a);
  font-size: 11px;
  font-weight: 950;
  text-align: right;
}

.pp-readonly-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 14px;
  padding: 11px;
  border: 1px solid color-mix(in srgb, var(--pp-primary) 18%, var(--border, transparent));
  border-radius: 16px;
  background: color-mix(in srgb, var(--pp-primary) 7%, var(--card, #fff));
}

.pp-readonly-note > span {
  flex: 0 0 auto;
  font-size: 18px;
}

.pp-readonly-note strong,
.pp-readonly-note p {
  display: block;
  margin: 0;
}

.pp-readonly-note strong {
  color: var(--text, #0f172a);
  font-size: 11px;
  font-weight: 950;
}

.pp-readonly-note p {
  margin-top: 3px;
  color: var(--muted, #64748b);
  font-size: 10px;
  line-height: 1.5;
}

.pp-toast {
  position: fixed;
  z-index: 120;
  right: 12px;
  bottom: max(14px, env(safe-area-inset-bottom));
  width: min(360px, calc(100vw - 24px));
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px;
  border: 1px solid var(--border, rgba(148, 163, 184, .20));
  border-radius: 15px;
  background: var(--card, var(--surface, #fff));
  box-shadow: 0 18px 48px rgba(15, 23, 42, .18);
}

.pp-toast > span {
  width: 29px;
  height: 29px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 10px;
  font-weight: 1000;
}

.pp-toast.success > span {
  background: rgba(34, 197, 94, .14);
  color: #16a34a;
}

.pp-toast.error > span {
  background: rgba(239, 68, 68, .14);
  color: #dc2626;
}

.pp-toast.info > span {
  background: rgba(59, 130, 246, .14);
  color: #2563eb;
}

.pp-toast p {
  margin: 0;
  color: var(--text, #0f172a);
  font-size: 11px;
  font-weight: 850;
  line-height: 1.4;
}

@media (min-width: 620px) {
  .pp-page {
    padding: 10px;
  }

  .pp-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pp-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pp-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .pp-summary-section {
    margin-top: 10px;
  }
}

@media (min-width: 980px) {
  .pp-card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .pp-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .pp-sheet {
    right: 12px;
    bottom: 12px;
    left: auto;
    width: min(520px, calc(100vw - 24px));
    max-height: min(86dvh, 720px);
    border-radius: 24px;
  }
}

@media (max-width: 420px) {
  .pp-page {
    padding: 6px;
  }

  .pp-action-strip {
    grid-template-columns: minmax(0, 1fr) 41px 41px;
    gap: 5px;
    padding: 5px;
    border-radius: 17px;
  }

  .pp-filter-button,
  .pp-more-button {
    width: 41px;
    height: 41px;
    border-radius: 13px;
  }

  .pp-search-box {
    min-height: 41px;
    padding: 0 8px;
    border-radius: 13px;
  }

  .pp-child-card {
    padding: 8px;
    border-radius: 17px;
  }

  .pp-avatar {
    width: 43px;
    height: 43px;
    border-radius: 14px;
  }

  .pp-detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pp-page *,
  .pp-page *::before,
  .pp-page *::after {
    scroll-behavior: auto !important;
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
`;