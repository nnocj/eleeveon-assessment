"use client";

import type { CSSProperties, ReactNode } from "react";

export interface FilterSummaryItem {
  id: string;
  label: ReactNode;
  value?: ReactNode;
  removable?: boolean;
  disabled?: boolean;
}

export interface FilterSummaryProps {
  items: readonly FilterSummaryItem[];
  onRemove?: (id: string) => void;
  onClear?: () => void;
  clearLabel?: string;
  empty?: ReactNode;
  maxVisible?: number;
  className?: string;
  style?: CSSProperties;
}

export function FilterSummary({
  items,
  onRemove,
  onClear,
  clearLabel = "Clear",
  empty = null,
  maxVisible,
  className,
  style,
}: FilterSummaryProps) {
  if (!items.length) return <>{empty}</>;

  const visibleItems =
    typeof maxVisible === "number"
      ? items.slice(0, Math.max(0, maxVisible))
      : items;

  const hiddenCount = items.length - visibleItems.length;

  return (
    <div
      className={className}
      aria-label="Active filters"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
        ...style,
      }}
    >
      {visibleItems.map((item) => (
        <span
          key={item.id}
          style={{
            minHeight: 28,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            borderRadius: 999,
            background: "var(--primary-soft, rgba(37, 99, 235, 0.10))",
            color: "var(--primary, #2563eb)",
            fontSize: 12,
            fontWeight: 650,
          }}
        >
          <span>{item.label}</span>
          {item.value != null ? (
            <>
              <span aria-hidden="true">:</span>
              <span>{item.value}</span>
            </>
          ) : null}

          {item.removable !== false && onRemove ? (
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${String(item.label)} filter`}
              title="Remove filter"
              style={{
                width: 19,
                height: 19,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                border: 0,
                borderRadius: "50%",
                background: "transparent",
                color: "inherit",
                cursor: item.disabled ? "not-allowed" : "pointer",
                opacity: item.disabled ? 0.5 : 1,
                fontSize: 14,
              }}
            >
              ×
            </button>
          ) : null}
        </span>
      ))}

      {hiddenCount > 0 ? (
        <span
          style={{
            minHeight: 28,
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 8px",
            borderRadius: 999,
            background: "var(--muted, rgba(148, 163, 184, 0.16))",
            color: "var(--muted-foreground, #64748b)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          +{hiddenCount}
        </span>
      ) : null}

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          style={{
            minHeight: 28,
            padding: "3px 8px",
            border: 0,
            background: "transparent",
            color: "var(--muted-foreground, #64748b)",
            cursor: "pointer",
            font: "inherit",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}

export default FilterSummary;
