"use client";

import type {
  ChangeEvent,
  CSSProperties,
} from "react";
import type {
  Coordinate,
} from "../../../lib/maps";

export interface CoordinateFieldProps {
  value: Coordinate | null;
  onChange: (coordinate: Coordinate | null) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  precision?: number;
  className?: string;
  style?: CSSProperties;
}

function finiteOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function CoordinateField({
  value,
  onChange,
  label = "Coordinates",
  disabled = false,
  required = false,
  precision = 6,
  className,
  style,
}: CoordinateFieldProps) {
  const updateLatitude = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const latitude = finiteOrNull(event.target.value);
    if (latitude == null) {
      if (!event.target.value) onChange(null);
      return;
    }

    onChange({
      latitude: Math.max(-90, Math.min(90, latitude)),
      longitude: value?.longitude ?? 0,
    });
  };

  const updateLongitude = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const longitude = finiteOrNull(event.target.value);
    if (longitude == null) {
      if (!event.target.value) onChange(null);
      return;
    }

    onChange({
      latitude: value?.latitude ?? 0,
      longitude: Math.max(
        -180,
        Math.min(180, longitude),
      ),
    });
  };

  return (
    <fieldset
      className={className}
      disabled={disabled}
      style={{
        minWidth: 0,
        margin: 0,
        padding: 0,
        border: 0,
        ...style,
      }}
    >
      <legend
        style={{
          marginBottom: 6,
          fontSize: 12,
          fontWeight: 750,
        }}
      >
        {label}
        {required ? " *" : ""}
      </legend>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        <label style={{ display: "grid", gap: 4 }}>
          <span
            style={{
              fontSize: 11,
              color:
                "var(--muted-foreground, #64748b)",
            }}
          >
            Latitude
          </span>
          <input
            type="number"
            min={-90}
            max={90}
            step={10 ** -precision}
            value={
              value
                ? value.latitude.toFixed(precision)
                : ""
            }
            required={required}
            onChange={updateLatitude}
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
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span
            style={{
              fontSize: 11,
              color:
                "var(--muted-foreground, #64748b)",
            }}
          >
            Longitude
          </span>
          <input
            type="number"
            min={-180}
            max={180}
            step={10 ** -precision}
            value={
              value
                ? value.longitude.toFixed(precision)
                : ""
            }
            required={required}
            onChange={updateLongitude}
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
        </label>
      </div>
    </fieldset>
  );
}

export default CoordinateField;
