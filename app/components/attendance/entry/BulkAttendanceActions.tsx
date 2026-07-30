"use client";

import type {
  AttendanceStatus,
} from "../../../lib/attendance";
import {
  AttendanceStatusPicker,
} from "../shared";

export interface BulkAttendanceActionsProps {
  selectedCount: number;
  onApplyStatus: (status: AttendanceStatus) => void;
  onClearSelection?: () => void;
  disabled?: boolean;
  statusOptions?: readonly AttendanceStatus[];
}

export function BulkAttendanceActions({
  selectedCount,
  onApplyStatus,
  onClearSelection,
  disabled = false,
  statusOptions,
}: BulkAttendanceActionsProps) {
  if (selectedCount <= 0) return null;

  return (
    <div
      style={{
        position: "sticky",
        bottom: 10,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: 9,
        flexWrap: "wrap",
        width: "fit-content",
        maxWidth: "calc(100% - 20px)",
        margin: "12px auto 0",
        padding: 8,
        borderRadius: 14,
        border:
          "1px solid var(--border, rgba(15,23,42,.13))",
        background: "var(--background, #fff)",
        boxShadow: "0 12px 34px rgba(2,6,23,.18)",
      }}
    >
      <span
        style={{
          padding: "0 4px",
          fontSize: 11,
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {selectedCount} selected
      </span>

      <AttendanceStatusPicker
        value="present"
        onChange={onApplyStatus}
        options={statusOptions}
        disabled={disabled}
        compact
      />

      {onClearSelection ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onClearSelection}
          style={{
            minHeight: 30,
            padding: "0 8px",
            borderRadius: 8,
            border: 0,
            background:
              "var(--muted, rgba(148,163,184,.13))",
            color: "inherit",
            font: "inherit",
            fontSize: 11,
            fontWeight: 750,
            cursor: disabled
              ? "not-allowed"
              : "pointer",
          }}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

export default BulkAttendanceActions;
