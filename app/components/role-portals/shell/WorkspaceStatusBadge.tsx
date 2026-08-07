"use client";

export interface WorkspaceStatusBadgeProps {
  online: boolean;
  realtimeConnected: boolean;
}

export default function WorkspaceStatusBadge({
  online,
  realtimeConnected,
}: WorkspaceStatusBadgeProps) {
  const label = !online
    ? "Offline"
    : realtimeConnected
      ? "Live"
      : "Online";

  return (
    <span
      className={`workspace-status-badge ${
        !online
          ? "warning"
          : realtimeConnected
            ? "live"
            : "online"
      }`}
    >
      <i aria-hidden="true" />
      {label}
    </span>
  );
}
