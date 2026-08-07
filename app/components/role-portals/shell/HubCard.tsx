"use client";

import {
  CommunicationIcon,
} from "../../icons";

import SidebarIndicator from "./SidebarIndicator";

export interface HubCardProps {
  unreadCount?: number;
  attention?: boolean;
  active?: boolean;
  onOpen(): void;
}

export default function HubCard({
  unreadCount = 0,
  attention = false,
  active = false,
  onOpen,
}: HubCardProps) {
  return (
    <button
      type="button"
      className={[
        "shell-hub-card",
        active && "active",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onOpen}
      aria-current={
        active
          ? "page"
          : undefined
      }
      aria-label={
        unreadCount
          ? `Open Eleeveon Hub. ${unreadCount} unread item${unreadCount === 1 ? "" : "s"}.`
          : attention
            ? "Open Eleeveon Hub. New activity needs attention."
            : "Open Eleeveon Hub."
      }
    >
      <span className="shell-hub-icon">
        <CommunicationIcon
          size="sm"
          tone="primary"
        />
      </span>

      <strong className="shell-hub-title">
        Eleeveon Hub
      </strong>

      <span className="shell-hub-indicator">
        <SidebarIndicator
          count={unreadCount}
          attention={attention}
          label={
            unreadCount
              ? `${unreadCount} unread Hub item${unreadCount === 1 ? "" : "s"}`
              : "Hub needs attention"
          }
        />
      </span>

      <span
        className="shell-hub-chevron"
        aria-hidden="true"
      >
        ›
      </span>

      <small className="shell-hub-description">
        Messages, notices and support
      </small>
    </button>
  );
}
