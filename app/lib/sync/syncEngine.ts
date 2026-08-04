/**
 * Public synchronization facade.
 */
export {
  getActiveSyncMode,
  getActiveSyncOptions,
  getActiveSyncPromise,
  getLastSyncResult,
  getSyncingAccountId,
  isSyncRunning,
  runSync,
  subscribeToSync,
} from "./runSync";

export type {
  RunSyncOptions,
  SyncListener,
  SyncTrigger,
} from "./runSync";

export {
  resolveSyncPolicy,
} from "./resolveSyncPolicy";

export {
  assertLocalMutationAllowed,
  ReadOnlyWorkspaceError,
} from "./syncMutationPolicy";

export type {
  EffectiveSyncMode,
  EffectiveSyncPolicy,
} from "./syncPolicy";

export {
  startAutoSync,
} from "./autoSync";
export type {
  AutoSyncOptions,
} from "./autoSync";

export {
  cancelScheduledSync,
  flushScheduledSync,
  getSyncSchedulerState,
  scheduleLocalWriteSync,
  scheduleSync,
  triggerLoginSync,
  triggerManualSync,
  triggerRoleSelectionSync,
  triggerSyncNow,
} from "./syncScheduler";

export type {
  ScheduleSyncOptions,
} from "./syncScheduler";

export function stopSynchronizationForLogout() {
  void import("./syncScheduler")
    .then(
      ({ cancelScheduledSync }) =>
        cancelScheduledSync(),
    )
    .catch(() => undefined);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(
        "eleeveon:stop-auto-sync",
      ),
    );
  }
}
