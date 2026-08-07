"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useWindowChrome,
} from "../../context/window-chrome-context";

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

function WindowAvatar({
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
    <span className="window-titlebar-avatar">
      {image && !failed ? (
        <img
          src={image}
          alt=""
          onError={() =>
            setFailed(true)
          }
        />
      ) : (
        initials(
          name || "Eleeveon",
        ) || "E"
      )}
    </span>
  );
}

export default function WindowTitleBar() {
  const {
    identity,
    overlayVisible,
  } = useWindowChrome();

  if (!overlayVisible) {
    return null;
  }

  const statusClass = !identity.online
    ? "warn"
    : identity.realtimeConnected
      ? "live"
      : identity.initialSyncDone
        ? "ok"
        : "warn";

  const statusTitle = !identity.online
    ? "Offline — using local data"
    : identity.realtimeConnected
      ? "Live updates connected"
      : identity.initialSyncDone
        ? `Synced — realtime ${identity.realtimeStatus}`
        : "Sync needs attention";

  return (
    <header
      className="window-titlebar eds-header-surface"
      aria-label="Eleeveon application title bar"
    >
      <div className="window-titlebar-left">
        <button
          type="button"
          className="window-titlebar-control window-titlebar-sidebar"
          onClick={() =>
            identity
              .onToggleSidebar?.()
          }
          disabled={
            !identity
              .onToggleSidebar
          }
          aria-label={
            identity.sidebarHidden
              ? "Show sidebar"
              : "Toggle sidebar"
          }
          title={
            identity.sidebarHidden
              ? "Show sidebar"
              : "Toggle sidebar"
          }
        >
          ☰
        </button>

        <div className="window-drag-region">
          <span className="window-titlebar-copy">
            <strong>
              {identity.title ||
                "Eleeveon"}
            </strong>

            <small>
              {identity.workspace ||
                "School Management"}
            </small>
          </span>
        </div>
      </div>

      <div className="window-titlebar-actions">
        <button
          type="button"
          className={[
            "window-titlebar-control",
            "window-titlebar-status",
            statusClass,
          ].join(" ")}
          onClick={() =>
            identity
              .onOpenStatus?.()
          }
          disabled={
            !identity.onOpenStatus
          }
          aria-label="Open system status"
          title={statusTitle}
        >
          <span />
        </button>

        {identity.memberName ? (
          <button
            type="button"
            className="window-titlebar-account"
            onClick={() =>
              identity
                .onOpenAccount?.()
            }
            disabled={
              !identity
                .onOpenAccount
            }
            title={
              identity.memberMeta ||
              undefined
            }
            aria-label="Open account and workspace menu"
          >
            <WindowAvatar
              image={
                identity.memberImage
              }
              name={
                identity.memberName
              }
            />

            <span className="window-titlebar-account-copy">
              <strong>
                {identity.memberName}
              </strong>
              <small>
                {identity.memberRole}
              </small>
            </span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
