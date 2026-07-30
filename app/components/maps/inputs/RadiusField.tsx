"use client";

import type {
  CSSProperties,
} from "react";

export interface RadiusFieldProps {
  value: number;
  onChange: (radiusMeters: number) => void;
  label?: string;
  minimum?: number;
  maximum?: number;
  step?: number;
  disabled?: boolean;
  showSlider?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function RadiusField({
  value,
  onChange,
  label = "Radius",
  minimum = 5,
  maximum = 5_000,
  step = 5,
  disabled = false,
  showSlider = true,
  className,
  style,
}: RadiusFieldProps) {
  const normalized = Math.max(
    minimum,
    Math.min(maximum, value),
  );

  return (
    <label
      className={className}
      style={{
        display: "grid",
        gap: 7,
        minWidth: 0,
        ...style,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 12,
          fontWeight: 750,
        }}
      >
        <span>{label}</span>
        <span
          style={{
            color:
              "var(--muted-foreground, #64748b)",
          }}
        >
          {normalized.toLocaleString()} m
        </span>
      </span>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: showSlider
            ? "minmax(0, 1fr) 92px"
            : "1fr",
          alignItems: "center",
          gap: 9,
        }}
      >
        {showSlider ? (
          <input
            type="range"
            min={minimum}
            max={maximum}
            step={step}
            value={normalized}
            disabled={disabled}
            onChange={(event) =>
              onChange(Number(event.target.value))
            }
          />
        ) : null}

        <input
          type="number"
          min={minimum}
          max={maximum}
          step={step}
          value={normalized}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              Math.max(
                minimum,
                Math.min(
                  maximum,
                  Number(event.target.value) || minimum,
                ),
              ),
            )
          }
          style={{
            width: "100%",
            minHeight: 38,
            padding: "0 9px",
            borderRadius: 9,
            border:
              "1px solid var(--border, rgba(15,23,42,.12))",
            background: "var(--background, #fff)",
            color: "inherit",
            font: "inherit",
            boxSizing: "border-box",
          }}
        />
      </div>
    </label>
  );
}

export default RadiusField;
