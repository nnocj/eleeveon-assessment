"use client";

import {
  Avatar,
  StatusIndicator,
} from "../../ui";

export interface SidebarProfileProps {
  name: string;
  role: string;
  image?: string | null;
  online?: boolean;
  onOpenAccount?(): void;
}

export default function SidebarProfile({
  name,
  role,
  image,
  online = true,
  onOpenAccount,
}: SidebarProfileProps) {
  return (
    <button
      type="button"
      className="shell-sidebar-profile"
      onClick={onOpenAccount}
      disabled={!onOpenAccount}
    >
      <Avatar
        src={image}
        name={name}
        size="md"
      />

      <span className="shell-sidebar-profile-copy">
        <strong>{name}</strong>
        <small>{role}</small>
      </span>

      <StatusIndicator
        tone={
          online
            ? "success"
            : "warning"
        }
        aria-label={
          online
            ? "Online"
            : "Offline"
        }
      />
    </button>
  );
}
