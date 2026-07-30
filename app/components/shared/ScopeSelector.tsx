"use client";

import type {
  ChangeEvent,
  CSSProperties,
  ReactNode,
} from "react";
import { useId } from "react";

export interface ScopeOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
  metadata?: Record<string, unknown>;
}

export interface ScopeSelectorProps {
  value?: string;
  onChange: (value: string, option?: ScopeOption) => void;
  options: readonly ScopeOption[];
  label?: ReactNode;
  placeholder?: string;
  helperText?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
  selectStyle?: CSSProperties;
}

function groupedOptions(
  options: readonly ScopeOption[],
): Array<{
  group?: string;
  options: ScopeOption[];
}> {
  const groups = new Map<string, ScopeOption[]>();
  const ungrouped: ScopeOption[] = [];

  for (const option of options) {
    if (!option.group) {
      ungrouped.push(option);
      continue;
    }

    const group = groups.get(option.group) ?? [];
    group.push(option);
    groups.set(option.group, group);
  }

  return [
    ...(ungrouped.length
      ? [{ group: undefined, options: ungrouped }]
      : []),
    ...[...groups.entries()].map(([group, groupOptions]) => ({
      group,
      options: groupOptions,
    })),
  ];
}

export function ScopeSelector({
  value,
  onChange,
  options,
  label,
  placeholder = "Select scope",
  helperText,
  error,
  required = false,
  disabled = false,
  compact = true,
  className,
  style,
  selectStyle,
}: ScopeSelectorProps) {
  const id = useId();
  const describedById = `${id}-description`;
  const groups = groupedOptions(options);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value;
    const option = options.find((item) => item.value === nextValue);
    onChange(nextValue, option);
  };

  return (
    <label
      htmlFor={id}
      className={className}
      style={{
        display: "grid",
        gap: 6,
        minWidth: 0,
        ...style,
      }}
    >
      {label ? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 750,
            color: error
              ? "var(--danger, #dc2626)"
              : "var(--foreground, #0f172a)",
          }}
        >
          {label}
          {required ? " *" : ""}
        </span>
      ) : null}

      <select
        id={id}
        value={value ?? ""}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          helperText || error ? describedById : undefined
        }
        style={{
          width: "100%",
          minHeight: compact ? 38 : 44,
          padding: compact ? "0 10px" : "0 12px",
          borderRadius: 10,
          border: error
            ? "1px solid var(--danger, #dc2626)"
            : "1px solid var(--border, rgba(15, 23, 42, 0.12))",
          background: "var(--background, #fff)",
          color: "var(--foreground, #0f172a)",
          font: "inherit",
          fontSize: 14,
          outline: "none",
          opacity: disabled ? 0.65 : 1,
          ...selectStyle,
        }}
      >
        <option value="" disabled={required}>
          {placeholder}
        </option>

        {groups.map((group, groupIndex) =>
          group.group ? (
            <optgroup
              key={`${group.group}-${groupIndex}`}
              label={group.group}
            >
              {group.options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </optgroup>
          ) : (
            group.options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))
          ),
        )}
      </select>

      {helperText || error ? (
        <span
          id={describedById}
          style={{
            fontSize: 12,
            color: error
              ? "var(--danger, #dc2626)"
              : "var(--muted-foreground, #64748b)",
          }}
        >
          {error ?? helperText}
        </span>
      ) : null}
    </label>
  );
}

export default ScopeSelector;
