/**
 * Eleeveon Schools entitlement-aware single-flight synchronization runner.
 */

import { pullSync } from "./pullSync";
import { pushSync } from "./pushSync";

import {
  assertAccountId,
  getAccountId,
  getDeviceId,
  isOnline,
  setBootstrapCompleted,
  setLastSyncError,
  setLastSyncOkAt,
  type SyncResult,
} from "./syncConfig";

import {
  acquireSyncLock,
  releaseSyncLock,
} from "./syncStorage";

import {
  refreshPlatformCache,
} from "./platformCache";
import {
  registerSyncDevice,
} from "./syncDevices";

import {
  createSyncExecutionPlan,
  syncModeLabel,
  type EffectiveSyncMode,
} from "./syncPolicy";
import {
  resolveSyncPolicy,
} from "./resolveSyncPolicy";
import { assertSyncRegistryMatchesDatabase } from "./syncRegistryAudit";
import { repairPendingSyncRecords } from "./pendingRecordRepair";

export type SyncTrigger =
  | "startup"
  | "login"
  | "role-selection"
  | "online"
  | "focus"
  | "visibility"
  | "timer"
  | "manual"
  | "backend-notification"
  | "local-write"
  | "unknown";

export type RunSyncOptions = {
  includePlatformCache?: boolean;
  pullLimit?: number;
  pullTableNames?: string[];
  trigger?: SyncTrigger;

  /**
   * Developer-only/manual diagnostics may force a policy refresh.
   */
  refreshPolicy?: boolean;

  /** Safely repairs legacy sync metadata before push. Defaults to true. */
  repairPendingRecords?: boolean;
};

export type SyncListener = (
  result: SyncResult | null,
  syncing: boolean,
) => void;

let activeSyncPromise:
  | Promise<SyncResult>
  | null = null;
let activeAccountId: string | null = null;
let activeOptions: RunSyncOptions | null = null;
let activeMode: EffectiveSyncMode | null =
  null;
let lastResult: SyncResult | null = null;

const listeners = new Set<SyncListener>();
let registryAudited = false;

function emit() {
  const syncing = Boolean(activeSyncPromise);

  for (const listener of listeners) {
    try {
      listener(lastResult, syncing);
    } catch (error) {
      console.error(
        "[sync] listener failed",
        error,
      );
    }
  }
}

function result(
  input: {
    ok: boolean;
    pushed?: number;
    pulled?: number;
    errors?: string[];
    startedAt: number;
  },
): SyncResult {
  return {
    ok: input.ok,
    pushed: input.pushed ?? 0,
    pulled: input.pulled ?? 0,
    errors: input.errors ?? [],
    startedAt: input.startedAt,
    finishedAt: Date.now(),
  };
}

export function isSyncRunning() {
  return Boolean(activeSyncPromise);
}

export function getActiveSyncPromise() {
  return activeSyncPromise;
}

export function getSyncingAccountId() {
  return activeAccountId;
}

export function getActiveSyncOptions() {
  return activeOptions;
}

export function getActiveSyncMode() {
  return activeMode;
}

export function getLastSyncResult() {
  return lastResult;
}

export function subscribeToSync(
  listener: SyncListener,
) {
  listeners.add(listener);
  listener(
    lastResult,
    Boolean(activeSyncPromise),
  );

  return () => {
    listeners.delete(listener);
  };
}

export function runSync(
  options: RunSyncOptions = {},
): Promise<SyncResult> {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeOptions = { ...options };

  activeSyncPromise = performSync(
    activeOptions,
  ).finally(() => {
    activeSyncPromise = null;
    activeAccountId = null;
    activeOptions = null;
    activeMode = null;
    emit();
  });

  emit();
  return activeSyncPromise;
}

async function performSync(
  options: RunSyncOptions,
): Promise<SyncResult> {
  const startedAt = Date.now();

  if (!registryAudited) {
    assertSyncRegistryMatchesDatabase();
    registryAudited = true;
  }

  let accountId: string;

  try {
    accountId = assertAccountId();
  } catch (error) {
    lastResult = result({
      ok: false,
      errors: [
        error instanceof Error
          ? error.message
          : String(error),
      ],
      startedAt,
    });
    return lastResult;
  }

  activeAccountId = accountId;
  emit();

  const online = isOnline();

  const policy = await resolveSyncPolicy(
    accountId,
    {
      forceRefresh:
        options.refreshPolicy === true,
      online,
    },
  );

  activeMode = policy.mode;
  emit();

  const plan = createSyncExecutionPlan(
    policy,
    options,
  );

  /**
   * Offline mode is a successful no-op for school data. Local work remains in
   * Dexie and can be backed up/exported without pretending that cloud sync ran.
   */
  if (policy.mode === "offline") {
    if (
      online &&
      plan.shouldRefreshPlatformCache
    ) {
      const cache =
        await refreshPlatformCache({
          silent: true,
        });

      lastResult = result({
        ok: cache.errors.length === 0,
        errors: cache.errors,
        startedAt,
      });
    } else {
      lastResult = result({
        ok: true,
        errors: [],
        startedAt,
      });
    }

    setLastSyncError(null);
    return lastResult;
  }

  if (!online) {
    lastResult = result({
      ok: false,
      errors: [
        `${syncModeLabel(
          policy.mode,
        )} requires an internet connection.`,
      ],
      startedAt,
    });

    setLastSyncError(
      lastResult.errors[0],
    );
    return lastResult;
  }

  const lockOwner = [
    getDeviceId(),
    startedAt,
    Math.random()
      .toString(36)
      .slice(2, 9),
  ].join(":");

  if (
    !acquireSyncLock({
      accountId,
      owner: lockOwner,
    })
  ) {
    lastResult = result({
      ok: false,
      errors: [
        "This account is already syncing in another Eleeveon tab.",
      ],
      startedAt,
    });
    return lastResult;
  }

  try {
    if (plan.shouldRegisterDevice) {
      await registerSyncDevice({
        silent: true,
      }).catch(() => undefined);
    }

    assertAccountUnchanged(
      accountId,
      "before synchronization started",
    );

    if (
      plan.shouldPush &&
      options.repairPendingRecords !== false
    ) {
      const repair =
        await repairPendingSyncRecords();

      if (repair.errors.length) {
        console.warn(
          "[sync] some pending records could not be repaired automatically",
          repair,
        );
      }
    }

    const push = plan.shouldPush
      ? await pushSync({ accountId })
      : {
          pushed: 0,
          errors: [] as string[],
        };

    assertAccountUnchanged(
      accountId,
      "before pull synchronization",
    );

    const pull = plan.shouldPull
      ? await pullSync({
          accountId,
          limit: options.pullLimit,
          tableNames:
            options.pullTableNames,
        })
      : {
          pulled: 0,
          errors: [] as string[],
          cacheUpdated: 0,
        };

    const cacheErrors: string[] = [];

    if (
      plan.shouldRefreshPlatformCache
    ) {
      assertAccountUnchanged(
        accountId,
        "before platform cache refresh",
      );

      const cache =
        await refreshPlatformCache({
          silent: true,
        });

      cacheErrors.push(...cache.errors);
    }

    const errors = [
      ...(push.errors ?? []),
      ...(pull.errors ?? []),
      ...cacheErrors,
    ];

    lastResult = result({
      ok: errors.length === 0,
      pushed: push.pushed,
      pulled: pull.pulled,
      errors,
      startedAt,
    });

    if (lastResult.ok) {
      setLastSyncOkAt(Date.now());
      setLastSyncError(null);
      setBootstrapCompleted(true);
    } else {
      setLastSyncError(
        errors.join("; "),
      );
    }

    return lastResult;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    lastResult = result({
      ok: false,
      errors: [message],
      startedAt,
    });

    setLastSyncError(message);
    return lastResult;
  } finally {
    releaseSyncLock(
      accountId,
      lockOwner,
    );
  }
}

function assertAccountUnchanged(
  expectedAccountId: string,
  stage: string,
) {
  const currentAccountId =
    getAccountId();

  if (
    !currentAccountId ||
    currentAccountId !==
      expectedAccountId
  ) {
    throw new Error(
      `The active account changed ${stage}. Synchronization was cancelled.`,
    );
  }
}
