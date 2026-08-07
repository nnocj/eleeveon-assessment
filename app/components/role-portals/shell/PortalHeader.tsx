"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useWindowChrome,
} from "../../../context/window-chrome-context";

export interface PortalHeaderProps {
  activeLabel: string;
  workspaceLabel: string;

  memberName: string;
  memberRole: string;
  memberImage?: string | null;
  memberMeta: string;

  online: boolean;
  realtimeConnected: boolean;
  initialSyncDone: boolean;
  realtimeStatus: string;

  sidebarHidden: boolean;

  onToggleSidebar(): void;
  onOpenStatus(): void;
  onOpenAccount(): void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0] ?? "",
    )
    .join("")
    .toUpperCase();
}

function HeaderAvatar({
  image,
  name,
}: {
  image?: string | null;
  name: string;
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  return (
    <span className="header-account-avatar">
      {image && !failed ? (
        <img
          src={image}
          alt=""
          onError={() =>
            setFailed(true)
          }
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export default function PortalHeader({
  activeLabel,
  workspaceLabel,

  memberName,
  memberRole,
  memberImage,
  memberMeta,

  online,
  realtimeConnected,
  initialSyncDone,
  realtimeStatus,

  onToggleSidebar,
  onOpenStatus,
  onOpenAccount,
}: PortalHeaderProps) {
  const {
    overlayVisible,
  } = useWindowChrome();

  /*
   * Installed desktop overlay mode has exactly one top bar:
   * WindowTitleBar. The portal header is only a normal browser/mobile
   * fallback and must not consume any height while the overlay is active.
   */
  if (overlayVisible) {
    return null;
  }

  const statusClass = !online
    ? "warn"
    : realtimeConnected
      ? "live"
      : initialSyncDone
        ? "ok"
        : "warn";

  const statusTitle = !online
    ? "Offline — using local data"
    : realtimeConnected
      ? "Live updates connected"
      : initialSyncDone
        ? `Synced — realtime ${realtimeStatus}`
        : "Sync needs attention";

  return (
    <header
      className="app-header eds-header-surface eds-glass-subtle"
      data-window-overlay="fallback"
    >
      <button
        className="icon-btn primary"
        onClick={
          onToggleSidebar
        }
        type="button"
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      <div className="header-title">
        <strong>
          {activeLabel}
        </strong>
        <span>
          {workspaceLabel}
        </span>
      </div>

      <button
        type="button"
        className={`sync-dot-btn header-status ${statusClass}`}
        onClick={onOpenStatus}
        aria-label="Open system status"
        title={statusTitle}
      >
        <span />
      </button>

      <button
        type="button"
        className="header-account-button"
        onClick={onOpenAccount}
        aria-label="Open account and workspace menu"
        title={memberMeta}
      >
        <HeaderAvatar
          image={memberImage}
          name={memberName}
        />

        <span className="header-account-copy">
          <strong>
            {memberName}
          </strong>
          <small>
            {memberRole}
          </small>
        </span>
      </button>
    </header>
  );
}
