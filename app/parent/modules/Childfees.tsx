"use client";

/**
 * app/parent/modules/Childsfees.tsx
 * --------------------------------------------------------------------------
 * ELEEVEON CHILD FEES — PARENT PORTAL
 *
 * Read-only, offline-first parent finance experience using the same compact
 * visual language as Branch Fees:
 * - compact search + child selector + filter + more actions;
 * - invoice, payment and analytics views;
 * - cards/table/analytics display modes;
 * - linked-child isolation through studentParents;
 * - invoice item detail drawer and payment receipt detail drawer;
 * - Dexie data through listActiveLocal;
 * - no unsupported PermissionGate moduleKey/action props.
 *
 * Future-ready:
 * - the Pay button is intentionally a safe UI placeholder until the parent
 *   Paystack checkout flow is connected.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAccount } from "../../context/account-context";
import { useSettings } from "../../context/settings-context";
import { useActiveBranch } from "../../context/active-branch-context";
import { useActiveMembership } from "../../context/active-membership-context";
import { listActiveLocal } from "../../lib/sync/syncUtils";
import { useDataRevision } from "../../hooks/useDataRevision";
import { useBackgroundLoader } from "../../hooks/useBackgroundLoader";
import { useEntityMediaUrls } from "../../hooks/useEntityMediaUrls";

type AnyRow = Record<string, any>;
type ViewMode = "cards" | "table" | "analytics";
type Section = "invoices" | "payments";
type StatusFilter =
  | "all"
  | "issued"
  | "part_paid"
  | "paid"
  | "overdue"
  | "cancelled";
type Tone = "green" | "red" | "blue" | "gray" | "orange";
type DetailState =
  | { kind: "invoice"; row: InvoiceView }
  | { kind: "payment"; row: AnyRow }
  | null;

type OpenWorkspaceSession = {
  membership?: Record<string, any> | null;
  schoolId?: string | null;
  branchId?: string | null;
};

type ChildView = {
  id: string;
  name: string;
  admissionNumber: string;
  className: string;
  photo?: string;
};

type InvoiceView = AnyRow & {
  amountPaidValue: number;
  balanceValue: number;
  statusValue: string;
  studentName: string;
  className: string;
};

const OPEN_WORKSPACE_KEY = "eleeveon_open_workspace";

function storageValue(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
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

function idOf(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const row = value as AnyRow;
    return String(row.id ?? row.localId ?? row.cloudId ?? "").trim();
  }
  return String(value).trim();
}

function firstId(...values: unknown[]) {
  for (const value of values) {
    const id = idOf(value);
    if (id && id !== "0") return id;
  }
  return "";
}

function sameId(a: unknown, b: unknown) {
  const left = idOf(a);
  const right = idOf(b);
  return Boolean(left && right && left === right);
}

function n(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function text(value: unknown, fallback = "") {
  return String(value || "").trim() || fallback;
}

function rowName(row?: AnyRow | null) {
  return text(row?.fullName || row?.name || row?.title, "Unnamed");
}

function sameScope(
  row: AnyRow,
  accountId?: string | null,
  schoolId?: string,
  branchId?: string,
) {
  if (!row || row.isDeleted === true) return false;
  if (accountId && row.accountId && row.accountId !== accountId) return false;
  if (schoolId && row.schoolId && !sameId(row.schoolId, schoolId)) return false;
  if (branchId && row.branchId && !sameId(row.branchId, branchId)) return false;
  return true;
}

function money(value: unknown, currency = "GHS") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "GHS",
      maximumFractionDigits: 2,
    }).format(n(value));
  } catch {
    return `${currency || "GHS"} ${n(value).toLocaleString()}`;
  }
}

function dateLabel(value?: string | number | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function invoiceStatus(total: number, paid: number, dueDate?: string) {
  if (total > 0 && paid >= total) return "paid";
  if (paid > 0) return "part_paid";
  if (dueDate && new Date(dueDate).getTime() < Date.now()) return "overdue";
  return "issued";
}

function statusLabel(value?: string) {
  return text(value, "issued")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(value?: string): Tone {
  const status = String(value || "").toLowerCase();
  if (["paid", "success", "succeeded"].includes(status)) return "green";
  if (["overdue", "failed", "cancelled", "reversed"].includes(status)) return "red";
  if (["part_paid", "pending", "processing"].includes(status)) return "orange";
  if (["issued", "draft"].includes(status)) return "blue";
  return "gray";
}

function Chip({ children, tone = "gray" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`cf-chip ${tone}`}>{children}</span>;
}

function SliderIcon() {
  return (
    <svg className="cf-slider-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h9" />
      <path d="M17 7h3" />
      <circle cx="15" cy="7" r="2" />
      <path d="M4 17h3" />
      <path d="M11 17h9" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <section className="cf-empty">
      <div>₵</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </section>
  );
}

export default function ChildsFees() {
  const router = useRouter();
  const revision = useDataRevision();
  const { loading, setLoading } = useBackgroundLoader();
  const {
    accountId: rawAccountId,
    authenticated,
    loading: accountLoading,
  } = useAccount();
  const { settings, loading: settingsLoading } = useSettings();
  const { activeMembership } = useActiveMembership() as AnyRow;
  const {
    activeSchool,
    activeSchoolId,
    activeBranch,
    activeBranchId,
  } = useActiveBranch() as AnyRow;

  const openWorkspace = useMemo(
    () => storedJson<OpenWorkspaceSession>(OPEN_WORKSPACE_KEY),
    [],
  );
  const storedMembership = useMemo(
    () => storedJson<AnyRow>("activeMembership"),
    [],
  );
  const membership = useMemo(
    () =>
      (openWorkspace?.membership ||
        activeMembership ||
        storedMembership ||
        {}) as AnyRow,
    [activeMembership, openWorkspace, storedMembership],
  );

  const accountId = useMemo(
    () =>
      text(rawAccountId) ||
      text(membership.accountId) ||
      text(settings?.accountId),
    [membership.accountId, rawAccountId, settings?.accountId],
  );

  const schoolId = useMemo(
    () =>
      firstId(
        openWorkspace?.schoolId,
        membership.schoolId,
        membership.school?.id,
        activeSchoolId,
        activeSchool?.id,
        settings?.schoolId,
        storageValue("activeSchoolId"),
      ),
    [
      activeSchool?.id,
      activeSchoolId,
      membership.school?.id,
      membership.schoolId,
      openWorkspace?.schoolId,
      settings?.schoolId,
    ],
  );

  const branchId = useMemo(
    () =>
      firstId(
        openWorkspace?.branchId,
        membership.branchId,
        membership.schoolBranchId,
        membership.branch?.id,
        activeBranchId,
        activeBranch?.id,
        settings?.branchId,
        storageValue("activeBranchId"),
      ),
    [
      activeBranch?.id,
      activeBranchId,
      membership.branch?.id,
      membership.branchId,
      membership.schoolBranchId,
      openWorkspace?.branchId,
      settings?.branchId,
    ],
  );

  const parentId = firstId(
    membership.parentId,
    membership.parentLocalId,
    membership.parent?.id,
    storageValue("activeParentId"),
  );

  const role = String(membership.role || "").toLowerCase();
  const canView = role === "parent";

  const primary = settings?.primaryColor || "var(--primary-color,#2563eb)";

  const [parents, setParents] = useState<AnyRow[]>([]);
  const [students, setStudents] = useState<AnyRow[]>([]);
  const [studentParents, setStudentParents] = useState<AnyRow[]>([]);
  const [enrollments, setEnrollments] = useState<AnyRow[]>([]);
  const [classes, setClasses] = useState<AnyRow[]>([]);
  const [structures, setStructures] = useState<AnyRow[]>([]);
  const [periods, setPeriods] = useState<AnyRow[]>([]);
  const [currencySettings, setCurrencySettings] = useState<AnyRow[]>([]);
  const [feeStructures, setFeeStructures] = useState<AnyRow[]>([]);
  const [invoices, setInvoices] = useState<AnyRow[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<AnyRow[]>([]);
  const [payments, setPayments] = useState<AnyRow[]>([]);

  const [section, setSection] = useState<Section>("invoices");
  const [view, setView] = useState<ViewMode>("cards");
  const [childId, setChildId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [structureId, setStructureId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [detail, setDetail] = useState<DetailState>(null);
  const [toast, setToast] = useState("");

  const mediaByStudentId = useEntityMediaUrls({
    accountId,
    ownerTable: "students",
    rows: students,
    fields: [{ fieldKey: "photo", mediaIdKey: "photoMediaId" }],
  });

  useEffect(() => {
    if (accountLoading) return;
    if (!authenticated || !accountId) router.replace("/login");
  }, [accountId, accountLoading, authenticated, router]);

  async function load() {
    if (!authenticated || !accountId || !schoolId || !branchId || !canView) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        parentRows,
        studentRows,
        linkRows,
        enrollmentRows,
        classRows,
        structureRows,
        periodRows,
        currencyRows,
        feeRows,
        invoiceRows,
        itemRows,
        paymentRows,
      ] = await Promise.all([
        listActiveLocal<AnyRow>("parents" as any),
        listActiveLocal<AnyRow>("students" as any),
        listActiveLocal<AnyRow>("studentParents" as any),
        listActiveLocal<AnyRow>("studentEnrollments" as any),
        listActiveLocal<AnyRow>("classes" as any),
        listActiveLocal<AnyRow>("academicStructures" as any),
        listActiveLocal<AnyRow>("academicPeriods" as any),
        listActiveLocal<AnyRow>("schoolCurrencySettings" as any),
        listActiveLocal<AnyRow>("feeStructures" as any),
        listActiveLocal<AnyRow>("studentFeeInvoices" as any),
        listActiveLocal<AnyRow>("studentFeeInvoiceItems" as any),
        listActiveLocal<AnyRow>("studentFeePayments" as any),
      ]);

      const scoped = (rows: AnyRow[]) =>
        rows.filter((row) => sameScope(row, accountId, schoolId, branchId));

      setParents(scoped(parentRows));
      setStudents(scoped(studentRows).sort((a, b) => rowName(a).localeCompare(rowName(b))));
      setStudentParents(scoped(linkRows));
      setEnrollments(scoped(enrollmentRows));
      setClasses(scoped(classRows));
      setStructures(scoped(structureRows));
      setPeriods(scoped(periodRows));
      setCurrencySettings(scoped(currencyRows));
      setFeeStructures(scoped(feeRows));
      setInvoices(scoped(invoiceRows));
      setInvoiceItems(scoped(itemRows));
      setPayments(scoped(paymentRows));
    } catch (error) {
      console.error("Failed to load child fees:", error);
      setToast("Unable to load child fees.");
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
    accountLoading,
    settingsLoading,
    revision,
    canView,
  ]);

  const resolvedParentId = useMemo(() => {
    if (parentId) return parentId;

    const email = text(membership.email || membership.user?.email).toLowerCase();
    const phone = text(membership.phone || membership.user?.phone).replace(/\s+/g, "");

    const parent = parents.find((row) => {
      const rowEmail = text(row.email).toLowerCase();
      const rowPhone = text(row.phone).replace(/\s+/g, "");
      return (email && email === rowEmail) || (phone && phone === rowPhone);
    });

    return idOf(parent);
  }, [membership, parentId, parents]);

  const classMap = useMemo(
    () => new Map(classes.map((row) => [idOf(row), rowName(row)])),
    [classes],
  );
  const structureMap = useMemo(
    () => new Map(structures.map((row) => [idOf(row), rowName(row)])),
    [structures],
  );
  const periodMap = useMemo(
    () => new Map(periods.map((row) => [idOf(row), rowName(row)])),
    [periods],
  );
  const studentMap = useMemo(
    () => new Map(students.map((row) => [idOf(row), row])),
    [students],
  );
  const invoiceMap = useMemo(
    () => new Map(invoices.map((row) => [idOf(row), row])),
    [invoices],
  );

  const children = useMemo<ChildView[]>(() => {
    if (!resolvedParentId) return [];
    const linkedIds = new Set(
      studentParents
        .filter((link) => sameId(link.parentId, resolvedParentId))
        .map((link) => idOf(link.studentId)),
    );

    return students
      .filter((student) => linkedIds.has(idOf(student)))
      .map((student) => {
        const sid = idOf(student);
        const enrollment =
          enrollments.find(
            (row) =>
              sameId(row.studentId, sid) &&
              ["active", "promoted"].includes(String(row.status || "").toLowerCase()),
          ) ||
          enrollments.find(
            (row) =>
              sameId(row.studentId, sid) &&
              String(row.status || "").toLowerCase() === "completed",
          );
        const classId = firstId(enrollment?.classId, student.currentClassId);
        return {
          id: sid,
          name: rowName(student),
          admissionNumber: text(student.admissionNumber, "No admission number"),
          className: classMap.get(classId) || "Class not assigned",
          photo:
            mediaByStudentId[sid]?.photo ||
            (String(student.photo || "").startsWith("blob:")
              ? undefined
              : student.photo),
        };
      });
  }, [
    classMap,
    enrollments,
    mediaByStudentId,
    resolvedParentId,
    studentParents,
    students,
  ]);

  useEffect(() => {
    if (!childId && children.length) setChildId(children[0].id);
    if (childId && !children.some((child) => child.id === childId)) {
      setChildId(children[0]?.id || "");
    }
  }, [childId, children]);

  const childIds = useMemo(() => new Set(children.map((child) => child.id)), [children]);

  const currency = useMemo(() => {
    const row =
      currencySettings.find((item) => item.defaultForFees) ||
      currencySettings.find((item) => item.active !== false) ||
      currencySettings[0];

    return {
      code: text(row?.currencyCode || invoices[0]?.currencyCode, "GHS"),
      symbol: text(row?.currencySymbol, "₵"),
    };
  }, [currencySettings, invoices]);

  const successfulPayments = useMemo(
    () =>
      payments.filter((row) =>
        ["paid", "success", "succeeded"].includes(
          String(row.status || "paid").toLowerCase(),
        ),
      ),
    [payments],
  );

  const invoiceRows = useMemo<InvoiceView[]>(() => {
    const q = query.trim().toLowerCase();
    return invoices
      .filter((row) => childIds.has(idOf(row.studentId)))
      .filter((row) => !childId || sameId(row.studentId, childId))
      .filter(
        (row) => !structureId || sameId(row.academicStructureId, structureId),
      )
      .filter((row) => !periodId || sameId(row.academicPeriodId, periodId))
      .map((row): InvoiceView => {
        const paidFromRows = successfulPayments
          .filter((payment) => sameId(payment.invoiceId, idOf(row)))
          .reduce((sum, payment) => sum + n(payment.amount), 0);
        const amountPaidValue = Math.max(n(row.amountPaid), paidFromRows);
        const balanceValue = Math.max(0, n(row.total) - amountPaidValue);
        const statusValue = invoiceStatus(
          n(row.total),
          amountPaidValue,
          row.dueDate,
        );
        const student = studentMap.get(idOf(row.studentId));
        return {
          ...(row as AnyRow),
          amountPaidValue,
          balanceValue,
          statusValue,
          studentName: rowName(student),
          className: classMap.get(idOf(row.classId)) || "Class",
        };
      })
      .filter((row) => status === "all" || row.statusValue === status)
      .filter((row) => {
        if (!q) return true;
        return [
          row.invoiceNumber,
          row.studentName,
          row.className,
          row.statusValue,
          row.note,
          structureMap.get(idOf(row.academicStructureId)),
          periodMap.get(idOf(row.academicPeriodId)),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort(
        (a, b) =>
          new Date(b.issueDate || b.createdAt || 0).getTime() -
          new Date(a.issueDate || a.createdAt || 0).getTime(),
      );
  }, [
    childId,
    childIds,
    classMap,
    invoices,
    periodId,
    periodMap,
    query,
    status,
    structureId,
    structureMap,
    studentMap,
    successfulPayments,
  ]);

  const paymentRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments
      .filter((row) => childIds.has(idOf(row.studentId)))
      .filter((row) => !childId || sameId(row.studentId, childId))
      .filter((row) => {
        const invoice = invoiceMap.get(idOf(row.invoiceId));
        if (
          structureId &&
          !sameId(invoice?.academicStructureId, structureId)
        ) {
          return false;
        }
        if (periodId && !sameId(invoice?.academicPeriodId, periodId)) {
          return false;
        }
        return true;
      })
      .filter((row) => {
        if (!q) return true;
        const invoice = invoiceMap.get(idOf(row.invoiceId));
        return [
          row.receiptNumber,
          row.referenceNumber,
          row.providerReference,
          row.method,
          row.status,
          row.payerName,
          rowName(studentMap.get(idOf(row.studentId))),
          invoice?.invoiceNumber,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort(
        (a, b) =>
          new Date(b.paidAt || b.date || b.createdAt || 0).getTime() -
          new Date(a.paidAt || a.date || a.createdAt || 0).getTime(),
      );
  }, [
    childId,
    childIds,
    invoiceMap,
    payments,
    periodId,
    query,
    structureId,
    studentMap,
  ]);

  const summary = useMemo(() => {
    const total = invoiceRows.reduce((sum, row) => sum + n(row.total), 0);
    const paid = invoiceRows.reduce(
      (sum, row) => sum + row.amountPaidValue,
      0,
    );
    const balance = invoiceRows.reduce(
      (sum, row) => sum + row.balanceValue,
      0,
    );
    return {
      total,
      paid,
      balance,
      invoices: invoiceRows.length,
      paidInvoices: invoiceRows.filter((row) => row.statusValue === "paid").length,
      overdue: invoiceRows.filter((row) => row.statusValue === "overdue").length,
      partPaid: invoiceRows.filter((row) => row.statusValue === "part_paid").length,
      payments: paymentRows.length,
    };
  }, [invoiceRows, paymentRows.length]);

  const selectedChild = children.find((child) => child.id === childId);
  const filteredPeriods = structureId
    ? periods.filter((row) => sameId(row.academicStructureId, structureId))
    : periods;

  const activeFilterCount = [
    childId,
    structureId,
    periodId,
    status !== "all" ? status : "",
  ].filter(Boolean).length;

  const invoiceItemsFor = (invoiceId: string) =>
    invoiceItems
      .filter((row) => sameId(row.invoiceId, invoiceId))
      .sort((a, b) => n(a.order) - n(b.order));

  const resetFilters = () => {
    setStatus("all");
    setStructureId("");
    setPeriodId("");
    setQuery("");
  };

  const paymentPlaceholder = () => {
    setToast("Online checkout will open here after Paystack is connected.");
    window.setTimeout(() => setToast(""), 3800);
  };

  const contextLoading = accountLoading || settingsLoading || loading;

  if (contextLoading) {
    return (
      <div className="cf-page cf-loading">
        <div className="cf-spinner" />
        <span>Loading child fees…</span>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="cf-page cf-state">
        <div className="cf-state-icon">!</div>
        <h2>Fees unavailable</h2>
        <p>This page is available to an active parent membership.</p>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div
      className="cf-page"
      style={{ "--primary": primary } as React.CSSProperties}
    >
      <div className="cf-toolbar">
        <div className="cf-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search invoices or receipts…"
            aria-label="Search child fees"
          />
          {query ? (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              ×
            </button>
          ) : null}
        </div>
        <button
          className={`cf-icon-btn ${filterOpen ? "active" : ""}`}
          onClick={() => setFilterOpen(true)}
          aria-label="Fee filters"
        >
          <SliderIcon />
          {activeFilterCount ? (
            <span className="cf-badge">{activeFilterCount}</span>
          ) : null}
        </button>
        <button
          className="cf-icon-btn"
          onClick={() => setMoreOpen(true)}
          aria-label="More options"
        >
          ⋯
        </button>
      </div>

      {children.length > 1 ? (
        <div className="cf-child-strip">
          {children.map((child) => (
            <button
              key={child.id}
              className={child.id === childId ? "selected" : ""}
              onClick={() => setChildId(child.id)}
            >
              <span className="cf-mini-avatar">
                {child.photo ? (
                  <img src={child.photo} alt="" />
                ) : (
                  child.name.charAt(0).toUpperCase()
                )}
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
        <section className="cf-child-card">
          <div className="cf-avatar">
            {selectedChild.photo ? (
              <img src={selectedChild.photo} alt={selectedChild.name} />
            ) : (
              selectedChild.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="cf-child-copy">
            <div>
              <h1>{selectedChild.name}</h1>
              <button
                className="cf-sync-dot"
                onClick={() => setStatusOpen(true)}
                aria-label="Data status"
              />
            </div>
            <p>
              {selectedChild.admissionNumber} · {selectedChild.className}
            </p>
          </div>
          <div className="cf-balance-block">
            <small>Outstanding</small>
            <strong>{money(summary.balance, currency.code)}</strong>
          </div>
        </section>
      ) : null}

      <div className="cf-summary-grid">
        <article>
          <span className="blue">Σ</span>
          <div>
            <strong>{money(summary.total, currency.code)}</strong>
            <small>Total billed</small>
          </div>
        </article>
        <article>
          <span className="green">✓</span>
          <div>
            <strong>{money(summary.paid, currency.code)}</strong>
            <small>Paid</small>
          </div>
        </article>
        <article>
          <span className="red">!</span>
          <div>
            <strong>{money(summary.balance, currency.code)}</strong>
            <small>Balance</small>
          </div>
        </article>
        <article>
          <span className="orange">▤</span>
          <div>
            <strong>{summary.invoices}</strong>
            <small>Invoices</small>
          </div>
        </article>
      </div>

      <div className="cf-tabs">
        <button
          className={section === "invoices" ? "active" : ""}
          onClick={() => setSection("invoices")}
        >
          Invoices <span>{invoiceRows.length}</span>
        </button>
        <button
          className={section === "payments" ? "active" : ""}
          onClick={() => setSection("payments")}
        >
          Payments <span>{paymentRows.length}</span>
        </button>
      </div>

      {!resolvedParentId ? (
        <Empty
          title="Parent profile not linked"
          body="The active membership needs a parentId or parentLocalId."
        />
      ) : !children.length ? (
        <Empty
          title="No linked children"
          body="No active student-parent relationship was found for this parent."
        />
      ) : view === "analytics" ? (
        <section className="cf-analytics">
          <article className="cf-analytics-card cf-overview">
            <div>
              <span>Payment progress</span>
              <strong>
                {summary.total
                  ? Math.round((summary.paid / summary.total) * 100)
                  : 0}
                %
              </strong>
              <small>
                {summary.paidInvoices} of {summary.invoices} invoices fully paid
              </small>
            </div>
            <div
              className="cf-donut"
              style={
                {
                  "--value": `${
                    summary.total
                      ? Math.round((summary.paid / summary.total) * 100)
                      : 0
                  }%`,
                } as React.CSSProperties
              }
            >
              <span>
                {summary.total
                  ? Math.round((summary.paid / summary.total) * 100)
                  : 0}
                %
              </span>
            </div>
          </article>
          <article className="cf-analytics-card">
            <div className="cf-analytics-title">
              <strong>Invoice health</strong>
              <small>Current filtered child and period</small>
            </div>
            <div className="cf-metric-list">
              <div>
                <span>Paid</span>
                <strong>{summary.paidInvoices}</strong>
              </div>
              <div>
                <span>Part paid</span>
                <strong>{summary.partPaid}</strong>
              </div>
              <div>
                <span>Overdue</span>
                <strong>{summary.overdue}</strong>
              </div>
              <div>
                <span>Payments</span>
                <strong>{summary.payments}</strong>
              </div>
            </div>
          </article>
        </section>
      ) : section === "invoices" ? (
        invoiceRows.length ? (
          view === "table" ? (
            <div className="cf-table-shell">
              <div className="cf-table-title">
                Invoices ({invoiceRows.length})
              </div>
              <div className="cf-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceRows.map((row) => (
                      <tr
                        key={idOf(row)}
                        onClick={() => setDetail({ kind: "invoice", row })}
                      >
                        <td>
                          <strong>{text(row.invoiceNumber, "Invoice")}</strong>
                          <small>{row.className}</small>
                        </td>
                        <td>
                          <Chip tone={statusTone(row.statusValue)}>
                            {statusLabel(row.statusValue)}
                          </Chip>
                        </td>
                        <td>{money(row.total, row.currencyCode || currency.code)}</td>
                        <td>
                          {money(
                            row.amountPaidValue,
                            row.currencyCode || currency.code,
                          )}
                        </td>
                        <td>
                          {money(
                            row.balanceValue,
                            row.currencyCode || currency.code,
                          )}
                        </td>
                        <td>{dateLabel(row.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="cf-card-grid">
              {invoiceRows.map((row) => (
                <article
                  className="cf-invoice-card"
                  key={idOf(row)}
                  onClick={() => setDetail({ kind: "invoice", row })}
                >
                  <div className="cf-card-top">
                    <div>
                      <strong>{text(row.invoiceNumber, "Invoice")}</strong>
                      <small>
                        {structureMap.get(idOf(row.academicStructureId)) ||
                          "Academic year"}{" "}
                        ·{" "}
                        {periodMap.get(idOf(row.academicPeriodId)) || "Period"}
                      </small>
                    </div>
                    <Chip tone={statusTone(row.statusValue)}>
                      {statusLabel(row.statusValue)}
                    </Chip>
                  </div>
                  <div className="cf-money-row">
                    <div>
                      <small>Total</small>
                      <strong>
                        {money(row.total, row.currencyCode || currency.code)}
                      </strong>
                    </div>
                    <div>
                      <small>Paid</small>
                      <strong>
                        {money(
                          row.amountPaidValue,
                          row.currencyCode || currency.code,
                        )}
                      </strong>
                    </div>
                    <div>
                      <small>Balance</small>
                      <strong className={row.balanceValue ? "danger" : ""}>
                        {money(
                          row.balanceValue,
                          row.currencyCode || currency.code,
                        )}
                      </strong>
                    </div>
                  </div>
                  <div className="cf-card-foot">
                    <span>Issued {dateLabel(row.issueDate)}</span>
                    <span>Due {dateLabel(row.dueDate)}</span>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : (
          <Empty
            title="No invoices found"
            body="Try another child, period or invoice status."
          />
        )
      ) : paymentRows.length ? (
        view === "table" ? (
          <div className="cf-table-shell">
            <div className="cf-table-title">
              Payments ({paymentRows.length})
            </div>
            <div className="cf-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRows.map((row) => (
                    <tr
                      key={idOf(row)}
                      onClick={() => setDetail({ kind: "payment", row })}
                    >
                      <td>
                        <strong>{text(row.receiptNumber, "No receipt")}</strong>
                        <small>{text(row.referenceNumber, "No reference")}</small>
                      </td>
                      <td>
                        <Chip tone={statusTone(row.status)}>
                          {statusLabel(row.status)}
                        </Chip>
                      </td>
                      <td>{statusLabel(row.method)}</td>
                      <td>{money(row.amount, row.currencyCode || currency.code)}</td>
                      <td>{dateLabel(row.paidAt || row.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="cf-card-grid">
            {paymentRows.map((row) => {
              const invoice = invoiceMap.get(idOf(row.invoiceId));
              return (
                <article
                  className="cf-payment-card"
                  key={idOf(row)}
                  onClick={() => setDetail({ kind: "payment", row })}
                >
                  <div className="cf-payment-icon">✓</div>
                  <div className="cf-payment-main">
                    <div>
                      <strong>
                        {money(row.amount, row.currencyCode || currency.code)}
                      </strong>
                      <Chip tone={statusTone(row.status)}>
                        {statusLabel(row.status)}
                      </Chip>
                    </div>
                    <p>
                      {statusLabel(row.method)} ·{" "}
                      {text(invoice?.invoiceNumber, "General payment")}
                    </p>
                    <small>
                      {dateLabel(row.paidAt || row.date)} ·{" "}
                      {text(row.receiptNumber, "No receipt number")}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : (
        <Empty
          title="No payment history"
          body="Successful and pending payments will appear here."
        />
      )}

      {filterOpen ? (
        <div className="cf-sheet-layer" onMouseDown={() => setFilterOpen(false)}>
          <aside
            className="cf-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="cf-sheet-head">
              <div>
                <strong>Fee filters</strong>
                <small>Choose a child, period and status</small>
              </div>
              <button onClick={() => setFilterOpen(false)}>×</button>
            </div>
            <div className="cf-sheet-body">
              <label>
                <span>Child</span>
                <select
                  value={childId}
                  onChange={(event) => setChildId(event.target.value)}
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Academic structure</span>
                <select
                  value={structureId}
                  onChange={(event) => {
                    setStructureId(event.target.value);
                    setPeriodId("");
                  }}
                >
                  <option value="">All structures</option>
                  {structures.map((row) => (
                    <option key={idOf(row)} value={idOf(row)}>
                      {rowName(row)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Academic period</span>
                <select
                  value={periodId}
                  onChange={(event) => setPeriodId(event.target.value)}
                >
                  <option value="">All periods</option>
                  {filteredPeriods.map((row) => (
                    <option key={idOf(row)} value={idOf(row)}>
                      {rowName(row)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Invoice status</span>
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as StatusFilter)
                  }
                >
                  <option value="all">All statuses</option>
                  <option value="issued">Issued</option>
                  <option value="part_paid">Part paid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </div>
            <div className="cf-sheet-actions">
              <button className="secondary" onClick={resetFilters}>
                Reset
              </button>
              <button className="primary" onClick={() => setFilterOpen(false)}>
                Apply
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {moreOpen ? (
        <div className="cf-sheet-layer" onMouseDown={() => setMoreOpen(false)}>
          <aside
            className="cf-sheet cf-short-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="cf-sheet-head">
              <div>
                <strong>View options</strong>
                <small>Change how child fees are displayed</small>
              </div>
              <button onClick={() => setMoreOpen(false)}>×</button>
            </div>
            <div className="cf-view-options">
              {(["cards", "table", "analytics"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  className={view === mode ? "selected" : ""}
                  onClick={() => {
                    setView(mode);
                    setMoreOpen(false);
                  }}
                >
                  <span>
                    {mode === "cards" ? "▤" : mode === "table" ? "▦" : "⌁"}
                  </span>
                  <div>
                    <strong>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </strong>
                    <small>
                      {mode === "cards"
                        ? "Mobile-friendly finance cards"
                        : mode === "table"
                          ? "Compact detailed rows"
                          : "Balances and payment progress"}
                    </small>
                  </div>
                  {view === mode ? <b>✓</b> : null}
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      {detail ? (
        <div className="cf-sheet-layer" onMouseDown={() => setDetail(null)}>
          <aside
            className="cf-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="cf-sheet-head">
              <div>
                <strong>
                  {detail.kind === "invoice"
                    ? text(detail.row.invoiceNumber, "Invoice details")
                    : text(detail.row.receiptNumber, "Payment details")}
                </strong>
                <small>
                  {detail.kind === "invoice"
                    ? "Invoice items and balance"
                    : "Payment and receipt information"}
                </small>
              </div>
              <button onClick={() => setDetail(null)}>×</button>
            </div>

            {detail.kind === "invoice" ? (
              <>
                <div className="cf-detail-summary">
                  <div>
                    <small>Total</small>
                    <strong>
                      {money(
                        detail.row.total,
                        detail.row.currencyCode || currency.code,
                      )}
                    </strong>
                  </div>
                  <div>
                    <small>Paid</small>
                    <strong>
                      {money(
                        detail.row.amountPaidValue,
                        detail.row.currencyCode || currency.code,
                      )}
                    </strong>
                  </div>
                  <div>
                    <small>Balance</small>
                    <strong>
                      {money(
                        detail.row.balanceValue,
                        detail.row.currencyCode || currency.code,
                      )}
                    </strong>
                  </div>
                </div>
                <div className="cf-detail-list">
                  {invoiceItemsFor(idOf(detail.row)).length ? (
                    invoiceItemsFor(idOf(detail.row)).map((item) => (
                      <div key={idOf(item)}>
                        <span>
                          <strong>{text(item.name, "Fee item")}</strong>
                          <small>{text(item.description)}</small>
                        </span>
                        <b>
                          {money(
                            item.amount,
                            item.currencyCode ||
                              detail.row.currencyCode ||
                              currency.code,
                          )}
                        </b>
                      </div>
                    ))
                  ) : (
                    <p className="cf-muted">
                      No separate invoice items were stored for this invoice.
                    </p>
                  )}
                </div>
                <div className="cf-meta-list">
                  <div>
                    <span>Status</span>
                    <Chip tone={statusTone(detail.row.statusValue)}>
                      {statusLabel(detail.row.statusValue)}
                    </Chip>
                  </div>
                  <div>
                    <span>Issued</span>
                    <strong>{dateLabel(detail.row.issueDate)}</strong>
                  </div>
                  <div>
                    <span>Due</span>
                    <strong>{dateLabel(detail.row.dueDate)}</strong>
                  </div>
                  <div>
                    <span>Class</span>
                    <strong>{detail.row.className}</strong>
                  </div>
                </div>
                {detail.row.balanceValue > 0 ? (
                  <div className="cf-sheet-actions single">
                    <button className="primary" onClick={paymentPlaceholder}>
                      Pay outstanding balance
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="cf-meta-list cf-payment-detail">
                <div>
                  <span>Amount</span>
                  <strong>
                    {money(
                      detail.row.amount,
                      detail.row.currencyCode || currency.code,
                    )}
                  </strong>
                </div>
                <div>
                  <span>Status</span>
                  <Chip tone={statusTone(detail.row.status)}>
                    {statusLabel(detail.row.status)}
                  </Chip>
                </div>
                <div>
                  <span>Method</span>
                  <strong>{statusLabel(detail.row.method)}</strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong>{dateLabel(detail.row.paidAt || detail.row.date)}</strong>
                </div>
                <div>
                  <span>Receipt</span>
                  <strong>{text(detail.row.receiptNumber, "Not issued")}</strong>
                </div>
                <div>
                  <span>Reference</span>
                  <strong>
                    {text(
                      detail.row.providerReference ||
                        detail.row.referenceNumber,
                      "Not available",
                    )}
                  </strong>
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : null}

      {statusOpen ? (
        <div className="cf-sheet-layer" onMouseDown={() => setStatusOpen(false)}>
          <aside
            className="cf-sheet cf-short-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="cf-sheet-head">
              <div>
                <strong>Fee data status</strong>
                <small>Offline-first parent view</small>
              </div>
              <button onClick={() => setStatusOpen(false)}>×</button>
            </div>
            <div className="cf-status-panel">
              <span />
              <div>
                <strong>Available on this device</strong>
                <p>
                  Invoices and payment history are read from the latest
                  synchronized local school data.
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {toast ? <div className="cf-toast">{toast}</div> : null}

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .cf-page{--surface:var(--card-background,#fff);--border:var(--border-color,#e5e7eb);--text:var(--text-color,#111827);--muted:var(--muted-color,#6b7280);--soft:var(--soft-background,#f8fafc);min-height:100%;padding:10px 12px 34px;color:var(--text);background:var(--page-background,transparent)}
  .cf-loading,.cf-state{min-height:55vh;display:grid;place-items:center;align-content:center;gap:10px;text-align:center}.cf-spinner{width:28px;height:28px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:cf-spin .8s linear infinite}@keyframes cf-spin{to{transform:rotate(360deg)}}.cf-state-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:color-mix(in srgb,var(--primary) 12%,var(--soft));color:var(--primary);font-weight:900;font-size:20px}.cf-state h2{margin:5px 0 0;font-size:15px}.cf-state p{margin:0;color:var(--muted);font-size:10px}
  .cf-toolbar{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:minmax(0,1fr) 40px 40px;gap:7px;padding:4px 0 10px;background:var(--page-background,var(--surface))}.cf-search{height:40px;display:flex;align-items:center;gap:8px;padding:0 10px;border:1px solid var(--border);border-radius:12px;background:var(--surface)}.cf-search>span{font-size:21px;color:var(--muted)}.cf-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--text);font:inherit;font-size:12px}.cf-search button{border:0;background:transparent;color:var(--muted);font-size:19px}.cf-icon-btn{position:relative;display:grid;place-items:center;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);font-size:21px}.cf-icon-btn.active{border-color:var(--primary);color:var(--primary)}.cf-slider-icon{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8}.cf-badge{position:absolute;right:-4px;top:-5px;min-width:17px;height:17px;padding:0 4px;display:grid;place-items:center;border-radius:10px;background:var(--primary);color:#fff;font-size:9px;font-weight:800}
  .cf-child-strip{display:flex;gap:7px;overflow:auto;padding:1px 0 9px;scrollbar-width:none}.cf-child-strip::-webkit-scrollbar{display:none}.cf-child-strip>button{flex:0 0 auto;display:flex;align-items:center;gap:7px;padding:6px 9px 6px 6px;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);text-align:left}.cf-child-strip>button.selected{border-color:var(--primary);box-shadow:0 0 0 1px color-mix(in srgb,var(--primary) 24%,transparent)}.cf-child-strip strong,.cf-child-strip small{display:block}.cf-child-strip strong{font-size:11px}.cf-child-strip small{font-size:9px;color:var(--muted);margin-top:1px}.cf-mini-avatar{width:28px;height:28px;display:grid;place-items:center;overflow:hidden;border-radius:9px;background:color-mix(in srgb,var(--primary) 13%,var(--soft));color:var(--primary);font-size:12px;font-weight:800}.cf-mini-avatar img,.cf-avatar img{width:100%;height:100%;object-fit:cover}
  .cf-child-card{display:grid;grid-template-columns:52px minmax(0,1fr) auto;align-items:center;gap:10px;padding:12px;border:1px solid var(--border);border-radius:16px;background:var(--surface)}.cf-avatar{width:52px;height:52px;display:grid;place-items:center;overflow:hidden;border-radius:15px;background:color-mix(in srgb,var(--primary) 14%,var(--soft));color:var(--primary);font-size:20px;font-weight:900}.cf-child-copy{min-width:0}.cf-child-copy>div{display:flex;align-items:center;gap:7px}.cf-child-copy h1{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px}.cf-child-copy p{margin:4px 0 0;color:var(--muted);font-size:9px}.cf-sync-dot{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px color-mix(in srgb,#22c55e 15%,transparent)}.cf-balance-block{text-align:right}.cf-balance-block small,.cf-balance-block strong{display:block}.cf-balance-block small{font-size:8px;color:var(--muted)}.cf-balance-block strong{margin-top:3px;font-size:15px;color:#dc2626}
  .cf-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:8px 0}.cf-summary-grid article{display:flex;align-items:center;gap:7px;min-width:0;padding:9px;border:1px solid var(--border);border-radius:13px;background:var(--surface)}.cf-summary-grid article>span{width:27px;height:27px;flex:0 0 auto;display:grid;place-items:center;border-radius:8px;font-weight:900}.cf-summary-grid strong,.cf-summary-grid small{display:block}.cf-summary-grid strong{overflow:hidden;text-overflow:ellipsis;font-size:11px}.cf-summary-grid small{margin-top:2px;color:var(--muted);font-size:8px;white-space:nowrap}.green{background:color-mix(in srgb,#22c55e 13%,var(--surface));color:#15803d}.red{background:color-mix(in srgb,#ef4444 13%,var(--surface));color:#dc2626}.orange{background:color-mix(in srgb,#f59e0b 15%,var(--surface));color:#b45309}.blue{background:color-mix(in srgb,#3b82f6 13%,var(--surface));color:#2563eb}
  .cf-tabs{display:flex;gap:4px;margin:0 0 8px;padding:3px;border:1px solid var(--border);border-radius:12px;background:var(--soft)}.cf-tabs button{flex:1;height:32px;border:0;border-radius:9px;background:transparent;color:var(--muted);font-size:10px;font-weight:800}.cf-tabs button.active{background:var(--surface);color:var(--text);box-shadow:0 1px 4px rgba(15,23,42,.08)}.cf-tabs span{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-left:4px;padding:0 5px;border-radius:9px;background:var(--border);font-size:8px}
  .cf-card-grid{display:grid;gap:7px}.cf-invoice-card,.cf-payment-card{border:1px solid var(--border);border-radius:14px;background:var(--surface);cursor:pointer}.cf-invoice-card{padding:11px}.cf-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.cf-card-top strong,.cf-card-top small{display:block}.cf-card-top strong{font-size:12px}.cf-card-top small{margin-top:3px;color:var(--muted);font-size:8px}.cf-chip{display:inline-flex;align-items:center;justify-content:center;padding:3px 7px;border-radius:999px;font-size:8px;font-weight:800;white-space:nowrap}.cf-chip.green{background:color-mix(in srgb,#22c55e 13%,var(--surface));color:#15803d}.cf-chip.red{background:color-mix(in srgb,#ef4444 13%,var(--surface));color:#dc2626}.cf-chip.orange{background:color-mix(in srgb,#f59e0b 15%,var(--surface));color:#b45309}.cf-chip.blue{background:color-mix(in srgb,#3b82f6 13%,var(--surface));color:#2563eb}.cf-chip.gray{background:var(--soft);color:var(--muted)}.cf-money-row{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px;padding:9px;border-radius:11px;background:var(--soft)}.cf-money-row small,.cf-money-row strong{display:block}.cf-money-row small{font-size:8px;color:var(--muted)}.cf-money-row strong{margin-top:3px;font-size:10px}.cf-money-row strong.danger{color:#dc2626}.cf-card-foot{display:flex;justify-content:space-between;gap:8px;margin-top:9px;color:var(--muted);font-size:8px}.cf-payment-card{display:flex;align-items:center;gap:10px;padding:10px}.cf-payment-icon{width:36px;height:36px;flex:0 0 auto;display:grid;place-items:center;border-radius:11px;background:color-mix(in srgb,#22c55e 13%,var(--surface));color:#15803d;font-weight:900}.cf-payment-main{flex:1;min-width:0}.cf-payment-main>div{display:flex;justify-content:space-between;align-items:center;gap:8px}.cf-payment-main>div>strong{font-size:12px}.cf-payment-main p,.cf-payment-main small{display:block;margin:0;color:var(--muted);font-size:8px}.cf-payment-main p{margin-top:4px}.cf-payment-main small{margin-top:3px}
  .cf-table-shell{overflow:hidden;border:1px solid var(--border);border-radius:14px;background:var(--surface)}.cf-table-title{padding:10px 12px;border-bottom:1px solid var(--border);font-size:11px;font-weight:800}.cf-table-scroll{overflow:auto}.cf-table-shell table{width:100%;min-width:690px;border-collapse:collapse}.cf-table-shell th,.cf-table-shell td{padding:9px 11px;border-bottom:1px solid var(--border);text-align:left;font-size:9px}.cf-table-shell th{position:sticky;top:0;background:var(--soft);color:var(--muted);font-size:8px;text-transform:uppercase;letter-spacing:.04em}.cf-table-shell tr{cursor:pointer}.cf-table-shell tbody tr:last-child td{border-bottom:0}.cf-table-shell td strong,.cf-table-shell td small{display:block}.cf-table-shell td small{margin-top:2px;color:var(--muted);font-size:8px}
  .cf-analytics{display:grid;gap:8px}.cf-analytics-card{padding:12px;border:1px solid var(--border);border-radius:15px;background:var(--surface)}.cf-overview{display:flex;align-items:center;justify-content:space-between}.cf-overview>div:first-child span,.cf-overview>div:first-child strong,.cf-overview>div:first-child small{display:block}.cf-overview>div:first-child span{font-size:9px;color:var(--muted)}.cf-overview>div:first-child strong{margin-top:2px;font-size:25px}.cf-overview>div:first-child small{font-size:8px;color:var(--muted)}.cf-donut{position:relative;width:76px;height:76px;display:grid;place-items:center;border-radius:50%;background:conic-gradient(var(--primary) var(--value),var(--border) 0)}.cf-donut:after{content:"";position:absolute;inset:8px;border-radius:50%;background:var(--surface)}.cf-donut span{position:relative;z-index:1;font-size:11px;font-weight:900}.cf-analytics-title strong,.cf-analytics-title small{display:block}.cf-analytics-title strong{font-size:12px}.cf-analytics-title small{margin-top:2px;color:var(--muted);font-size:8px}.cf-metric-list{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px}.cf-metric-list div{padding:10px;border:1px solid var(--border);border-radius:11px;background:var(--soft)}.cf-metric-list span,.cf-metric-list strong{display:block}.cf-metric-list span{font-size:8px;color:var(--muted)}.cf-metric-list strong{margin-top:3px;font-size:16px}
  .cf-empty{display:grid;justify-items:center;text-align:center;padding:44px 18px;border:1px dashed var(--border);border-radius:16px;background:var(--surface)}.cf-empty>div{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:color-mix(in srgb,var(--primary) 12%,var(--soft));color:var(--primary);font-size:18px;font-weight:900}.cf-empty h3{margin:10px 0 3px;font-size:14px}.cf-empty p{max-width:380px;margin:0;color:var(--muted);font-size:9px;line-height:1.55}
  .cf-sheet-layer{position:fixed;inset:0;z-index:1000;display:flex;justify-content:flex-end;background:rgba(15,23,42,.38);backdrop-filter:blur(2px)}.cf-sheet{width:min(430px,94vw);height:100%;display:flex;flex-direction:column;background:var(--surface);box-shadow:-16px 0 40px rgba(0,0,0,.16)}.cf-short-sheet{height:auto;max-height:78vh;align-self:flex-end;border-radius:20px 0 0 0}.cf-sheet-head{display:flex;align-items:center;justify-content:space-between;padding:15px;border-bottom:1px solid var(--border)}.cf-sheet-head strong,.cf-sheet-head small{display:block}.cf-sheet-head strong{font-size:13px}.cf-sheet-head small{margin-top:2px;color:var(--muted);font-size:9px}.cf-sheet-head button{width:32px;height:32px;border:1px solid var(--border);border-radius:10px;background:var(--soft);color:var(--text);font-size:19px}.cf-sheet-body{flex:1;overflow:auto;display:grid;align-content:start;gap:12px;padding:15px}.cf-sheet-body label>span{display:block;margin-bottom:5px;color:var(--muted);font-size:9px;font-weight:700}.cf-sheet-body select{width:100%;height:40px;padding:0 10px;border:1px solid var(--border);border-radius:11px;outline:0;background:var(--surface);color:var(--text);font:inherit;font-size:10px}.cf-sheet-body select:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 12%,transparent)}.cf-sheet-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 15px;border-top:1px solid var(--border)}.cf-sheet-actions.single{grid-template-columns:1fr;margin-top:auto}.cf-sheet-actions button{height:39px;border-radius:11px;font-size:10px;font-weight:800}.cf-sheet-actions .primary{border:1px solid var(--primary);background:var(--primary);color:#fff}.cf-sheet-actions .secondary{border:1px solid var(--border);background:var(--surface);color:var(--text)}
  .cf-view-options{display:grid;gap:7px;padding:12px}.cf-view-options button{display:grid;grid-template-columns:34px minmax(0,1fr) 20px;align-items:center;gap:9px;padding:10px;border:1px solid var(--border);border-radius:12px;background:var(--surface);color:var(--text);text-align:left}.cf-view-options button.selected{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 6%,var(--surface))}.cf-view-options button>span{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:var(--soft);font-size:17px}.cf-view-options strong,.cf-view-options small{display:block}.cf-view-options strong{font-size:11px}.cf-view-options small{margin-top:2px;color:var(--muted);font-size:8px}.cf-view-options b{color:var(--primary)}
  .cf-detail-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:15px}.cf-detail-summary div{padding:10px;border:1px solid var(--border);border-radius:11px;background:var(--soft)}.cf-detail-summary small,.cf-detail-summary strong{display:block}.cf-detail-summary small{font-size:8px;color:var(--muted)}.cf-detail-summary strong{margin-top:3px;font-size:11px}.cf-detail-list{display:grid;gap:0;padding:0 15px}.cf-detail-list>div{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}.cf-detail-list strong,.cf-detail-list small{display:block}.cf-detail-list strong{font-size:10px}.cf-detail-list small{margin-top:2px;color:var(--muted);font-size:8px}.cf-detail-list b{font-size:10px}.cf-meta-list{display:grid;padding:10px 15px}.cf-meta-list>div{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}.cf-meta-list>div:last-child{border-bottom:0}.cf-meta-list span{font-size:9px;color:var(--muted)}.cf-meta-list strong{font-size:10px;text-align:right}.cf-payment-detail{padding-top:15px}.cf-muted{color:var(--muted);font-size:9px}.cf-status-panel{display:flex;gap:11px;padding:16px}.cf-status-panel>span{width:14px;height:14px;flex:0 0 auto;margin-top:2px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 5px color-mix(in srgb,#22c55e 14%,transparent)}.cf-status-panel strong{font-size:11px}.cf-status-panel p{margin:5px 0 0;color:var(--muted);font-size:9px;line-height:1.55}.cf-toast{position:fixed;left:50%;bottom:20px;z-index:1200;transform:translateX(-50%);max-width:min(420px,90vw);padding:10px 13px;border-radius:11px;background:#111827;color:#fff;font-size:10px;box-shadow:0 12px 30px rgba(0,0,0,.22)}
  @media(max-width:700px){.cf-page{padding-inline:9px}.cf-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cf-child-card{grid-template-columns:48px minmax(0,1fr)}.cf-avatar{width:48px;height:48px}.cf-balance-block{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--border);text-align:left}.cf-metric-list{grid-template-columns:repeat(2,1fr)}.cf-short-sheet{width:100%;border-radius:20px 20px 0 0}.cf-sheet-layer{align-items:flex-end}}
  @media(min-width:900px){.cf-page{max-width:1120px;margin:0 auto;padding-top:14px}.cf-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cf-analytics{grid-template-columns:1fr 1fr}.cf-short-sheet{height:100%;max-height:none;align-self:stretch;border-radius:0}}
`;