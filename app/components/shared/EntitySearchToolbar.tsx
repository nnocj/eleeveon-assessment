"use client";

import type {
  ChangeEvent,
  CSSProperties,
  KeyboardEvent,
  ReactNode,
} from "react";
import { useId, useRef } from "react";

export interface EntitySearchToolbarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  resultCount?: number;
  loading?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  onSubmit?: (value: string) => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  style?: CSSProperties;
  inputStyle?: CSSProperties;
}

export function EntitySearchToolbar({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search records",
  resultCount,
  loading = false,
  autoFocus = false,
  disabled = false,
  clearable = true,
  onSubmit,
  leading,
  trailing,
  className,
  style,
  inputStyle,
}: EntitySearchToolbarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" && onSubmit) {
      onSubmit(value);
    }

    if (event.key === "Escape" && value) {
      onChange("");
    }
  };

  return (
    <div
      className={className}
      style={{
        minWidth: 0,
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 8,
        ...style,
      }}
    >
      <label
        htmlFor={inputId}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 38,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 10px",
          borderRadius: 10,
          border: "1px solid var(--border, rgba(15, 23, 42, 0.12))",
          background: "var(--background, #fff)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            color: "var(--muted-foreground, #64748b)",
            fontSize: 16,
          }}
        >
          ⌕
        </span>

        {leading}

        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label}
          autoFocus={autoFocus}
          disabled={disabled}
          style={{
            flex: 1,
            minWidth: 0,
            height: 34,
            border: 0,
            outline: "none",
            background: "transparent",
            color: "inherit",
            font: "inherit",
            fontSize: 14,
            ...inputStyle,
          }}
        />

        {loading ? (
          <span
            role="status"
            aria-label="Searching"
            style={{
              fontSize: 12,
              color: "var(--muted-foreground, #64748b)",
            }}
          >
            …
          </span>
        ) : null}

        {typeof resultCount === "number" ? (
          <span
            aria-label={`${resultCount} results`}
            style={{
              minWidth: 24,
              padding: "2px 6px",
              borderRadius: 999,
              textAlign: "center",
              fontSize: 11,
              fontWeight: 700,
              background: "var(--muted, rgba(148, 163, 184, 0.16))",
              color: "var(--muted-foreground, #64748b)",
            }}
          >
            {resultCount}
          </span>
        ) : null}

        {clearable && value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            title="Clear search"
            style={{
              width: 26,
              height: 26,
              border: 0,
              borderRadius: 7,
              background: "transparent",
              color: "var(--muted-foreground, #64748b)",
              cursor: "pointer",
              fontSize: 17,
            }}
          >
            ×
          </button>
        ) : null}
      </label>

      {trailing}
    </div>
  );
}

export default EntitySearchToolbar;
