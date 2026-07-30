"use client";

/**
 * app/branch-admin/modules/IdentityOverview.tsx
 * --------------------------------------------------------------------------
 * ELEEVEON IDENTITY OVERVIEW — PHASE 10 ROUTE INTEGRATION
 *
 * Route responsibilities:
 * - resolve the active account, school, branch and membership;
 * - enforce identity permissions;
 * - read branch-scoped Dexie identity records;
 * - provide loading, filtering, navigation and refresh behavior.
 *
 * Visual standard:
 * - compact Eleeveon search toolbar;
 * - no hero or permanent dashboard summary strip;
 * - filters live in the slider sheet;
 * - cards, table and analytics live under More;
 * - compact operational rows with direct module navigation.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAccount } from "../../context/account-context";
import { useSettings } from "../../context/settings-context";
import { useActiveBranch } from "../../context/active-branch-context";
import { useActiveMembership } from "../../context/active-membership-context";

import {
  db,
  type IdentityAccessPoint,
  type IdentityActivityEvent,
  type IdentityCredential,
  type IdentityDevice,
  type StudentIdentityCard,
} from "../../lib/db/db";

import { useDataRevision } from "../../hooks/useDataRevision";
import { useBackgroundLoader } from "../../hooks/useBackgroundLoader";
import { PermissionGate } from "../../components/shared/PermissionGate";

type ViewMode = "cards" | "table" | "analytics";
type ToastTone = "success" | "error" | "info";
type StatusFilter =
  | "all"
  | "healthy"
  | "attention"
  | "inactive";
type ActivityFilter =
  | "all"
  | "accepted"
  | "pending"
  | "denied"
  | "failed";

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

type RouteProps = {
  navigate: (key: string) => void;
};

type ModuleKey =
  | "credentials"
  | "devices"
  | "accessPoints"
  | "activity"
  | "cards";

type OverviewModule = {
  key: ModuleKey;
  title: string;
  description: string;
  icon: string;
  total: number;
  active: number;
  attention: number;
  inactive: number;
  route: string;
  status: "healthy" | "attention" | "inactive";
  detail: string;
};

const OPEN_WORKSPACE_KEY = "eleeveon_open_workspace";

const MODULE_ROUTES: Record<ModuleKey, string> = {
  credentials: "identityCredentials",
  devices: "identityDevices",
  accessPoints: "identityAccessPoints",
  activity: "identityActivity",
  cards: "identityCards",
};

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

function safeLower(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isActive(row: TenantRow) {
  const status = safeLower(row.status);

  return (
    !row.isDeleted &&
    row.active !== false &&
    ![
      "inactive",
      "disabled",
      "deleted",
      "archived",
      "revoked",
      "expired",
    ].includes(status)
  );
}

function formatDateTime(value?: number | string | null) {
  if (!value) return "Not recorded";

  const parsed =
    typeof value === "number" ? value : new Date(value).getTime();

  if (!Number.isFinite(parsed)) return "Not recorded";

  try {
    return new Intl.DateTimeFormat("en-GH", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(parsed));
  } catch {
    return "Not recorded";
  }
}

function relativeTime(value?: number | string | null) {
  if (!value) return "Never";

  const parsed =
    typeof value === "number" ? value : new Date(value).getTime();

  if (!Number.isFinite(parsed)) return "Never";

  const difference = Date.now() - parsed;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference < minute) return "Just now";
  if (difference < hour)
    return `${Math.floor(difference / minute)}m ago`;
  if (difference < day)
    return `${Math.floor(difference / hour)}h ago`;
  if (difference < 7 * day)
    return `${Math.floor(difference / day)}d ago`;

  return formatDateTime(parsed);
}

function humanize(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "Not set";

  return text
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function moduleStatus(
  total: number,
  attention: number,
  inactive: number,
): OverviewModule["status"] {
  if (!total || inactive === total) return "inactive";
  if (attention > 0) return "attention";
  return "healthy";
}

export default function IdentityOverview({ navigate }: RouteProps) {
  const router = useRouter();
  const revision = useDataRevision();
  const { loading, setLoading } = useBackgroundLoader();

  const {
    accountId,
    authenticated,
    loading: accountLoading,
  } = useAccount();

  const {
    settings,
    loading: settingsLoading,
  } = useSettings();

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
    openWorkspace?.membership ||
    activeMembership ||
    storedMembership ||
    {}
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

  const primary =
    settings?.primaryColor || "var(--primary-color, #2563eb)";

  const permissionValues = useMemo(() => {
    const raw = membership.permissions;

    if (Array.isArray(raw)) return raw.map(String);

    if (raw && typeof raw === "object") {
      return Object.entries(raw)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key);
    }

    return [];
  }, [membership.permissions]);

  const role = safeLower(membership.role);

  const roleCanView = [
    "owner",
    "super_admin",
    "admin",
    "branch_admin",
    "teacher",
    "accountant",
  ].includes(role);

  const canView =
    roleCanView ||
    permissionValues.some((permission) =>
      [
        "identity.view",
        "identity.read",
        "identity.manage",
        "identity_overview.view",
      ].includes(permission),
    );

  const [credentials, setCredentials] = useState<
    IdentityCredential[]
  >([]);
  const [devices, setDevices] = useState<IdentityDevice[]>([]);
  const [accessPoints, setAccessPoints] = useState<
    IdentityAccessPoint[]
  >([]);
  const [activity, setActivity] = useState<
    IdentityActivityEvent[]
  >([]);
  const [cards, setCards] = useState<StudentIdentityCard[]>([]);

  const [viewMode, setViewMode] =
    useState<ViewMode>("cards");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [activityFilter, setActivityFilter] =
    useState<ActivityFilter>("all");
  const [recentHours, setRecentHours] = useState("24");

  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [toast, setToast] = useState<{
    tone: ToastTone;
    message: string;
  } | null>(null);

  const sameTenant = (row: TenantRow) =>
    (!row.accountId || row.accountId === accountId) &&
    (!row.schoolId || sameId(row.schoolId, schoolId)) &&
    (!row.branchId || sameId(row.branchId, branchId)) &&
    !row.isDeleted;

  const notify = (tone: ToastTone, message: string) => {
    setToast({ tone, message });

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setToast((current) =>
          current?.message === message ? null : current,
        );
      }, 4200);
    }
  };

  const clearData = () => {
    setCredentials([]);
    setDevices([]);
    setAccessPoints([]);
    setActivity([]);
    setCards([]);
  };

  const load = async () => {
    if (
      !authenticated ||
      !accountId ||
      !schoolId ||
      !branchId ||
      !canView
    ) {
      clearData();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [
        credentialRows,
        deviceRows,
        accessPointRows,
        activityRows,
        cardRows,
      ] = await Promise.all([
        tableSafe("identityCredentials")?.toArray?.() || [],
        tableSafe("identityDevices")?.toArray?.() || [],
        tableSafe("identityAccessPoints")?.toArray?.() || [],
        tableSafe("identityActivityEvents")?.toArray?.() || [],
        tableSafe("studentIdentityCards")?.toArray?.() || [],
      ]);

      setCredentials(
        (credentialRows as IdentityCredential[]).filter(
          (row: any) => sameTenant(row),
        ),
      );

      setDevices(
        (deviceRows as IdentityDevice[]).filter((row: any) =>
          sameTenant(row),
        ),
      );

      setAccessPoints(
        (accessPointRows as IdentityAccessPoint[]).filter(
          (row: any) => sameTenant(row),
        ),
      );

      setActivity(
        (activityRows as IdentityActivityEvent[])
          .filter((row: any) => sameTenant(row))
          .sort(
            (a: any, b: any) =>
              Number(b.occurredAt || 0) -
              Number(a.occurredAt || 0),
          ),
      );

      setCards(
        (cardRows as StudentIdentityCard[]).filter(
          (row: any) => sameTenant(row),
        ),
      );
    } catch (error) {
      console.error("Failed to load identity overview:", error);
      clearData();
      notify("error", "Failed to load identity overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountLoading || contextLoading) return;

    if (!authenticated || !accountId) {
      router.replace("/login");
    } else if (!schoolId || !branchId) {
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

  const recentCutoff = useMemo(() => {
    const hours = Number(recentHours);
    if (!Number.isFinite(hours) || hours <= 0) return 0;

    return Date.now() - hours * 60 * 60 * 1000;
  }, [recentHours]);

  const recentActivity = useMemo(
    () =>
      activity.filter(
        (row: any) =>
          !recentCutoff ||
          Number(row.occurredAt || 0) >= recentCutoff,
      ),
    [activity, recentCutoff],
  );

  const deviceStats = useMemo(() => {
    const online = devices.filter(
      (row: any) =>
        isActive(row) && safeLower(row.status) === "online",
    ).length;

    const maintenance = devices.filter(
      (row: any) =>
        safeLower(row.status) === "maintenance",
    ).length;

    const disabled = devices.filter(
      (row: any) =>
        row.active === false ||
        ["disabled", "offline"].includes(safeLower(row.status)),
    ).length;

    return {
      online,
      maintenance,
      disabled,
    };
  }, [devices]);

  const credentialStats = useMemo(() => {
    const active = credentials.filter(
      (row: any) =>
        row.active !== false &&
        safeLower(row.status) === "active",
    ).length;

    const attention = credentials.filter((row: any) =>
      ["pending", "suspended"].includes(safeLower(row.status)),
    ).length;

    const inactive = credentials.filter(
      (row: any) =>
        row.active === false ||
        ["expired", "revoked", "replaced"].includes(
          safeLower(row.status),
        ),
    ).length;

    return {
      active,
      attention,
      inactive,
    };
  }, [credentials]);

  const accessPointStats = useMemo(() => {
    const active = accessPoints.filter((row: any) =>
      isActive(row),
    ).length;

    const withoutLocation = accessPoints.filter(
      (row: any) =>
        isActive(row) &&
        (!Number.isFinite(Number(row.latitude)) ||
          !Number.isFinite(Number(row.longitude))),
    ).length;

    const inactive = accessPoints.filter(
      (row: any) => !isActive(row),
    ).length;

    return {
      active,
      withoutLocation,
      inactive,
    };
  }, [accessPoints]);

  const activityStats = useMemo(() => {
    const accepted = recentActivity.filter(
      (row: any) => safeLower(row.outcome) === "accepted",
    ).length;

    const attention = recentActivity.filter((row: any) =>
      ["pending", "denied", "failed"].includes(
        safeLower(row.outcome),
      ),
    ).length;

    const failed = recentActivity.filter((row: any) =>
      ["denied", "failed"].includes(safeLower(row.outcome)),
    ).length;

    return {
      accepted,
      attention,
      failed,
    };
  }, [recentActivity]);

  const cardStats = useMemo(() => {
    const active = cards.filter(
      (row: any) =>
        row.active !== false &&
        safeLower(row.status) === "active",
    ).length;

    const attention = cards.filter((row: any) =>
      ["draft", "issued"].includes(safeLower(row.status)),
    ).length;

    const inactive = cards.filter(
      (row: any) =>
        row.active === false ||
        ["expired", "revoked", "replaced"].includes(
          safeLower(row.status),
        ),
    ).length;

    return {
      active,
      attention,
      inactive,
    };
  }, [cards]);

  const modules = useMemo<OverviewModule[]>(() => {
    const credentialStatus = moduleStatus(
      credentials.length,
      credentialStats.attention,
      credentialStats.inactive,
    );

    const deviceAttention =
      deviceStats.maintenance + deviceStats.disabled;

    const accessPointAttention =
      accessPointStats.withoutLocation;

    const cardStatus = moduleStatus(
      cards.length,
      cardStats.attention,
      cardStats.inactive,
    );

    return [
      {
        key: "credentials",
        title: "Credentials",
        description:
          "QR, card, biometric and mobile identity credentials.",
        icon: "⌁",
        total: credentials.length,
        active: credentialStats.active,
        attention: credentialStats.attention,
        inactive: credentialStats.inactive,
        route: MODULE_ROUTES.credentials,
        status: credentialStatus,
        detail: `${credentialStats.active} active · ${credentialStats.attention} need attention`,
      },
      {
        key: "devices",
        title: "Devices",
        description:
          "Scanners, kiosks, phones, readers and terminals.",
        icon: "▣",
        total: devices.length,
        active: deviceStats.online,
        attention: deviceStats.maintenance,
        inactive: deviceStats.disabled,
        route: MODULE_ROUTES.devices,
        status: moduleStatus(
          devices.length,
          deviceAttention,
          deviceStats.disabled,
        ),
        detail: `${deviceStats.online} online · ${deviceAttention} unavailable`,
      },
      {
        key: "accessPoints",
        title: "Access Points",
        description:
          "Gates, classrooms, buses and verification locations.",
        icon: "⌖",
        total: accessPoints.length,
        active: accessPointStats.active,
        attention: accessPointStats.withoutLocation,
        inactive: accessPointStats.inactive,
        route: MODULE_ROUTES.accessPoints,
        status: moduleStatus(
          accessPoints.length,
          accessPointAttention,
          accessPointStats.inactive,
        ),
        detail: `${accessPointStats.active} active · ${accessPointStats.withoutLocation} without location`,
      },
      {
        key: "activity",
        title: "Identity Activity",
        description:
          "Verification, entry, pickup and movement events.",
        icon: "↯",
        total: recentActivity.length,
        active: activityStats.accepted,
        attention: activityStats.attention,
        inactive: activityStats.failed,
        route: MODULE_ROUTES.activity,
        status: moduleStatus(
          recentActivity.length,
          activityStats.attention,
          activityStats.failed,
        ),
        detail: `${activityStats.accepted} accepted · ${activityStats.attention} need review`,
      },
      {
        key: "cards",
        title: "Student Cards",
        description:
          "Issued, printed and active student identity cards.",
        icon: "▤",
        total: cards.length,
        active: cardStats.active,
        attention: cardStats.attention,
        inactive: cardStats.inactive,
        route: MODULE_ROUTES.cards,
        status: cardStatus,
        detail: `${cardStats.active} active · ${cardStats.attention} pending`,
      },
    ];
  }, [
    credentials.length,
    devices.length,
    accessPoints.length,
    recentActivity.length,
    cards.length,
    credentialStats,
    deviceStats,
    accessPointStats,
    activityStats,
    cardStats,
  ]);

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return modules.filter((module) => {
      if (
        statusFilter !== "all" &&
        module.status !== statusFilter
      ) {
        return false;
      }

      if (!query) return true;

      return `${module.title} ${module.description} ${module.detail}`
        .toLowerCase()
        .includes(query);
    });
  }, [modules, search, statusFilter]);

  const filteredActivity = useMemo(() => {
    const query = search.trim().toLowerCase();

    return recentActivity
      .filter((row: any) => {
        if (
          activityFilter !== "all" &&
          safeLower(row.outcome) !== activityFilter
        ) {
          return false;
        }

        if (!query) return true;

        return `${row.subjectType || ""} ${
          row.subjectId || ""
        } ${row.purpose || ""} ${row.action || ""} ${
          row.outcome || ""
        } ${row.verificationStatus || ""}`
          .toLowerCase()
          .includes(query);
      })
      .slice(0, 20);
  }, [recentActivity, search, activityFilter]);

  const overall = useMemo(() => {
    const attention = modules.reduce(
      (sum, module) => sum + module.attention,
      0,
    );

    const inactive = modules.reduce(
      (sum, module) => sum + module.inactive,
      0,
    );

    const healthyModules = modules.filter(
      (module) => module.status === "healthy",
    ).length;

    return {
      attention,
      inactive,
      healthyModules,
      totalModules: modules.length,
      totalRecords:
        credentials.length +
        devices.length +
        accessPoints.length +
        cards.length +
        recentActivity.length,
    };
  }, [
    modules,
    credentials.length,
    devices.length,
    accessPoints.length,
    cards.length,
    recentActivity.length,
  ]);

  const activeFilterCount = [
    statusFilter !== "all" ? statusFilter : "",
    activityFilter !== "all" ? activityFilter : "",
    recentHours !== "24" ? recentHours : "",
  ].filter(Boolean).length;

  if (
    accountLoading ||
    contextLoading ||
    settingsLoading ||
    loading
  ) {
    return (
      <RouteState
        primary={primary}
        title="Opening Identity Overview..."
        text="Checking the active branch, credentials, devices, access points and recent activity."
      />
    );
  }

  if (!authenticated || !accountId) {
    return (
      <RouteState
        primary={primary}
        title="Redirecting to login..."
        text="You must sign in before opening identity operations."
      />
    );
  }

  if (!schoolId || !branchId) {
    return (
      <RouteState
        primary={primary}
        title="No branch workspace selected"
        text="Select the correct branch workspace and reopen Identity Overview."
        action={
          <button
            type="button"
            className="ba-state-button"
            onClick={() => router.push("/account")}
          >
            Go to Account Setup
          </button>
        }
      />
    );
  }

  return (
    <PermissionGate
      allowed={canView}
      fallback={
        <RouteState
          primary={primary}
          title="Identity access restricted"
          text="Your active membership does not allow you to view identity operations."
        />
      }
    >
      <main
        className="ba-page"
        style={
          {
            "--ba-primary": primary,
          } as React.CSSProperties
        }
      >
        <style>{css}</style>

        {toast ? (
          <section className={`ba-toast ${toast.tone}`}>
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
            >
              ×
            </button>
          </section>
        ) : null}

        <section className="ba-search-card">
          <button
            type="button"
            className={`status-dot-mini ${
              overall.attention > 0
                ? "orange"
                : overall.totalRecords
                  ? "green"
                  : "gray"
            }`}
            aria-label="Open identity status"
            onClick={() => setStatusOpen(true)}
          />

          <label className="ba-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search identity operations..."
            />
          </label>

          <button
            type="button"
            className="ba-scan-button"
            onClick={() => navigate(MODULE_ROUTES.activity)}
          >
            Scan
          </button>

          <button
            type="button"
            className={`ba-filter-button ${
              activeFilterCount ? "active" : ""
            }`}
            onClick={() => setFilterOpen(true)}
            aria-label="Open identity filters"
          >
            <SliderIcon />
            {activeFilterCount ? (
              <b>{activeFilterCount}</b>
            ) : null}
          </button>

          <button
            type="button"
            className="ba-icon-button"
            onClick={() => setMoreOpen(true)}
            aria-label="Open more identity actions"
          >
            ⋯
          </button>
        </section>

        {activeFilterCount ? (
          <section className="ba-filter-chips">
            {statusFilter !== "all" ? (
              <span>{humanize(statusFilter)}</span>
            ) : null}
            {activityFilter !== "all" ? (
              <span>
                Activity: {humanize(activityFilter)}
              </span>
            ) : null}
            <span>Last {recentHours} hours</span>
          </section>
        ) : null}

        {viewMode === "analytics" ? (
          <AnalyticsView
            modules={modules}
            recentActivity={recentActivity}
          />
        ) : viewMode === "table" ? (
          <ModuleTable
            modules={filteredModules}
            onOpen={(route) => navigate(route)}
          />
        ) : (
          <>
            <section className="ba-list">
              {filteredModules.map((module) => (
                <button
                  type="button"
                  className="identity-module-row"
                  key={module.key}
                  onClick={() => navigate(module.route)}
                >
                  <span className="identity-icon">
                    {module.icon}
                  </span>

                  <span className="identity-main">
                    <strong>{module.title}</strong>
                    <small>{module.description}</small>
                    <em>{module.detail}</em>
                  </span>

                  <span className="identity-side">
                    <strong>{module.total}</strong>
                    <span
                      className={`status-dot-mini ${module.status}`}
                    />
                    <b>›</b>
                  </span>
                </button>
              ))}
            </section>

            <section className="recent-section">
              <div className="section-label">
                <span>Recent Activity</span>
                <button
                  type="button"
                  onClick={() => navigate(MODULE_ROUTES.activity)}
                >
                  View all
                </button>
              </div>

              <div className="activity-list">
                {filteredActivity.slice(0, 8).map((row: any) => (
                  <button
                    type="button"
                    className="activity-row"
                    key={idOf(row.id)}
                    onClick={() => navigate(MODULE_ROUTES.activity)}
                  >
                    <span
                      className={`activity-outcome ${safeLower(
                        row.outcome,
                      )}`}
                    >
                      {safeLower(row.outcome) === "accepted"
                        ? "✓"
                        : safeLower(row.outcome) === "pending"
                          ? "…"
                          : "!"}
                    </span>

                    <span className="activity-main">
                      <strong>
                        {humanize(row.purpose)}
                      </strong>
                      <small>
                        {humanize(row.subjectType)} ·{" "}
                        {idOf(row.subjectId) || "Unknown subject"}
                      </small>
                      <em>
                        {humanize(row.verificationStatus)} ·{" "}
                        {humanize(row.outcome)}
                      </em>
                    </span>

                    <time>
                      {relativeTime(row.occurredAt)}
                    </time>
                  </button>
                ))}

                {!filteredActivity.length ? (
                  <section className="mini-empty">
                    <strong>No recent activity</strong>
                    <span>
                      Identity verification and movement events
                      will appear here.
                    </span>
                  </section>
                ) : null}
              </div>
            </section>
          </>
        )}

        {!filteredModules.length ? (
          <section className="ba-empty">
            <div className="ba-empty-icon">◫</div>
            <h3>No identity modules found</h3>
            <p>
              No module matches the current search and
              filters.
            </p>
          </section>
        ) : null}

        {filterOpen ? (
          <FilterSheet
            statusFilter={statusFilter}
            activityFilter={activityFilter}
            recentHours={recentHours}
            onStatusFilter={setStatusFilter}
            onActivityFilter={setActivityFilter}
            onRecentHours={setRecentHours}
            onClear={() => {
              setStatusFilter("all");
              setActivityFilter("all");
              setRecentHours("24");
            }}
            onClose={() => setFilterOpen(false)}
          />
        ) : null}

        {moreOpen ? (
          <MoreSheet
            viewMode={viewMode}
            onViewMode={(value) => {
              setViewMode(value);
              setMoreOpen(false);
            }}
            onNavigate={(route) => {
              setMoreOpen(false);
              navigate(route);
            }}
            onRefresh={async () => {
              setMoreOpen(false);
              await load();
            }}
            onClose={() => setMoreOpen(false)}
          />
        ) : null}

        {statusOpen ? (
          <StatusSheet
            overall={overall}
            modules={modules}
            onClose={() => setStatusOpen(false)}
          />
        ) : null}
      </main>
    </PermissionGate>
  );
}

function SliderIcon() {
  return (
    <svg
      className="ba-slider-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7h9" />
      <path d="M17 7h3" />
      <circle cx="15" cy="7" r="2" />
      <path d="M4 17h3" />
      <path d="M11 17h9" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}

function AnalyticsView({
  modules,
  recentActivity,
}: {
  modules: OverviewModule[];
  recentActivity: IdentityActivityEvent[];
}) {
  const accepted = recentActivity.filter(
    (row: any) => safeLower(row.outcome) === "accepted",
  ).length;

  const pending = recentActivity.filter(
    (row: any) => safeLower(row.outcome) === "pending",
  ).length;

  const denied = recentActivity.filter((row: any) =>
    ["denied", "failed"].includes(safeLower(row.outcome)),
  ).length;

  const verificationRate = recentActivity.length
    ? Math.round((accepted / recentActivity.length) * 100)
    : 0;

  return (
    <>
      <section className="ba-analysis-grid">
        <Analysis
          title="Identity Records"
          value={modules.reduce(
            (sum, module) => sum + module.total,
            0,
          )}
        />
        <Analysis
          title="Healthy Modules"
          value={modules.filter(
            (module) => module.status === "healthy",
          ).length}
        />
        <Analysis
          title="Need Attention"
          value={modules.reduce(
            (sum, module) => sum + module.attention,
            0,
          )}
        />
        <Analysis
          title="Verification Rate"
          value={`${verificationRate}%`}
        />
        <Analysis title="Accepted Events" value={accepted} />
        <Analysis
          title="Pending / Denied"
          value={pending + denied}
        />
      </section>

      <section className="analytics-bars">
        {modules.map((module) => {
          const activePercent = module.total
            ? Math.round((module.active / module.total) * 100)
            : 0;

          return (
            <article key={module.key}>
              <header>
                <span>{module.title}</span>
                <strong>
                  {module.active}/{module.total}
                </strong>
              </header>
              <div>
                <i
                  style={{
                    width: `${activePercent}%`,
                  }}
                />
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}

function Analysis({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) {
  return (
    <article className="ba-analysis">
      <span>{title}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ModuleTable({
  modules,
  onOpen,
}: {
  modules: OverviewModule[];
  onOpen: (route: string) => void;
}) {
  return (
    <section className="ba-table-card">
      <div className="ba-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Identity Modules ({modules.length})</th>
              <th>Total</th>
              <th>Active</th>
              <th>Attention</th>
              <th>Inactive</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {modules.map((module) => (
              <tr key={module.key}>
                <td>
                  <div className="table-module">
                    <span>{module.icon}</span>
                    <div>
                      <strong>{module.title}</strong>
                      <small>{module.description}</small>
                    </div>
                  </div>
                </td>
                <td>{module.total}</td>
                <td>{module.active}</td>
                <td>{module.attention}</td>
                <td>{module.inactive}</td>
                <td>
                  <span className={`table-status ${module.status}`}>
                    {humanize(module.status)}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="table-open"
                    onClick={() => onOpen(module.route)}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilterSheet(props: {
  statusFilter: StatusFilter;
  activityFilter: ActivityFilter;
  recentHours: string;
  onStatusFilter: (value: StatusFilter) => void;
  onActivityFilter: (value: ActivityFilter) => void;
  onRecentHours: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      title="Identity Filters"
      text="Control operational health and recent activity."
      onClose={props.onClose}
    >
      <div className="ba-form">
        <Field label="Module Health">
          <select
            value={props.statusFilter}
            onChange={(event) =>
              props.onStatusFilter(
                event.target.value as StatusFilter,
              )
            }
          >
            <option value="all">All modules</option>
            <option value="healthy">Healthy</option>
            <option value="attention">Needs attention</option>
            <option value="inactive">Inactive or empty</option>
          </select>
        </Field>

        <Field label="Activity Outcome">
          <select
            value={props.activityFilter}
            onChange={(event) =>
              props.onActivityFilter(
                event.target.value as ActivityFilter,
              )
            }
          >
            <option value="all">All outcomes</option>
            <option value="accepted">Accepted</option>
            <option value="pending">Pending</option>
            <option value="denied">Denied</option>
            <option value="failed">Failed</option>
          </select>
        </Field>

        <Field label="Recent Activity">
          <select
            value={props.recentHours}
            onChange={(event) =>
              props.onRecentHours(event.target.value)
            }
          >
            <option value="1">Last hour</option>
            <option value="6">Last 6 hours</option>
            <option value="24">Last 24 hours</option>
            <option value="72">Last 3 days</option>
            <option value="168">Last 7 days</option>
            <option value="0">All activity</option>
          </select>
        </Field>
      </div>

      <div className="ba-sheet-footer">
        <button type="button" onClick={props.onClear}>
          Clear
        </button>
        <button
          type="button"
          className="primary"
          onClick={props.onClose}
        >
          Apply
        </button>
      </div>
    </Sheet>
  );
}

function MoreSheet(props: {
  viewMode: ViewMode;
  onViewMode: (value: ViewMode) => void;
  onNavigate: (route: string) => void;
  onRefresh: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      title="More"
      text="Change view or open an identity operation."
      onClose={props.onClose}
    >
      <section className="more-section">
        <span>View</span>

        <div className="more-grid">
          {(
            [
              ["cards", "Cards"],
              ["table", "Table"],
              ["analytics", "Analytics"],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={
                props.viewMode === value ? "active" : ""
              }
              onClick={() => props.onViewMode(value)}
            >
              <strong>{label}</strong>
              <small>
                {value === "cards"
                  ? "Compact operation rows"
                  : value === "table"
                    ? "Dense module comparison"
                    : "Identity health summary"}
              </small>
            </button>
          ))}
        </div>
      </section>

      <section className="more-section">
        <span>Identity Operations</span>

        <div className="more-actions">
          <button
            type="button"
            onClick={() =>
              props.onNavigate(MODULE_ROUTES.credentials)
            }
          >
            Credentials
          </button>
          <button
            type="button"
            onClick={() =>
              props.onNavigate(MODULE_ROUTES.devices)
            }
          >
            Devices
          </button>
          <button
            type="button"
            onClick={() =>
              props.onNavigate(MODULE_ROUTES.accessPoints)
            }
          >
            Access Points
          </button>
          <button
            type="button"
            onClick={() =>
              props.onNavigate(MODULE_ROUTES.activity)
            }
          >
            Activity
          </button>
          <button
            type="button"
            onClick={() =>
              props.onNavigate(MODULE_ROUTES.cards)
            }
          >
            Student Cards
          </button>
        </div>
      </section>

      <section className="more-section">
        <span>System</span>

        <div className="more-actions">
          <button type="button" onClick={props.onRefresh}>
            Refresh identity overview
          </button>
        </div>
      </section>
    </Sheet>
  );
}

function StatusSheet({
  overall,
  modules,
  onClose,
}: {
  overall: {
    attention: number;
    inactive: number;
    healthyModules: number;
    totalModules: number;
    totalRecords: number;
  };
  modules: OverviewModule[];
  onClose: () => void;
}) {
  return (
    <Sheet
      title="Identity Status"
      text="Current branch identity health."
      onClose={onClose}
    >
      <div className="status-list">
        <StatusLine
          label="Identity records"
          value={overall.totalRecords}
        />
        <StatusLine
          label="Healthy modules"
          value={`${overall.healthyModules}/${overall.totalModules}`}
        />
        <StatusLine
          label="Need attention"
          value={overall.attention}
        />
        <StatusLine
          label="Inactive"
          value={overall.inactive}
        />

        {modules.map((module) => (
          <StatusLine
            key={module.key}
            label={module.title}
            value={`${module.active}/${module.total} active`}
          />
        ))}
      </div>
    </Sheet>
  );
}

function StatusLine({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Sheet({
  title,
  text,
  children,
  onClose,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="ba-sheet-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="ba-sheet"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="ba-sheet-head">
          <div>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            ×
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span>{label}</span>
      {children}
    </label>
  );
}

function RouteState({
  primary,
  title,
  text,
  action,
}: {
  primary: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <main
      className="ba-page"
      style={
        {
          "--ba-primary": primary,
        } as React.CSSProperties
      }
    >
      <style>{css}</style>

      <section className="ba-state">
        <h2>{title}</h2>
        <p>{text}</p>
        {action}
      </section>
    </main>
  );
}

const css = `
.ba-page{
  --ba-border:color-mix(in srgb,var(--foreground,#172033) 12%,transparent);
  --ba-muted:color-mix(in srgb,var(--foreground,#172033) 62%,transparent);
  --ba-soft:color-mix(in srgb,var(--foreground,#172033) 5%,transparent);
  color:var(--foreground,#172033);
  display:grid;
  gap:10px;
  padding:clamp(8px,1.8vw,16px);
  min-width:0;
}
.ba-search-card{
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto auto auto;
  align-items:center;
  gap:6px;
  min-width:0;
}
.status-dot-mini{
  width:10px;
  height:10px;
  border:0;
  border-radius:999px;
  padding:0;
  flex:0 0 auto;
  background:#94a3b8;
  box-shadow:0 0 0 3px color-mix(in srgb,currentColor 12%,transparent);
}
button.status-dot-mini{cursor:pointer}
.status-dot-mini.green,.status-dot-mini.healthy{background:#22c55e}
.status-dot-mini.orange,.status-dot-mini.attention{background:#f59e0b}
.status-dot-mini.red{background:#ef4444}
.status-dot-mini.gray,.status-dot-mini.inactive{background:#94a3b8}
.ba-search{
  height:38px;
  min-width:0;
  display:flex;
  align-items:center;
  gap:7px;
  padding:0 10px;
  border:1px solid var(--ba-border);
  border-radius:12px;
  background:var(--background,#fff);
}
.ba-search>span{
  font-size:19px;
  line-height:1;
  opacity:.55;
  transform:translateY(-1px);
}
.ba-search input{
  width:100%;
  min-width:0;
  border:0;
  outline:0;
  background:transparent;
  color:inherit;
  font:inherit;
  font-size:12px;
}
.ba-scan-button,.ba-filter-button,.ba-icon-button{
  height:38px;
  border:1px solid var(--ba-border);
  border-radius:11px;
  background:var(--background,#fff);
  color:inherit;
  font:inherit;
  font-size:10px;
  font-weight:850;
  cursor:pointer;
}
.ba-scan-button{
  padding:0 12px;
  color:var(--ba-primary);
}
.ba-filter-button,.ba-icon-button{
  width:38px;
  display:grid;
  place-items:center;
  position:relative;
}
.ba-filter-button.active{
  color:var(--ba-primary);
  border-color:color-mix(in srgb,var(--ba-primary) 34%,transparent);
}
.ba-filter-button b{
  position:absolute;
  top:-5px;
  right:-5px;
  min-width:16px;
  height:16px;
  display:grid;
  place-items:center;
  padding:0 3px;
  border-radius:999px;
  background:var(--ba-primary);
  color:#fff;
  font-size:8px;
}
.ba-slider-icon{
  width:17px;
  height:17px;
  fill:none;
  stroke:currentColor;
  stroke-width:1.8;
  stroke-linecap:round;
}
.ba-icon-button{font-size:18px;line-height:1}
.ba-filter-chips{
  display:flex;
  gap:5px;
  flex-wrap:wrap;
}
.ba-filter-chips span{
  border:1px solid var(--ba-border);
  border-radius:999px;
  background:var(--background,#fff);
  padding:4px 8px;
  font-size:8.5px;
  font-weight:750;
  color:var(--ba-muted);
}
.ba-list{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));
  gap:7px;
}
.identity-module-row{
  width:100%;
  min-width:0;
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  align-items:center;
  gap:9px;
  padding:9px;
  border:1px solid var(--ba-border);
  border-radius:13px;
  background:var(--background,#fff);
  color:inherit;
  text-align:left;
  cursor:pointer;
}
.identity-module-row:hover{
  border-color:color-mix(in srgb,var(--ba-primary) 32%,transparent);
}
.identity-icon{
  width:36px;
  height:36px;
  display:grid;
  place-items:center;
  border-radius:10px;
  background:color-mix(in srgb,var(--ba-primary) 10%,transparent);
  color:var(--ba-primary);
  font-size:17px;
  font-weight:900;
}
.identity-main{
  min-width:0;
  display:grid;
  gap:1px;
}
.identity-main strong{
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:10.5px;
}
.identity-main small{
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:var(--ba-muted);
  font-size:8.3px;
}
.identity-main em{
  color:var(--ba-muted);
  font-size:7.6px;
  font-style:normal;
}
.identity-side{
  display:grid;
  grid-template-columns:auto auto auto;
  align-items:center;
  gap:7px;
}
.identity-side>strong{
  color:var(--ba-primary);
  font-size:14px;
}
.identity-side .status-dot-mini{
  width:7px;
  height:7px;
}
.identity-side>b{
  color:var(--ba-muted);
  font-size:15px;
}
.recent-section{
  display:grid;
  gap:6px;
  margin-top:2px;
}
.section-label{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}
.section-label>span{
  color:var(--ba-muted);
  font-size:8px;
  font-weight:900;
  text-transform:uppercase;
}
.section-label button{
  border:0;
  background:transparent;
  color:var(--ba-primary);
  font-size:8px;
  font-weight:850;
  cursor:pointer;
}
.activity-list{
  display:grid;
  gap:5px;
}
.activity-row{
  width:100%;
  min-width:0;
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  align-items:center;
  gap:8px;
  border:1px solid var(--ba-border);
  border-radius:11px;
  background:var(--background,#fff);
  color:inherit;
  padding:7px 8px;
  text-align:left;
  cursor:pointer;
}
.activity-outcome{
  width:25px;
  height:25px;
  display:grid;
  place-items:center;
  border-radius:8px;
  background:var(--ba-soft);
  color:var(--ba-muted);
  font-size:10px;
  font-weight:900;
}
.activity-outcome.accepted{
  background:color-mix(in srgb,#22c55e 10%,transparent);
  color:#15803d;
}
.activity-outcome.pending{
  background:color-mix(in srgb,#f59e0b 10%,transparent);
  color:#b45309;
}
.activity-outcome.denied,.activity-outcome.failed{
  background:color-mix(in srgb,#ef4444 10%,transparent);
  color:#b91c1c;
}
.activity-main{
  min-width:0;
  display:grid;
  gap:1px;
}
.activity-main strong{
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-size:9.5px;
}
.activity-main small{
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:var(--ba-muted);
  font-size:8px;
}
.activity-main em{
  color:var(--ba-muted);
  font-size:7.4px;
  font-style:normal;
}
.activity-row time{
  color:var(--ba-muted);
  font-size:7.5px;
  white-space:nowrap;
}
.mini-empty{
  min-height:90px;
  display:grid;
  place-items:center;
  align-content:center;
  gap:3px;
  border:1px dashed var(--ba-border);
  border-radius:11px;
  text-align:center;
}
.mini-empty strong{font-size:9px}
.mini-empty span{
  color:var(--ba-muted);
  font-size:8px;
}
.ba-analysis-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(135px,1fr));
  gap:7px;
}
.ba-analysis{
  border:1px solid var(--ba-border);
  border-radius:12px;
  background:var(--background,#fff);
  padding:10px;
  display:grid;
  gap:4px;
}
.ba-analysis span{
  color:var(--ba-muted);
  font-size:8px;
  font-weight:800;
  text-transform:uppercase;
}
.ba-analysis strong{
  color:var(--ba-primary);
  font-size:17px;
}
.analytics-bars{
  display:grid;
  gap:7px;
}
.analytics-bars article{
  border:1px solid var(--ba-border);
  border-radius:11px;
  background:var(--background,#fff);
  padding:9px;
}
.analytics-bars header{
  display:flex;
  justify-content:space-between;
  gap:10px;
  margin-bottom:6px;
  font-size:8.5px;
}
.analytics-bars header strong{color:var(--ba-primary)}
.analytics-bars article>div{
  height:6px;
  overflow:hidden;
  border-radius:999px;
  background:var(--ba-soft);
}
.analytics-bars i{
  display:block;
  height:100%;
  border-radius:inherit;
  background:var(--ba-primary);
}
.ba-table-card{
  border:1px solid var(--ba-border);
  border-radius:13px;
  overflow:hidden;
  background:var(--background,#fff);
}
.ba-table-scroll{overflow:auto}
.ba-table-scroll table{
  width:100%;
  min-width:760px;
  border-collapse:collapse;
  font-size:9px;
}
.ba-table-scroll th,.ba-table-scroll td{
  text-align:left;
  padding:8px;
  border-bottom:1px solid var(--ba-border);
}
.ba-table-scroll th{
  color:var(--ba-muted);
  font-size:8px;
  text-transform:uppercase;
}
.table-module{
  display:flex;
  align-items:center;
  gap:7px;
}
.table-module>span{
  width:28px;
  height:28px;
  display:grid;
  place-items:center;
  border-radius:8px;
  background:color-mix(in srgb,var(--ba-primary) 9%,transparent);
  color:var(--ba-primary);
}
.table-module>div{display:grid}
.table-module small{
  color:var(--ba-muted);
  font-size:7.5px;
}
.table-status{
  display:inline-flex;
  border-radius:999px;
  padding:3px 7px;
  background:var(--ba-soft);
  color:var(--ba-muted);
  font-size:7.5px;
  font-weight:850;
}
.table-status.healthy{
  background:color-mix(in srgb,#22c55e 10%,transparent);
  color:#15803d;
}
.table-status.attention{
  background:color-mix(in srgb,#f59e0b 10%,transparent);
  color:#b45309;
}
.table-open{
  border:1px solid var(--ba-border);
  border-radius:7px;
  background:transparent;
  color:var(--ba-primary);
  padding:6px 8px;
  font-size:8px;
  font-weight:850;
}
.ba-empty,.ba-state{
  min-height:220px;
  display:grid;
  place-items:center;
  align-content:center;
  gap:6px;
  text-align:center;
  padding:24px;
  border:1px dashed var(--ba-border);
  border-radius:15px;
}
.ba-empty-icon{font-size:26px}
.ba-empty h3,.ba-state h2{
  margin:0;
  font-size:14px;
}
.ba-empty p,.ba-state p{
  max-width:440px;
  margin:0;
  color:var(--ba-muted);
  font-size:9.5px;
  line-height:1.6;
}
.ba-state-button{
  margin-top:8px;
  border:0;
  border-radius:10px;
  background:var(--ba-primary);
  color:#fff;
  padding:9px 12px;
  font-size:9px;
  font-weight:850;
}
.ba-toast{
  position:sticky;
  top:8px;
  z-index:60;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  border:1px solid var(--ba-border);
  border-radius:11px;
  background:var(--background,#fff);
  padding:9px 11px;
  font-size:9px;
  font-weight:750;
}
.ba-toast.success{
  border-color:color-mix(in srgb,#22c55e 38%,transparent)
}
.ba-toast.error{
  border-color:color-mix(in srgb,#ef4444 38%,transparent)
}
.ba-toast.info{
  border-color:color-mix(in srgb,var(--ba-primary) 38%,transparent)
}
.ba-toast button{
  border:0;
  background:transparent;
  color:inherit;
  font-size:16px;
}
.ba-sheet-backdrop{
  position:fixed;
  inset:0;
  z-index:100;
  display:grid;
  place-items:end center;
  padding:8px;
  background:rgba(15,23,42,.58);
}
.ba-sheet{
  width:min(580px,100%);
  max-height:92vh;
  overflow:auto;
  border:1px solid var(--ba-border);
  border-radius:20px 20px 12px 12px;
  background:var(--background,#fff);
  color:var(--foreground,#172033);
  padding:12px;
  box-sizing:border-box;
}
.ba-sheet-head{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:10px;
  padding-bottom:10px;
  border-bottom:1px solid var(--ba-border);
}
.ba-sheet-head h2{
  margin:0;
  font-size:13px;
}
.ba-sheet-head p{
  margin:2px 0 0;
  color:var(--ba-muted);
  font-size:8.5px;
}
.ba-sheet-head>button{
  width:30px;
  height:30px;
  border:1px solid var(--ba-border);
  border-radius:9px;
  background:transparent;
  color:inherit;
  font-size:17px;
}
.ba-form{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px;
  padding-top:11px;
}
.ba-form label{
  min-width:0;
  display:grid;
  gap:4px;
}
.ba-form label>span{
  color:var(--ba-muted);
  font-size:8px;
  font-weight:850;
  text-transform:uppercase;
}
.ba-form select{
  width:100%;
  box-sizing:border-box;
  border:1px solid var(--ba-border);
  border-radius:9px;
  background:var(--background,#fff);
  color:inherit;
  padding:9px;
  font:inherit;
  font-size:9px;
}
.ba-sheet-footer{
  display:flex;
  justify-content:flex-end;
  gap:7px;
  padding-top:12px;
}
.ba-sheet-footer button{
  border:1px solid var(--ba-border);
  border-radius:9px;
  background:transparent;
  color:inherit;
  padding:9px 13px;
  font-size:8.5px;
  font-weight:850;
}
.ba-sheet-footer button.primary{
  border-color:var(--ba-primary);
  background:var(--ba-primary);
  color:#fff;
}
.more-section{
  display:grid;
  gap:7px;
  padding:11px 0;
}
.more-section>span{
  color:var(--ba-muted);
  font-size:8px;
  font-weight:900;
  text-transform:uppercase;
}
.more-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:7px;
}
.more-grid button{
  min-width:0;
  display:grid;
  gap:2px;
  text-align:left;
  border:1px solid var(--ba-border);
  border-radius:11px;
  background:transparent;
  color:inherit;
  padding:9px;
}
.more-grid button.active{
  border-color:color-mix(in srgb,var(--ba-primary) 42%,transparent);
  background:color-mix(in srgb,var(--ba-primary) 8%,transparent);
}
.more-grid strong{font-size:9.5px}
.more-grid small{
  color:var(--ba-muted);
  font-size:7.5px;
}
.more-actions{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:7px;
}
.more-actions button{
  min-height:36px;
  border:1px solid var(--ba-border);
  border-radius:9px;
  background:transparent;
  color:inherit;
  padding:8px;
  text-align:left;
  font-size:8.5px;
  font-weight:750;
}
.status-list{
  display:grid;
  gap:0;
  padding-top:7px;
}
.status-list>div{
  display:flex;
  justify-content:space-between;
  gap:12px;
  padding:9px 1px;
  border-bottom:1px solid var(--ba-border);
  font-size:9px;
}
.status-list span{color:var(--ba-muted)}
.status-list strong{color:var(--ba-primary)}
@media(max-width:640px){
  .ba-page{
    padding:7px;
    gap:8px;
  }
  .ba-search-card{gap:4px}
  .ba-search{
    height:36px;
    padding:0 8px;
  }
  .ba-scan-button,.ba-filter-button,.ba-icon-button{
    height:36px;
  }
  .ba-filter-button,.ba-icon-button{width:36px}
  .identity-module-row{
    grid-template-columns:auto minmax(0,1fr);
  }
  .identity-side{
    grid-column:1/-1;
    justify-content:flex-end;
  }
  .ba-form,.more-grid,.more-actions{
    grid-template-columns:1fr;
  }
}
`;
