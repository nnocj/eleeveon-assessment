"use client";

import type { CSSProperties } from "react";

export interface AttendanceDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  minimum?: string;
  maximum?: string;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AttendanceDatePicker({
  value,
  onChange,
  label = "Date",
  minimum,
  maximum,
  disabled = false,
  required = true,
  compact = true,
  className,
  style,
}: AttendanceDatePickerProps) {
  const today = localDateKey();

  return (
    <label
      className={className}
      style={{
        display: "grid",
        gap: 5,
        minWidth: 0,
        ...style,
      }}
    >
      {label ? (
        <span
          style={{
            fontSize: 11,
            fontWeight: 750,
          }}
        >
          {label}
          {required ? " *" : ""}
        </span>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <input
          type="date"
          value={value}
          min={minimum}
          max={maximum}
          required={required}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          style={{
            minWidth: 0,
            flex: 1,
            minHeight: compact ? 36 : 42,
            padding: "0 9px",
            borderRadius: 9,
            border:
              "1px solid var(--border, rgba(15,23,42,.12))",
            background: "var(--background, #fff)",
            color: "inherit",
            font: "inherit",
            fontSize: 13,
          }}
        />

        {value !== today ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(today)}
            style={{
              minHeight: compact ? 36 : 42,
              padding: "0 9px",
              borderRadius: 9,
              border:
                "1px solid var(--border, rgba(15,23,42,.12))",
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
            Today
          </button>
        ) : null}
      </div>
    </label>
  );
}

export default AttendanceDatePicker;
