"use client";

import type { CSSProperties, ReactNode } from "react";
import type { DataViewMode } from "./ResponsiveDataView";

export interface ViewModeOption {
  value: DataViewMode;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
}

export interface ViewModeToggleProps {
  value: DataViewMode;
  onChange: (mode: DataViewMode) => void;
  options?: readonly ViewModeOption[];
  compact?: boolean;
  showLabels?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

const DEFAULT_OPTIONS: readonly ViewModeOption[] = [
  { value: "cards", label: "Cards", icon: "▦" },
  { value: "table", label: "Table", icon: "☷" },
  { value: "analytics", label: "Analytics", icon: "◫" },
  { value: "map", label: "Map", icon: "⌖" },
];

export function ViewModeToggle({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  compact = true,
  showLabels = false,
  className,
  style,
  ariaLabel = "Choose view",
}: ViewModeToggleProps) {
  const visibleOptions = options.filter((option) => !option.hidden);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: 2,
        borderRadius: 10,
        background: "var(--muted, rgba(148, 163, 184, 0.16))",
        border: "1px solid var(--border, rgba(15, 23, 42, 0.10))",
        ...style,
      }}
    >
      {visibleOptions.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            aria-pressed={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
            style={{
              minWidth: compact ? 32 : 38,
              minHeight: compact ? 30 : 36,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: showLabels ? "0 10px" : "0 8px",
              border: 0,
              borderRadius: 8,
              background: selected
                ? "var(--background, #fff)"
                : "transparent",
              color: selected
                ? "var(--primary, #2563eb)"
                : "var(--muted-foreground, #64748b)",
              boxShadow: selected
                ? "0 1px 3px rgba(15, 23, 42, 0.10)"
                : "none",
              cursor: option.disabled ? "not-allowed" : "pointer",
              opacity: option.disabled ? 0.5 : 1,
              font: "inherit",
              fontSize: 13,
              fontWeight: selected ? 700 : 600,
            }}
          >
            {option.icon ? (
              <span aria-hidden="true">{option.icon}</span>
            ) : null}
            {showLabels ? <span>{option.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export default ViewModeToggle;
