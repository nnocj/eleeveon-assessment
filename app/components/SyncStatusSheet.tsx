"use client";

/**
 * app/components/SyncStatusSheet.tsx
 * --------------------------------------------------------------------------
 * User-facing system status, recovery, and refresh panel.
 */

import {
  useState,
} from "react";

import {
  useSystemStatus,
} from "../hooks/useSystemStatus";

import {
  useSyncContext,
} from "../context/sync-context";

import SyncStatusStrip from "./SyncStatusStrip";

function formatTime(
  value?: number | null,
) {
  if (!value) return "Never";

  return new Date(
    value,
  ).toLocaleString(
    "en-GH",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function StatusRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?:
    | "neutral"
    | "good"
    | "warning"
    | "danger";
}) {
  return (
    <div className="system-status-row">
      <span>
        {label}
      </span>
      <strong
        data-tone={tone}
      >
        {value}
      </strong>
    </div>
  );
}

export default function SyncStatusSheet() {
  const [
    breakdownMode,
    setBreakdownMode,
  ] = useState<
    "pending" | "failed" | null
  >(null);

  const {
    statusSheetOpen,
    closeStatusSheet,
  } = useSyncContext();

  const {
    status,
    actionState,
    actions,
  } = useSystemStatus();

  if (!statusSheetOpen) {
    return null;
  }

  const busy =
    Boolean(
      actionState.activeAction,
    );

  const actionItems = [
    {
      key: "refresh-data",
      label: "Refresh data",
      note: "Push and pull now",
      action:
        actions.refreshData,
    },
    {
      key: "refresh-app",
      label: "Refresh application",
      note: "Reload this page and restart Eleeveon",
      action: async () => {
        closeStatusSheet();

        await new Promise<void>(
          (resolve) => {
            window.setTimeout(
              resolve,
              150,
            );
          },
        );

        if (
          "serviceWorker" in navigator
        ) {
          try {
            const registrations =
              await navigator
                .serviceWorker
                .getRegistrations();

            await Promise.all(
              registrations.map(
                (registration) =>
                  registration.update(),
              ),
            );
          } catch (error) {
            console.warn(
              "[system status] service-worker refresh check failed",
              error,
            );
          }
        }

        window.location.reload();
      },
    },
    {
      key: "retry-failed",
      label:
        "Retry failed records",
      note:
        `${status.failedChanges} currently failed`,
      action:
        actions.retryFailedRecords,
    },
    {
      key: "reconnect-live",
      label:
        "Reconnect live updates",
      note:
        status.realtimeStatus,
      action:
        actions.reconnectRealtime,
    },
    {
      key: "check-update",
      label:
        "Check for app update",
      note:
        status.updateAvailable
          ? "Update detected"
          : status
              .applicationVersion
              .appVersion,
      action:
        actions.checkForAppUpdate,
    },
    {
      key: "export-backup",
      label:
        "Export offline backup",
      note:
        "Save local account data",
      action:
        actions.exportOfflineBackup,
    },
    {
      key: "repair-media",
      label:
        "Repair media records",
      note:
        "Check mixed or orphaned media",
      action:
        actions.repairMediaRecords,
    },
    {
      key: "remove-offline",
      label:
        "Remove offline account data",
      note:
        "Separate from logout",
      action: () => {
        closeStatusSheet();
        actions.openOfflineRemoval();
      },
      danger: true,
    },
  ];

  return (
    <div
      className="system-status-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          closeStatusSheet();
        }
      }}
    >
      <style>{css}</style>

      <aside
        className="system-status-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-status-title"
      >
        <header>
          <div>
            <span>
              System status
            </span>
            <h2
              id="system-status-title"
            >
              Data, connection and device
            </h2>
          </div>

          <button
            type="button"
            className="system-close"
            onClick={
              closeStatusSheet
            }
            aria-label="Close system status"
          >
            ✕
          </button>
        </header>

        <section className="system-status-summary">
          <SyncStatusStrip />
        </section>

        <section className="system-status-grid">
          <StatusRow
            label="Connection"
            value={
              status.online
                ? "Online"
                : "Offline"
            }
            tone={
              status.online
                ? "good"
                : "warning"
            }
          />

          <StatusRow
            label="Live updates"
            value={
              status
                .realtimeConnected
                ? "Connected"
                : status
                    .realtimeStatus
            }
            tone={
              status
                .realtimeConnected
                ? "good"
                : "warning"
            }
          />

          <StatusRow
            label="Last successful push"
            value={formatTime(
              status
                .lastSuccessfulPush,
            )}
          />

          <StatusRow
            label="Last successful pull"
            value={formatTime(
              status
                .lastSuccessfulPull,
            )}
          />

          <button
            type="button"
            className="system-status-click-row"
            onClick={() =>
              setBreakdownMode(
                breakdownMode ===
                  "pending"
                  ? null
                  : "pending",
              )
            }
          >
            <StatusRow
              label="Pending changes"
              value={
                status.pendingChanges
              }
              tone={
                status.pendingChanges
                  ? "warning"
                  : "good"
              }
            />
            <span>
              {breakdownMode ===
              "pending"
                ? "−"
                : "›"}
            </span>
          </button>

          <button
            type="button"
            className="system-status-click-row"
            onClick={() =>
              setBreakdownMode(
                breakdownMode ===
                  "failed"
                  ? null
                  : "failed",
              )
            }
          >
            <StatusRow
              label="Failed changes"
              value={
                status.failedChanges
              }
              tone={
                status.failedChanges
                  ? "danger"
                  : "good"
              }
            />
            <span>
              {breakdownMode ===
              "failed"
                ? "−"
                : "›"}
            </span>
          </button>

          <StatusRow
            label="Database version"
            value={`${
              status.databaseVersion ??
              "—"
            } / ${
              status.targetDatabaseVersion
            }`}
            tone={
              status.databaseVersion ===
              status.targetDatabaseVersion
                ? "good"
                : "warning"
            }
          />

          <StatusRow
            label="Application version"
            value={
              status
                .applicationVersion
                .appVersion
            }
          />

          <StatusRow
            label="Application update"
            value={
              status.updateAvailable
                ? "Available"
                : "Up to date"
            }
            tone={
              status.updateAvailable
                ? "warning"
                : "good"
            }
          />

          <StatusRow
            label="Current account"
            value={
              status.currentAccountName ||
              status.currentAccountId ||
              "None"
            }
          />

          <StatusRow
            label="Current branch"
            value={
              status.currentBranchName ||
              "None"
            }
          />
        </section>

        {breakdownMode ? (
          <section className="system-table-breakdown">
            <header>
              <div>
                <span>
                  {breakdownMode ===
                  "pending"
                    ? "Pending records"
                    : "Failed records"}
                </span>
                <strong>
                  Table breakdown
                </strong>
              </div>
              <button
                type="button"
                onClick={() =>
                  setBreakdownMode(null)
                }
              >
                Close
              </button>
            </header>

            <div>
              {status.tableBreakdown
                .filter((item) =>
                  breakdownMode ===
                  "pending"
                    ? item.pending > 0
                    : item.failed > 0,
                )
                .map((item) => (
                  <article
                    key={item.tableName}
                  >
                    <strong>
                      {item.tableName}
                    </strong>
                    <span>
                      {breakdownMode ===
                      "pending"
                        ? `${item.pending} pending`
                        : `${item.failed} failed`}
                    </span>
                    <small>
                      {item.total} local
                      record
                      {item.total === 1
                        ? ""
                        : "s"}
                    </small>
                  </article>
                ))}

              {!status.tableBreakdown.some(
                (item) =>
                  breakdownMode ===
                  "pending"
                    ? item.pending > 0
                    : item.failed > 0,
              ) ? (
                <p>
                  No matching table
                  records were found.
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {status.lastSyncError && (
          <div className="system-error">
            <strong>
              Sync needs attention
            </strong>
            <span>
              {
                status.lastSyncError
              }
            </span>
          </div>
        )}

        {actionState.actionError && (
          <div className="system-error">
            {
              actionState.actionError
            }
          </div>
        )}

        {actionState.actionMessage && (
          <div className="system-success">
            {
              actionState.actionMessage
            }
          </div>
        )}

        <section className="system-actions">
          <div className="system-section-title">
            Actions
          </div>

          {actionItems.map(
            (item) => (
              <button
                key={item.key}
                type="button"
                className={
                  item.danger
                    ? "danger"
                    : ""
                }
                disabled={
                  busy &&
                  actionState
                    .activeAction !==
                    item.key
                }
                onClick={() => {
                  void item.action();
                }}
              >
                <span>
                  <strong>
                    {
                      actionState
                        .activeAction ===
                      item.key
                        ? "Working…"
                        : item.label
                    }
                  </strong>
                  <small>
                    {item.note}
                  </small>
                </span>
                <b>›</b>
              </button>
            ),
          )}
        </section>
      </aside>
    </div>
  );
}

const css = `
.system-status-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  justify-content: flex-end;
  background: rgba(15,23,42,.48);
  backdrop-filter: blur(4px);
}

.system-status-sheet {
  width: min(430px, 100%);
  height: 100%;
  overflow: auto;
  padding: 18px;
  background: var(--surface, #fff);
  color: var(--text, #111827);
  box-shadow: -18px 0 55px rgba(15,23,42,.18);
}

.system-status-sheet header {
  position: sticky;
  top: -18px;
  z-index: 2;
  margin: -18px -18px 16px;
  padding: 18px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--border, rgba(0,0,0,.09));
  background: var(--surface, #fff);
}

.system-status-sheet header span,
.system-section-title {
  color: var(--muted, #64748b);
  font-size: 11px;
  font-weight: 950;
  letter-spacing: .06em;
  text-transform: uppercase;
}

.system-status-sheet h2 {
  margin: 4px 0 0;
  font-size: 19px;
}

.system-close {
  width: 38px;
  height: 38px;
  border: 1px solid var(--border, rgba(0,0,0,.10));
  border-radius: 12px;
  background: var(--surface, #fff);
  color: inherit;
  cursor: pointer;
}

.system-status-summary {
  margin-bottom: 14px;
}

.system-status-summary .sync-strip {
  box-shadow: none;
  background: var(--bg, #f8fafc);
}

.system-status-grid {
  display: grid;
  gap: 6px;
}


.system-status-click-row {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns:
    minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.system-status-click-row >
.system-status-row {
  width: 100%;
}

.system-status-click-row >
span {
  color:
    var(--muted, #64748b);
  font-size: 20px;
  font-weight: 900;
}

.system-table-breakdown {
  margin-top: 12px;
  border: 1px solid
    var(--border, rgba(0,0,0,.1));
  border-radius: 18px;
  padding: 11px;
  background:
    color-mix(
      in srgb,
      var(--muted, #64748b)
      5%,
      var(--surface, #fff)
    );
}

.system-table-breakdown > header {
  display: flex;
  align-items: center;
  justify-content:
    space-between;
  gap: 10px;
  padding: 0 0 9px;
}

.system-table-breakdown > header span,
.system-table-breakdown > header strong {
  display: block;
}

.system-table-breakdown > header span {
  color:
    var(
      --primary-color,
      #2563eb
    );
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .07em;
}

.system-table-breakdown > header button {
  border: 1px solid
    var(--border, rgba(0,0,0,.1));
  border-radius: 10px;
  background: transparent;
  color: inherit;
  padding: 7px 9px;
}

.system-table-breakdown > div {
  display: grid;
  gap: 6px;
}

.system-table-breakdown article {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr) auto;
  gap: 3px 10px;
  padding: 9px;
  border-radius: 12px;
  background:
    var(--surface, #fff);
}

.system-table-breakdown article strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.system-table-breakdown article span {
  font-weight: 900;
}

.system-table-breakdown article small {
  grid-column: 1 / -1;
  color:
    var(--muted, #64748b);
}

.system-status-row {
  min-height: 42px;
  padding: 9px 11px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 13px;
  background: var(--bg, #f8fafc);
}

.system-status-row span {
  color: var(--muted, #64748b);
  font-size: 12px;
  font-weight: 800;
}

.system-status-row strong {
  max-width: 58%;
  text-align: right;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.system-status-row strong[data-tone="good"] {
  color: #15803d;
}

.system-status-row strong[data-tone="warning"] {
  color: #b45309;
}

.system-status-row strong[data-tone="danger"] {
  color: #dc2626;
}

.system-error,
.system-success {
  margin-top: 12px;
  padding: 11px 12px;
  display: grid;
  gap: 3px;
  border-radius: 13px;
  font-size: 12px;
  line-height: 1.45;
}

.system-error {
  color: #b91c1c;
  background: rgba(220,38,38,.08);
}

.system-success {
  color: #166534;
  background: rgba(22,163,74,.08);
}

.system-actions {
  margin-top: 18px;
  display: grid;
  gap: 7px;
}

.system-section-title {
  margin-bottom: 2px;
}

.system-actions button {
  width: 100%;
  min-height: 54px;
  border: 1px solid var(--border, rgba(0,0,0,.09));
  border-radius: 15px;
  padding: 9px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  background: var(--surface, #fff);
  color: inherit;
  cursor: pointer;
}

.system-actions button:hover {
  background: var(--bg, #f8fafc);
}

.system-actions button.danger {
  color: #dc2626;
  border-color: rgba(220,38,38,.24);
  background: rgba(220,38,38,.04);
}

.system-actions button:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.system-actions button span {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.system-actions button strong {
  font-size: 13px;
}

.system-actions button small {
  color: var(--muted, #64748b);
  font-size: 11px;
}

.system-actions button > b {
  font-size: 20px;
  color: var(--muted, #64748b);
}
`;