"use client";

/**
 * app/developer/modules/DeveloperDashboard.tsx
 * --------------------------------------------------------------------------
 * ELEEVEON DEVELOPER DASHBOARD — GOLDEN STANDARD PLATFORM HOME
 * --------------------------------------------------------------------------
 *
 * Learned from BranchAdminDashboard.tsx:
 * - Uses the shared dashboard component system.
 * - Receives the same navSections used by app/developer/page.tsx.
 * - Adding/removing/reordering developer nav items automatically updates the
 *   module list without keeping a second manually duplicated navigation map.
 * - Module metrics are mapped by route key and fall back safely to Open.
 * - Uses the compact dashboard toolbar, search results, welcome hero,
 *   quick actions, dashboard widgets and one-window scroll ownership.
 *
 * Developer scope:
 * - Platform-wide. No school or branch context is required.
 * - Reads the locally available platform/cache data from Dexie.
 * - Designed for both "developer" and "platform_team" workspaces.
 * - Does not pretend local Dexie contains server records that have not been
 *   bootstrapped/pulled to the current developer session.
 */

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { useAccount } from "../../context/account-context";
import { useActiveMembership } from "../../context/active-membership-context";

import { db } from "../../lib/db/db";

import type {
  RoleNavSection,
} from "../../components/role-portals/RolePortalShell";

import { useDataRevision } from "../../hooks/useDataRevision";
import { useBackgroundLoader } from "../../hooks/useBackgroundLoader";

import {
  ActivityFeed,
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
  Button,
  Dialog,
  EmptyState,
} from "../../components/ui";

type AnyRow = Record<string, any>;

type Tone =
  | "green"
  | "red"
  | "blue"
  | "gray"
  | "orange"
  | "purple";

type AreaFilter =
  | "all"
  | "saas"
  | "team"
  | "billing"
  | "support"
  | "tools"
  | "system"
  | "other";

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

const HIDDEN_DASHBOARD_KEYS =
  new Set(["developerDashboard"]);

const TABLE_NAMES = [
  "accounts",
  "appUsers",
  "userMemberships",
  "permissionRules",
  "userSessions",

  "commercialPlans",
  "subscriptionPlans",
  "accountSubscriptions",
  "subscriptionPeriods",
  "subscriptionChangeOrders",
  "accountEntitlements",
  "accountUsageSnapshots",
  "privateOffers",
  "privateOfferAssignments",
  "pricingOverrides",
  "accountPricingOverrides",
  "accountQuotaEvents",
  "perpetualLicenses",
  "licenseActivations",
  "licenseDevices",
  "licenseVersionEntitlements",
  "licenseUpgradeOffers",
  "licenseValidationEvents",

  "invoices",
  "appPayments",
  "billingEvents",

  "platformFeedback",
  "platformFeedbackMessages",
  "platformFeedbackAttachments",
  "platformAnnouncements",
  "platformReleases",
  "platformReleaseNotes",

  "syncDevices",
  "syncConflicts",

  "apiClients",
  "apiKeys",
  "webhooks",
  "webhookLogs",
  "integrationMappings",

  "auditLogs",
  "backgroundJobs",
  "storageUsages",
  "accountFeatureFlags",
  "accountSystemSettings",
  "notificationDeliveryLogs",
] as const;

function n(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function text(
  value: unknown,
  fallback = "",
) {
  return String(value ?? "").trim() ||
    fallback;
}

function cleanId(value: unknown) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

function idOf(row?: AnyRow) {
  return cleanId(
    row?.id ??
      row?.payload?.id,
  );
}

function activeRow(row: AnyRow) {
  const status =
    text(row?.status).toLowerCase();

  return (
    row?.isDeleted !== true &&
    row?.active !== false &&
    ![
      "deleted",
      "archived",
      "inactive",
      "disabled",
      "revoked",
    ].includes(status)
  );
}

function count(rows: AnyRow[]) {
  return rows.filter(activeRow).length;
}

function uniqueCount(
  rows: AnyRow[],
  field: string,
) {
  return new Set(
    rows
      .filter(activeRow)
      .map((row) => row[field])
      .filter(
        (value) =>
          value !== undefined &&
          value !== null &&
          value !== "",
      ),
  ).size;
}

function sum(
  rows: AnyRow[],
  ...fields: string[]
) {
  return rows
    .filter(activeRow)
    .reduce((total, row) => {
      const value =
        fields
          .map((field) =>
            Number(row[field]),
          )
          .find((item) =>
            Number.isFinite(item),
          ) ?? 0;

      return total + value;
    }, 0);
}

function money(
  value: unknown,
  currency = "GHS",
) {
  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      },
    ).format(n(value));
  } catch {
    return `${currency} ${n(
      value,
    ).toLocaleString()}`;
  }
}

function dateLabel(
  value?: string | number | null,
) {
  if (!value) return "Not set";

  const time =
    typeof value === "number"
      ? value
      : new Date(value).getTime();

  if (!Number.isFinite(time)) {
    return "Not set";
  }

  try {
    return new Intl.DateTimeFormat(
      undefined,
      {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(new Date(time));
  } catch {
    return "Not set";
  }
}

function rowDate(row: AnyRow) {
  return (
    row.updatedAt ??
    row.createdAt ??
    row.publishedAt ??
    row.submittedAt ??
    row.paidAt ??
    row.issueDate ??
    row.lastSeenAt ??
    0
  );
}

async function safeArray<T = AnyRow>(
  tableName: string,
): Promise<T[]> {
  const table =
    (db as any)[tableName];

  return table?.toArray
    ? table.toArray()
    : [];
}

function statusTone(
  status?: string,
): Tone {
  const value =
    text(status).toLowerCase();

  if (
    [
      "active",
      "paid",
      "success",
      "succeeded",
      "synced",
      "published",
      "resolved",
      "completed",
      "delivered",
      "healthy",
    ].includes(value)
  ) {
    return "green";
  }

  if (
    [
      "failed",
      "overdue",
      "cancelled",
      "expired",
      "suspended",
      "revoked",
      "blocked",
      "error",
    ].includes(value)
  ) {
    return "red";
  }

  if (
    [
      "pending",
      "processing",
      "trial",
      "draft",
      "submitted",
      "acknowledged",
      "under_review",
      "in_progress",
      "scheduled",
    ].includes(value)
  ) {
    return "orange";
  }

  return "gray";
}

function areaFromSectionTitle(
  title: string,
): Exclude<AreaFilter, "all"> {
  const value =
    text(title)
      .toLowerCase();

  if (
    value.includes("saas") ||
    value.includes("control")
  ) {
    return "saas";
  }

  if (value.includes("team")) {
    return "team";
  }

  if (value.includes("billing")) {
    return "billing";
  }

  if (
    value.includes("support") ||
    value.includes("technical")
  ) {
    return "support";
  }

  if (
    value.includes("tool") ||
    value.includes("developer")
  ) {
    return "tools";
  }

  if (
    value.includes("system") ||
    value.includes("setting")
  ) {
    return "system";
  }

  return "other";
}

function areaLabel(area: string) {
  const labels: Record<string, string> = {
    all: "All areas",
    saas: "SaaS Control",
    team: "Platform Team",
    billing: "Platform Billing",
    support: "Technical Support",
    tools: "Developer Tools",
    system: "System",
    other: "Other",
  };

  return labels[area] ?? area;
}

function buildNavModules(
  navSections?: RoleNavSection[],
): Omit<
  DashboardModule,
  "value" | "note" | "tone"
>[] {
  const unique = new Map<
    string,
    Omit<
      DashboardModule,
      "value" | "note" | "tone"
    >
  >();

  (navSections ?? []).forEach(
    (section) => {
      const area =
        areaFromSectionTitle(
          section.title,
        );

      section.items.forEach(
        (item) => {
          if (
            HIDDEN_DASHBOARD_KEYS.has(
              item.key,
            ) ||
            unique.has(item.key)
          ) {
            return;
          }

          unique.set(item.key, {
            key: item.key,
            label: item.label,
            icon: item.icon,
            area,
            routeKey: item.key,
          });
        },
      );
    },
  );

  return [...unique.values()];
}

function metricFor(
  routeKey: string,
  rows: Record<
    string,
    AnyRow[]
  >,
  summary: AnyRow,
): CountMetric {
  const metricMap:
    Record<string, CountMetric> = {
    plans: {
      value:
        summary.activePlans,
      note:
        `${summary.totalPlans} plan/package record(s), ${summary.activePlans} currently active.`,
      tone:
        summary.activePlans
          ? "green"
          : "orange",
    },

    subscriptions: {
      value:
        summary.activeSubscriptions,
      note:
        `${summary.totalSubscriptions} subscription record(s), ${summary.trialSubscriptions} trial and ${summary.subscriptionIssues} needing attention.`,
      tone:
        summary.subscriptionIssues
          ? "orange"
          : summary.activeSubscriptions
            ? "green"
            : "gray",
    },

    accounts: {
      value:
        summary.activeAccounts,
      note:
        `${summary.totalAccounts} customer account(s), ${summary.suspendedAccounts} suspended/blocked.`,
      tone:
        summary.suspendedAccounts
          ? "orange"
          : summary.activeAccounts
            ? "blue"
            : "gray",
    },

    featureFlags: {
      value:
        summary.featureFlags,
      note:
        `${summary.enabledFeatureFlags} enabled account feature flag(s).`,
      tone:
        summary.featureFlags
          ? "purple"
          : "gray",
    },

    developerTeam: {
      value:
        summary.platformTeam,
      note:
        "Developer and platform-team identities available in the local platform cache.",
      tone:
        summary.platformTeam
          ? "blue"
          : "gray",
    },

    invoices: {
      value:
        summary.unpaidInvoices ||
        summary.totalInvoices,
      note:
        `${summary.totalInvoices} invoice(s), ${summary.unpaidInvoices} unpaid/overdue.`,
      tone:
        summary.unpaidInvoices
          ? "orange"
          : summary.totalInvoices
            ? "green"
            : "gray",
    },

    payments: {
      value:
        money(
          summary.paidAmount,
          summary.currency,
        ),
      note:
        `${summary.successfulPayments} successful platform payment(s), ${summary.failedPayments} failed.`,
      tone:
        summary.failedPayments
          ? "orange"
          : summary.successfulPayments
            ? "green"
            : "gray",
    },

    support: {
      value:
        summary.openFeedback,
      note:
        `${summary.newFeedback} new support/feedback item(s), ${summary.highPriorityFeedback} high priority.`,
      tone:
        summary.highPriorityFeedback
          ? "red"
          : summary.openFeedback
            ? "orange"
            : "green",
    },

    systemHealth: {
      value:
        summary.platformHealth,
      note:
        `${summary.openConflicts} open sync conflict(s), ${summary.failedJobs} failed job(s).`,
      tone:
        summary.openConflicts ||
        summary.failedJobs
          ? "orange"
          : "green",
    },

    syncDiagnostics: {
      value:
        summary.openConflicts,
      note:
        `${summary.syncDevices} sync device(s), ${summary.openConflicts} unresolved conflict(s).`,
      tone:
        summary.openConflicts
          ? "orange"
          : "green",
    },

    errorReports: {
      value:
        summary.failedJobs +
        summary.failedWebhookLogs +
        summary.openConflicts,
      note:
        "Failed jobs, webhook deliveries and unresolved sync conflicts requiring investigation.",
      tone:
        summary.failedJobs +
          summary.failedWebhookLogs +
          summary.openConflicts
          ? "red"
          : "green",
    },

    auditLogs: {
      value:
        summary.auditLogs,
      note:
        "Platform audit activity currently available in the developer cache.",
      tone:
        summary.auditLogs
          ? "blue"
          : "gray",
    },

    databaseTools: {
      value:
        summary.cachedTables,
      note:
        `${summary.cachedRecords.toLocaleString()} cached record(s) across platform dashboard tables.`,
      tone: "blue",
    },

    databaseStudio: {
      value: "Open",
      note:
        "Inspect and work with locally available platform/database records.",
      tone: "purple",
    },

    databaseDesigner: {
      value: "Open",
      note:
        "Inspect and design database structures and schema relationships.",
      tone: "purple",
    },

    sqlConsole: {
      value: "Open",
      note:
        "Developer SQL workspace for controlled database operations.",
      tone: "orange",
    },

    backups: {
      value: "Open",
      note:
        "Platform backup, recovery and restore controls.",
      tone: "blue",
    },

    integrations: {
      value:
        summary.integrations,
      note:
        `${summary.apiClients} API client(s), ${summary.activeWebhooks} active webhook(s).`,
      tone:
        summary.integrations
          ? "green"
          : "gray",
    },

    releases: {
      value:
        summary.publishedReleases,
      note:
        `${summary.totalReleases} platform release(s), ${summary.draftReleases} draft.`,
      tone:
        summary.publishedReleases
          ? "green"
          : "orange",
    },

    settings: {
      value:
        summary.systemSettings ||
        "Open",
      note:
        "Developer-only platform settings and protected controls.",
      tone: "purple",
    },
  };

  if (metricMap[routeKey]) {
    return metricMap[routeKey];
  }

  const guessedRows =
    rows[routeKey] ?? [];

  if (guessedRows.length) {
    return {
      value: count(guessedRows),
      note:
        "Auto-counted from the matching local platform table.",
      tone:
        count(guessedRows)
          ? "green"
          : "gray",
    };
  }

  return {
    value: "Open",
    note:
      "Module is listed from Developer navigation. Add a metric mapping when its platform data is ready.",
    tone: "gray",
  };
}

export default function DeveloperDashboard({
  navigate,
  navSections,
}: RouteProps) {
  const dataRevision =
    useDataRevision();

  const router = useRouter();

  const {
    accountId,
    authenticated,
    loading: accountLoading,
    user,
    account,
  } = useAccount() as any;

  const {
    activeMembership,
  } = useActiveMembership();

  const {
    loading,
    setLoading,
  } = useBackgroundLoader();

  const [query, setQuery] =
    useState("");

  const [
    rowsByTable,
    setRowsByTable,
  ] = useState<
    Record<string, AnyRow[]>
  >({});

  const [
    moreOpen,
    setMoreOpen,
  ] = useState(false);

  const primary =
    "var(--primary-color,#2563eb)";

  const role =
    activeMembership?.role ??
    account?.role ??
    user?.role ??
    "developer";

  useEffect(() => {
    if (accountLoading) return;

    if (
      !authenticated ||
      !accountId
    ) {
      router.replace("/login");
    }
  }, [
    accountId,
    accountLoading,
    authenticated,
    router,
  ]);

  async function load() {
    if (
      !authenticated ||
      !accountId
    ) {
      setRowsByTable({});
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const loaded =
        await Promise.all(
          TABLE_NAMES.map(
            async (tableName) => {
              const tableRows =
                await safeArray(
                  tableName,
                );

              return [
                tableName,
                tableRows,
              ] as const;
            },
          ),
        );

      setRowsByTable(
        Object.fromEntries(loaded),
      );
    } catch (error) {
      console.error(
        "Failed to load developer dashboard:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accountLoading) return;

    void load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authenticated,
    accountId,
    accountLoading,
    dataRevision,
  ]);

  const rows = rowsByTable;

  const identity = useMemo(() => {
    const appUsers =
      rows.appUsers ?? [];

    const currentUserId =
      cleanId(user?.id) ||
      cleanId(
        activeMembership?.userId,
      );

    const localUser =
      appUsers.find(
        (row) =>
          idOf(row) ===
          currentUserId,
      ) ?? user;

    return {
      userName:
        text(
          localUser?.fullName ??
            localUser?.name ??
            activeMembership?.fullName ??
            activeMembership?.name,
          role === "platform_team"
            ? "Platform Team"
            : "Developer",
        ),
      role,
    };
  }, [
    activeMembership,
    role,
    rows.appUsers,
    user,
  ]);

  const summary = useMemo(() => {
    const accounts =
      rows.accounts ?? [];

    const plans = [
      ...(rows.commercialPlans ??
        []),
      ...(rows.subscriptionPlans ??
        []),
    ];

    const subscriptions =
      rows.accountSubscriptions ??
      [];

    const invoices =
      rows.invoices ?? [];

    const payments =
      rows.appPayments ?? [];

    const feedback =
      rows.platformFeedback ?? [];

    const releases =
      rows.platformReleases ?? [];

    const appUsers =
      rows.appUsers ?? [];

    const syncConflicts =
      rows.syncConflicts ?? [];

    const jobs =
      rows.backgroundJobs ?? [];

    const webhookLogs =
      rows.webhookLogs ?? [];

    const storage =
      rows.storageUsages ?? [];

    const featureFlags =
      rows.accountFeatureFlags ??
      [];

    const systemSettings =
      rows.accountSystemSettings ??
      [];

    const apiClients =
      rows.apiClients ?? [];

    const webhooks =
      rows.webhooks ?? [];

    const integrationMappings =
      rows.integrationMappings ??
      [];

    const activeAccounts =
      accounts.filter((row) => {
        const status =
          text(
            row.status,
            "active",
          ).toLowerCase();

        return (
          activeRow(row) &&
          ![
            "suspended",
            "blocked",
            "closed",
          ].includes(status)
        );
      }).length;

    const suspendedAccounts =
      accounts.filter((row) =>
        [
          "suspended",
          "blocked",
        ].includes(
          text(
            row.status,
          ).toLowerCase(),
        ),
      ).length;

    const activeSubscriptions =
      subscriptions.filter(
        (row) =>
          [
            "active",
            "trial",
            "trialing",
          ].includes(
            text(
              row.status,
            ).toLowerCase(),
          ),
      ).length;

    const trialSubscriptions =
      subscriptions.filter(
        (row) =>
          text(
            row.status,
          )
            .toLowerCase()
            .includes("trial"),
      ).length;

    const subscriptionIssues =
      subscriptions.filter(
        (row) =>
          [
            "past_due",
            "overdue",
            "suspended",
            "expired",
            "cancelled",
          ].includes(
            text(
              row.status,
            ).toLowerCase(),
          ),
      ).length;

    const unpaidInvoices =
      invoices.filter(
        (row) =>
          [
            "issued",
            "pending",
            "overdue",
            "part_paid",
          ].includes(
            text(
              row.status,
            ).toLowerCase(),
          ),
      ).length;

    const successfulPayments =
      payments.filter(
        (row) =>
          [
            "paid",
            "success",
            "succeeded",
            "completed",
          ].includes(
            text(
              row.status,
            ).toLowerCase(),
          ),
      );

    const failedPayments =
      payments.filter(
        (row) =>
          [
            "failed",
            "cancelled",
            "reversed",
          ].includes(
            text(
              row.status,
            ).toLowerCase(),
          ),
      ).length;

    const openFeedbackRows =
      feedback.filter(
        (row) =>
          ![
            "resolved",
            "closed",
          ].includes(
            text(
              row.status,
            ).toLowerCase(),
          ),
      );

    const newFeedback =
      feedback.filter(
        (row) =>
          text(
            row.status,
          ).toLowerCase() ===
          "submitted",
      ).length;

    const highPriorityFeedback =
      openFeedbackRows.filter(
        (row) =>
          [
            "high",
            "urgent",
          ].includes(
            text(
              row.priority,
            ).toLowerCase(),
          ),
      ).length;

    const openConflicts =
      syncConflicts.filter(
        (row) =>
          ![
            "resolved",
            "ignored",
            "closed",
          ].includes(
            text(
              row.status,
              "open",
            ).toLowerCase(),
          ),
      ).length;

    const failedJobs =
      jobs.filter(
        (row) =>
          [
            "failed",
            "error",
          ].includes(
            text(
              row.status,
            ).toLowerCase(),
          ),
      ).length;

    const failedWebhookLogs =
      webhookLogs.filter(
        (row) =>
          [
            "failed",
            "error",
          ].includes(
            text(
              row.status,
            ).toLowerCase(),
          ),
      ).length;

    const platformTeam =
      appUsers.filter(
        (row) =>
          [
            "developer",
            "platform_team",
          ].includes(
            text(
              row.role,
            ).toLowerCase(),
          ) &&
          row.active !== false,
      ).length;

    const totalUsedStorage =
      sum(
        storage,
        "usedMb",
        "storageMb",
      );

    const totalStorageLimit =
      sum(
        storage,
        "limitMb",
        "maxStorageMb",
      );

    const enabledFeatureFlags =
      featureFlags.filter(
        (row) =>
          row.enabled === true,
      ).length;

    const publishedReleases =
      releases.filter(
        (row) =>
          text(
            row.status,
          ).toLowerCase() ===
          "published",
      ).length;

    const draftReleases =
      releases.filter(
        (row) =>
          text(
            row.status,
          ).toLowerCase() ===
          "draft",
      ).length;

    const currency =
      text(
        payments.find(
          (row) =>
            row.currency,
        )?.currency ??
          invoices.find(
            (row) =>
              row.currency,
          )?.currency,
        "GHS",
      );

    const paidAmount =
      sum(
        successfulPayments,
        "amount",
        "amountPaid",
        "total",
      );

    const cachedRecords =
      Object.values(rows).reduce(
        (total, tableRows) =>
          total +
          tableRows.length,
        0,
      );

    const cachedTables =
      Object.values(rows).filter(
        (tableRows) =>
          tableRows.length > 0,
      ).length;

    return {
      totalAccounts:
        accounts.length,
      activeAccounts,
      suspendedAccounts,

      totalPlans:
        plans.length,
      activePlans:
        plans.filter(activeRow)
          .length,

      totalSubscriptions:
        subscriptions.length,
      activeSubscriptions,
      trialSubscriptions,
      subscriptionIssues,

      totalInvoices:
        invoices.length,
      unpaidInvoices,

      successfulPayments:
        successfulPayments.length,
      failedPayments,
      paidAmount,
      currency,

      openFeedback:
        openFeedbackRows.length,
      newFeedback,
      highPriorityFeedback,

      syncDevices:
        count(
          rows.syncDevices ?? [],
        ),
      openConflicts,
      failedJobs,
      failedWebhookLogs,

      platformTeam,

      storageUsedMb:
        totalUsedStorage,
      storageLimitMb:
        totalStorageLimit,

      featureFlags:
        featureFlags.length,
      enabledFeatureFlags,

      totalReleases:
        releases.length,
      publishedReleases,
      draftReleases,

      apiClients:
        count(apiClients),
      activeWebhooks:
        count(webhooks),
      integrations:
        count(apiClients) +
        count(webhooks) +
        count(
          integrationMappings,
        ),

      auditLogs:
        rows.auditLogs?.length ??
        0,

      systemSettings:
        systemSettings.length,

      cachedRecords,
      cachedTables,

      platformHealth:
        openConflicts ||
        failedJobs ||
        failedWebhookLogs
          ? "Attention"
          : "Healthy",
    };
  }, [rows]);

  const modules =
    useMemo<DashboardModule[]>(
      () =>
        buildNavModules(
          navSections,
        ).map((module) => ({
          ...module,
          ...metricFor(
            module.routeKey,
            rows,
            summary,
          ),
        })),
      [
        navSections,
        rows,
        summary,
      ],
    );

  const q =
    query.trim().toLowerCase();

  const searchResults =
    useMemo(() => {
      if (!q) return [];

      return modules
        .filter((item) =>
          `${item.label} ${item.note} ${item.area}`
            .toLowerCase()
            .includes(q),
        )
        .slice(0, 12);
    }, [modules, q]);

  const recentFeedback =
    useMemo(
      () =>
        [...(
          rows.platformFeedback ??
          []
        )]
          .sort(
            (a, b) =>
              n(
                b.lastMessageAt ??
                  b.updatedAt ??
                  b.submittedAt,
              ) -
              n(
                a.lastMessageAt ??
                  a.updatedAt ??
                  a.submittedAt,
              ),
          )
          .slice(0, 5),
      [rows.platformFeedback],
    );

  const recentReleases =
    useMemo(
      () =>
        [...(
          rows.platformReleases ??
          []
        )]
          .sort(
            (a, b) =>
              new Date(
                b.publishedAt ??
                  b.updatedAt ??
                  b.createdAt ??
                  0,
              ).getTime() -
              new Date(
                a.publishedAt ??
                  a.updatedAt ??
                  a.createdAt ??
                  0,
              ).getTime(),
          )
          .slice(0, 5),
      [rows.platformReleases],
    );

  const recentBilling =
    useMemo<AnyRow[]>(() => {
      const source: AnyRow[] = [
        ...(rows.invoices ?? []).map(
          (row) => ({
            ...row,
            _kind: "Invoice",
            _icon: "🧾",
            _title:
              text(
                row.invoiceNumber,
                "Invoice",
              ),
            _date:
              row.updatedAt ??
              row.issueDate ??
              row.createdAt,
          }),
        ),
        ...(rows.appPayments ??
          []).map((row) => ({
          ...row,
          _kind: "Payment",
          _icon: "💰",
          _title:
            text(
              row.receiptNumber ??
                row.providerReference,
              "Platform payment",
            ),
          _date:
            row.paidAt ??
            row.updatedAt ??
            row.createdAt,
        })),
      ];

      return source
        .sort(
          (a, b) =>
            new Date(
              b._date ?? 0,
            ).getTime() -
            new Date(
              a._date ?? 0,
            ).getTime(),
        )
        .slice(0, 5);
    }, [
      rows.appPayments,
      rows.invoices,
    ]);

  const recentActivity =
    useMemo(() => {
      const source = [
        ...(rows.accounts ?? []).map(
          (row) => ({
            ...row,
            _kind: "Account",
            _icon: "🏫",
            _title:
              text(
                row.name ??
                  row.email,
                "Customer account",
              ),
            _date: rowDate(row),
          }),
        ),
        ...(rows.platformFeedback ??
          []).map((row) => ({
          ...row,
          _kind: "Support",
          _icon: "🎫",
          _title:
            text(
              row.subject,
              "Support request",
            ),
          _date:
            row.lastMessageAt ??
            row.updatedAt ??
            row.submittedAt,
        })),
        ...(rows.platformReleases ??
          []).map((row) => ({
          ...row,
          _kind: "Release",
          _icon: "🚀",
          _title:
            text(
              row.title ??
                row.version,
              "Platform release",
            ),
          _date:
            row.publishedAt ??
            row.updatedAt ??
            row.createdAt,
        })),
        ...(rows.auditLogs ??
          []).map((row) => ({
          ...row,
          _kind: "Audit",
          _icon: "📜",
          _title:
            text(
              row.action,
              "Platform activity",
            ),
          _date:
            row.createdAt ??
            row.updatedAt,
        })),
      ];

      return source
        .sort(
          (a, b) =>
            new Date(
              b._date ?? 0,
            ).getTime() -
            new Date(
              a._date ?? 0,
            ).getTime(),
        )
        .slice(0, 6);
    }, [rows]);

  const userName =
    identity.userName;

  const hour =
    new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  function openRoute(
    routeKey: string,
  ) {
    if (navigate) {
      return navigate(routeKey);
    }

    try {
      window.dispatchEvent(
        new CustomEvent(
          "eleeveon:portal-route",
          {
            detail: {
              key: routeKey,
            },
          },
        ),
      );

      window.dispatchEvent(
        new CustomEvent(
          "role-portal:navigate",
          {
            detail: {
              key: routeKey,
            },
          },
        ),
      );

      window.dispatchEvent(
        new CustomEvent(
          "portal:navigate",
          {
            detail: routeKey,
          },
        ),
      );
    } catch {
      // RolePortalShell remains the normal navigation owner.
    }
  }

  const quickActions = [
    {
      key: "accounts",
      label: "Accounts",
      icon: (
        <span aria-hidden="true">
          🏫
        </span>
      ),
      onClick: () =>
        openRoute("accounts"),
    },
    {
      key: "subscriptions",
      label: "Subscriptions",
      icon: (
        <span aria-hidden="true">
          🔁
        </span>
      ),
      onClick: () =>
        openRoute("subscriptions"),
    },
    {
      key: "payments",
      label: "Payments",
      icon: (
        <span aria-hidden="true">
          💰
        </span>
      ),
      onClick: () =>
        openRoute("payments"),
    },
    {
      key: "featureFlags",
      label: "Features",
      icon: (
        <span aria-hidden="true">
          🚦
        </span>
      ),
      onClick: () =>
        openRoute("featureFlags"),
    },
    {
      key: "releases",
      label: "Release",
      icon: (
        <span aria-hidden="true">
          🚀
        </span>
      ),
      onClick: () =>
        openRoute("releases"),
    },
  ];

  const heroStats = [
    {
      label: "Accounts",
      value:
        summary.activeAccounts,
    },
    {
      label: "Subscriptions",
      value:
        summary.activeSubscriptions,
    },
    {
      label: "Open support",
      value:
        summary.openFeedback,
    },
  ];

  const heroSlides:
    HeroSlide[] = [];

  if (
    loading ||
    accountLoading
  ) {
    return (
      <DashboardBackground
        primaryColor={primary}
      >
        <section className="eds-dashboard-state">
          <div className="eds-dashboard-state-spinner" />
          <h2>
            Opening developer dashboard...
          </h2>
          <p>
            Preparing accounts,
            subscriptions, platform
            health, support and developer
            tools.
          </p>
        </section>
      </DashboardBackground>
    );
  }

  if (
    !authenticated ||
    !accountId
  ) {
    return (
      <DashboardBackground
        primaryColor={primary}
      >
        <section className="eds-dashboard-state">
          <h2>
            Redirecting to login...
          </h2>
          <p>
            You must sign in before
            viewing the developer portal.
          </p>
        </section>
      </DashboardBackground>
    );
  }

  return (
    <DashboardBackground
      primaryColor={primary}
    >
      <style>
        {developerDashboardCss}
      </style>

      <div className="developer-dashboard-toolbar">
        <DashboardHeader
          query={query}
          onQueryChange={setQuery}
          onClear={() =>
            setQuery("")
          }
          onRefresh={() =>
            void load()
          }
          onMore={() =>
            setMoreOpen(true)
          }
          placeholder="Search accounts, billing, support, tools..."
          active={Boolean(
            summary.activeAccounts ||
              summary.activeSubscriptions,
          )}
          statusLabel={
            identity.role ===
            "platform_team"
              ? "Platform Team"
              : "Developer"
          }
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
            action={
              <b>
                {
                  searchResults.length
                }
              </b>
            }
          >
            {searchResults.map(
              (item) => (
                <button
                  key={item.key}
                  type="button"
                  className="eds-dashboard-search-row"
                  onClick={() =>
                    openRoute(
                      item.routeKey,
                    )
                  }
                >
                  <span className="eds-dashboard-search-icon">
                    {item.icon}
                  </span>

                  <span className="eds-dashboard-search-copy">
                    <strong>
                      {item.label}
                    </strong>

                    <small>
                      {item.note}
                    </small>

                    <em>
                      {areaLabel(
                        item.area,
                      )}
                    </em>
                  </span>

                  <b>
                    {item.value}
                  </b>
                </button>
              ),
            )}

            {!searchResults.length ? (
              <EmptyState
                icon="⌕"
                title="Nothing matches that search"
                description="Try accounts, subscriptions, invoices, payments, releases, database or settings."
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
            schoolName="Eleeveon"
            branchName="Platform Control"
            motto="Build, operate and support the platform from one calm workspace."
            slide={null}
            slides={heroSlides}
            slideIndex={0}
            stats={heroStats}
            onAdvance={() => {}}
            onSlideChange={() => {}}
            onSlideAction={() => {}}
          />

          <QuickActionGrid
            actions={quickActions}
          />

          <DashboardWidgets>
            <DashboardWidget>
              <DashboardSection
                eyebrow="Platform"
                title="Customer base"
                action={
                  <button
                    type="button"
                    onClick={() =>
                      openRoute(
                        "accounts",
                      )
                    }
                  >
                    Accounts
                  </button>
                }
              >
                <StatisticGrid>
                  <StatisticCard
                    label="Active accounts"
                    value={
                      summary.activeAccounts
                    }
                  />

                  <StatisticCard
                    label="Subscriptions"
                    value={
                      summary.activeSubscriptions
                    }
                  />

                  <StatisticCard
                    label="Trials"
                    value={
                      summary.trialSubscriptions
                    }
                  />

                  <StatisticCard
                    label="Plan issues"
                    value={
                      summary.subscriptionIssues
                    }
                  />
                </StatisticGrid>
              </DashboardSection>
            </DashboardWidget>

            <DashboardWidget>
              <DashboardSection
                eyebrow="Revenue"
                title="Billing"
                action={
                  <button
                    type="button"
                    onClick={() =>
                      openRoute(
                        "payments",
                      )
                    }
                  >
                    Payments
                  </button>
                }
              >
                <StatisticGrid>
                  <StatisticCard
                    label="Paid value"
                    value={money(
                      summary.paidAmount,
                      summary.currency,
                    )}
                  />

                  <StatisticCard
                    label="Paid"
                    value={
                      summary.successfulPayments
                    }
                  />

                  <StatisticCard
                    label="Unpaid invoices"
                    value={
                      summary.unpaidInvoices
                    }
                  />

                  <StatisticCard
                    label="Failed"
                    value={
                      summary.failedPayments
                    }
                  />
                </StatisticGrid>
              </DashboardSection>
            </DashboardWidget>

            <DashboardWidget>
              <DashboardSection
                eyebrow="Support"
                title="Customer requests"
                action={
                  <b>
                    {
                      summary.openFeedback
                    }
                  </b>
                }
              >
                <ActivityFeed
                  items={recentFeedback.map(
                    (item, index) => ({
                      id:
                        idOf(item) ||
                        String(index),
                      title:
                        text(
                          item.subject,
                          "Support request",
                        ),
                      meta:
                        `${text(
                          item.type,
                          "feedback",
                        ).replaceAll(
                          "_",
                          " ",
                        )} · ${text(
                          item.status,
                          "submitted",
                        ).replaceAll(
                          "_",
                          " ",
                        )} · ${dateLabel(
                          item.lastMessageAt ??
                            item.submittedAt,
                        )}`,
                      icon: "🎫",
                    }),
                  )}
                  emptyText="No customer support requests are available."
                />
              </DashboardSection>
            </DashboardWidget>

            <DashboardWidget>
              <DashboardSection
                eyebrow="Operations"
                title="System health"
                action={
                  <button
                    type="button"
                    onClick={() =>
                      openRoute(
                        "systemHealth",
                      )
                    }
                  >
                    Open
                  </button>
                }
              >
                <StatisticGrid>
                  <StatisticCard
                    label="Health"
                    value={
                      summary.platformHealth
                    }
                  />

                  <StatisticCard
                    label="Sync conflicts"
                    value={
                      summary.openConflicts
                    }
                  />

                  <StatisticCard
                    label="Failed jobs"
                    value={
                      summary.failedJobs
                    }
                  />

                  <StatisticCard
                    label="Webhook fails"
                    value={
                      summary.failedWebhookLogs
                    }
                  />
                </StatisticGrid>
              </DashboardSection>
            </DashboardWidget>

            <DashboardWidget>
              <DashboardSection
                eyebrow="Product"
                title="Releases"
                action={
                  <button
                    type="button"
                    onClick={() =>
                      openRoute(
                        "releases",
                      )
                    }
                  >
                    Manage
                  </button>
                }
              >
                <ActivityFeed
                  items={recentReleases.map(
                    (item, index) => ({
                      id:
                        idOf(item) ||
                        String(index),
                      title:
                        `${text(
                          item.version,
                          "Version",
                        )} · ${text(
                          item.title,
                          "Platform release",
                        )}`,
                      meta:
                        `${text(
                          item.channel,
                          "stable",
                        )} · ${text(
                          item.status,
                          "draft",
                        )} · ${dateLabel(
                          item.publishedAt ??
                            item.updatedAt ??
                            item.createdAt,
                        )}`,
                      icon: "🚀",
                      onClick: () =>
                        openRoute(
                          "releases",
                        ),
                    }),
                  )}
                  emptyText="No platform releases are available."
                />
              </DashboardSection>
            </DashboardWidget>

            <DashboardWidget>
              <DashboardSection
                eyebrow="Billing activity"
                title="Latest transactions"
                action={
                  <button
                    type="button"
                    onClick={() =>
                      openRoute(
                        "invoices",
                      )
                    }
                  >
                    Billing
                  </button>
                }
              >
                <ActivityFeed
                  items={recentBilling.map(
                    (item, index) => ({
                      id:
                        `${item._kind}-${idOf(
                          item,
                        ) || index}`,
                      title:
                        item._title,
                      meta:
                        `${item._kind} · ${text(
                          item.status,
                          "pending",
                        )} · ${dateLabel(
                          item._date,
                        )}`,
                      icon:
                        item._icon,
                    }),
                  )}
                  emptyText="No recent billing activity is available."
                />
              </DashboardSection>
            </DashboardWidget>

            <DashboardWidget>
              <DashboardSection
                eyebrow="Infrastructure"
                title="Platform footprint"
                action={
                  <button
                    type="button"
                    onClick={() =>
                      openRoute(
                        "databaseTools",
                      )
                    }
                  >
                    Database
                  </button>
                }
              >
                <StatisticGrid>
                  <StatisticCard
                    label="Cached tables"
                    value={
                      summary.cachedTables
                    }
                  />

                  <StatisticCard
                    label="Cached records"
                    value={
                      summary.cachedRecords
                    }
                  />

                  <StatisticCard
                    label="Sync devices"
                    value={
                      summary.syncDevices
                    }
                  />

                  <StatisticCard
                    label="Storage MB"
                    value={
                      summary.storageUsedMb
                    }
                  />
                </StatisticGrid>
              </DashboardSection>
            </DashboardWidget>

            <DashboardWidget>
              <DashboardSection
                eyebrow="Latest changes"
                title="Recent platform activity"
                action={
                  <b>
                    {
                      recentActivity.length
                    }
                  </b>
                }
              >
                <ActivityFeed
                  items={recentActivity.map(
                    (item, index) => ({
                      id:
                        `${item._kind}-${idOf(
                          item,
                        ) || index}`,
                      title:
                        item._title,
                      meta:
                        `${item._kind} · ${dateLabel(
                          item._date,
                        )}`,
                      icon:
                        item._icon,
                    }),
                  )}
                  emptyText="Platform activity will appear here."
                />
              </DashboardSection>
            </DashboardWidget>
          </DashboardWidgets>

          <DashboardSection
            eyebrow="Developer modules"
            title="Platform workspace"
            action={
              <b>{modules.length}</b>
            }
          >
            <div className="developer-module-grid">
              {modules.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={`developer-module-card ${item.tone}`}
                  onClick={() =>
                    openRoute(
                      item.routeKey,
                    )
                  }
                >
                  <span className="developer-module-icon">
                    {item.icon}
                  </span>

                  <span className="developer-module-copy">
                    <strong>
                      {item.label}
                    </strong>
                    <small>
                      {item.note}
                    </small>
                    <em>
                      {areaLabel(
                        item.area,
                      )}
                    </em>
                  </span>

                  <b>
                    {item.value}
                  </b>
                </button>
              ))}
            </div>
          </DashboardSection>
        </>
      )}

      <Dialog
        open={moreOpen}
        onClose={() =>
          setMoreOpen(false)
        }
        title="Developer home"
        description="Useful platform controls and direct destinations."
        footer={
          <Button
            variant="secondary"
            fullWidth
            onClick={() =>
              setMoreOpen(false)
            }
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
              openRoute(
                "accounts",
              );
            }}
          >
            Customer accounts
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setMoreOpen(false);
              openRoute(
                "databaseTools",
              );
            }}
          >
            Database health
          </Button>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setMoreOpen(false);
              openRoute(
                "settings",
              );
            }}
          >
            Developer settings
          </Button>
        </div>
      </Dialog>
    </DashboardBackground>
  );
}

const developerDashboardCss = `
/* Compact toolbar --------------------------------------------------------- */
.developer-dashboard-toolbar {
  width: 100%;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: visible;
}

.developer-dashboard-toolbar
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

.developer-dashboard-toolbar
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

.developer-dashboard-toolbar
.eds-dashboard-header
input::placeholder {
  color:
    var(
      --eds-text-muted,
      #667085
    ) !important;

  opacity: .9;
}

.developer-dashboard-toolbar
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

.developer-dashboard-toolbar
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

/* Navigation-driven module cards ---------------------------------------- */
.developer-module-grid {
  display: grid;
  grid-template-columns:
    repeat(
      auto-fit,
      minmax(230px, 1fr)
    );
  gap: 9px;
}

.developer-module-card {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns:
    auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 12px;

  border: 1px solid
    var(
      --eds-border,
      rgba(15,23,42,.09)
    );

  border-radius: 16px;

  background:
    var(
      --eds-surface,
      #ffffff
    );

  color:
    var(
      --eds-text,
      #111827
    );

  text-align: left;
  cursor: pointer;
}

.developer-module-card:hover {
  border-color:
    color-mix(
      in srgb,
      var(
        --eds-primary,
        var(--primary-color, #2563eb)
      ) 38%,
      var(
        --eds-border,
        rgba(15,23,42,.09)
      )
    );

  transform: translateY(-1px);
}

.developer-module-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;

  border-radius: 12px;

  background:
    var(
      --eds-primary-softer,
      color-mix(
        in srgb,
        var(--primary-color, #2563eb) 8%,
        transparent
      )
    );

  font-size: 18px;
}

.developer-module-copy {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.developer-module-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.developer-module-copy small {
  display: -webkit-box;
  overflow: hidden;
  color:
    var(
      --eds-text-muted,
      #667085
    );
  font-size: 10px;
  line-height: 1.35;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.developer-module-copy em {
  margin-top: 2px;
  color:
    var(
      --eds-text-muted,
      #667085
    );
  font-size: 9px;
  font-style: normal;
  font-weight: 800;
  text-transform: uppercase;
}

.developer-module-card > b {
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.developer-module-card.green
.developer-module-icon {
  background:
    color-mix(
      in srgb,
      #16a34a 10%,
      transparent
    );
}

.developer-module-card.orange
.developer-module-icon {
  background:
    color-mix(
      in srgb,
      #f59e0b 12%,
      transparent
    );
}

.developer-module-card.red
.developer-module-icon {
  background:
    color-mix(
      in srgb,
      #dc2626 10%,
      transparent
    );
}

.developer-module-card.purple
.developer-module-icon {
  background:
    color-mix(
      in srgb,
      #7c3aed 10%,
      transparent
    );
}

/* Single-window scrolling ------------------------------------------------ */
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
  .developer-dashboard-toolbar
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

@media (
  min-width: 700px
) and (
  max-width: 1099px
) {
  .developer-dashboard-toolbar
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
  .developer-dashboard-toolbar {
    justify-content: stretch;
  }

  .developer-dashboard-toolbar
  .eds-dashboard-header {
    width: 100%;
    max-width: none;
    flex-basis: 100%;
  }

  .developer-module-grid {
    grid-template-columns: 1fr;
  }
}
`;
