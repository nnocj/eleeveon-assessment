"use client";

import type { ReactNode } from "react";
import {
  IconButton,
  SearchBar,
} from "../ui";
import {
  SyncIcon,
  SettingsIcon,
} from "../icons";

export interface DashboardHeaderProps {
  query: string;
  onQueryChange(value: string): void;
  onClear(): void;
  onRefresh(): void;
  onMore(): void;
  placeholder?: string;
  active?: boolean;
  statusLabel?: string;
  trailing?: ReactNode;
}

export default function DashboardHeader({
  query,
  onQueryChange,
  onClear,
  onRefresh,
  onMore,
  placeholder = "Search dashboard...",
  active = true,
  statusLabel,
  trailing,
}: DashboardHeaderProps) {
  return (
    <header className="eds-dashboard-header">
      <span
        className={[
          "eds-dashboard-status",
          active && "active",
        ].filter(Boolean).join(" ")}
        title={statusLabel}
      />

      <SearchBar
        value={query}
        onChange={(event) =>
          onQueryChange(event.target.value)
        }
        onClear={onClear}
        placeholder={placeholder}
        aria-label={placeholder}
      />

      <IconButton
        icon={<SyncIcon />}
        label="Refresh dashboard"
        variant="primary"
        onClick={onRefresh}
      />

      {trailing ?? (
        <IconButton
          icon={<SettingsIcon />}
          label="More dashboard options"
          onClick={onMore}
        />
      )}
    </header>
  );
}
