"use client";

export interface SidebarIndicatorProps {
  count?: number;
  attention?: boolean;
  label?: string;
}

export default function SidebarIndicator({
  count = 0,
  attention = false,
  label,
}: SidebarIndicatorProps) {
  if (count > 0) {
    return (
      <span
        className="shell-indicator shell-indicator-count"
        aria-label={label || `${count} unread items`}
      >
        {count > 99 ? "99+" : count}
      </span>
    );
  }

  if (attention) {
    return (
      <span
        className="shell-indicator shell-indicator-dot"
        aria-label={label || "Needs attention"}
      />
    );
  }

  return null;
}
