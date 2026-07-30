"use client";

import type { ReactNode } from "react";
import {
  EntitySearchToolbar,
  PageToolbar,
  ViewModeToggle,
  type DataViewMode,
} from "../../shared";
import { AttendanceDatePicker } from "../shared";
import type {
  AttendanceEntryViewMode,
} from "./types";

export interface AttendanceEntryToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  date: string;
  onDateChange: (date: string) => void;
  viewMode: AttendanceEntryViewMode;
  onViewModeChange: (
    mode: AttendanceEntryViewMode,
  ) => void;
  resultCount?: number;
  filterAction?: ReactNode;
  primaryAction?: ReactNode;
  moreAction?: ReactNode;
  leading?: ReactNode;
  disabled?: boolean;
}

export function AttendanceEntryToolbar({
  query,
  onQueryChange,
  date,
  onDateChange,
  viewMode,
  onViewModeChange,
  resultCount,
  filterAction,
  primaryAction,
  moreAction,
  leading,
  disabled = false,
}: AttendanceEntryToolbarProps) {
  return (
    <PageToolbar
      leading={
        <>
          {leading}
          <AttendanceDatePicker
            value={date}
            onChange={onDateChange}
            label=""
            disabled={disabled}
          />
        </>
      }
      search={
        <EntitySearchToolbar
          value={query}
          onChange={onQueryChange}
          placeholder="Search students..."
          resultCount={resultCount}
          disabled={disabled}
        />
      }
      viewToggle={
        <ViewModeToggle
          value={viewMode}
          onChange={(mode: DataViewMode) => {
            if (mode === "cards" || mode === "table") {
              onViewModeChange(mode);
            }
          }}
          options={[
            { value: "cards", label: "Cards", icon: "▦" },
            { value: "table", label: "Table", icon: "☷" },
          ]}
        />
      }
      filterAction={filterAction}
      primaryAction={primaryAction}
      moreAction={moreAction}
    />
  );
}

export default AttendanceEntryToolbar;
