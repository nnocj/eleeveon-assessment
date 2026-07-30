"use client";

import type {
  Coordinate,
  MapMarker,
} from "../../../lib/maps";
import { EntityAvatar } from "../../shared";

export interface MapLocationEditSheetProps {
  open: boolean;
  marker?: MapMarker | null;
  previousCoordinate?: Coordinate | null;
  coordinate?: Coordinate | null;
  saving?: boolean;
  error?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

function coordinateText(
  coordinate?: Coordinate | null,
): string {
  if (!coordinate) return "Not available";

  return `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`;
}

function sameCoordinate(
  previousCoordinate?: Coordinate | null,
  coordinate?: Coordinate | null,
): boolean {
  if (!previousCoordinate || !coordinate) return true;

  return (
    previousCoordinate.latitude === coordinate.latitude &&
    previousCoordinate.longitude === coordinate.longitude
  );
}

/**
 * Compact map-edit toolbar.
 *
 * This intentionally is not an EntityDetailsSheet. Location editing requires
 * direct access to the map, so the control floats above the map without adding
 * a backdrop or blocking pointer events outside the toolbar itself.
 */
export function MapLocationEditSheet({
  open,
  marker,
  previousCoordinate,
  coordinate,
  saving = false,
  error,
  onSave,
  onCancel,
}: MapLocationEditSheetProps) {
  if (!open) return null;

  const unchanged = sameCoordinate(previousCoordinate, coordinate);
  const saveDisabled =
    saving ||
    !marker ||
    !previousCoordinate ||
    !coordinate ||
    unchanged;

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        zIndex: 1200,
        top: "max(12px, env(safe-area-inset-top))",
        left: "50%",
        width: "min(calc(100vw - 24px), 620px)",
        transform: "translateX(-50%)",
        pointerEvents: "none",
      }}
    >
      <section
        role="region"
        aria-label="Move map location"
        style={{
          pointerEvents: "auto",
          display: "grid",
          gap: 10,
          padding: 12,
          borderRadius: 16,
          border:
            "1px solid var(--border, rgba(148,163,184,.32))",
          background:
            "color-mix(in srgb, var(--card, #fff) 94%, transparent)",
          color: "var(--foreground, #0f172a)",
          boxShadow:
            "0 18px 48px rgba(15,23,42,.22), 0 2px 8px rgba(15,23,42,.10)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          {marker ? (
            <EntityAvatar
              name={marker.title}
              imageUrl={marker.imageUrl}
              size="sm"
              shape="rounded"
            />
          ) : (
            <span
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
                borderRadius: 10,
                background:
                  "color-mix(in srgb, var(--primary, #2563eb) 12%, transparent)",
              }}
            >
              📍
            </span>
          )}

          <div style={{ minWidth: 0, flex: "1 1 auto" }}>
            <strong
              style={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 14,
                lineHeight: 1.3,
              }}
            >
              {marker ? `Moving ${marker.title}` : "Moving location"}
            </strong>

            <span
              style={{
                display: "block",
                marginTop: 2,
                color: "var(--muted-foreground, #64748b)",
                fontSize: 11,
                lineHeight: 1.35,
              }}
            >
              Drag the highlighted marker, then save.
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              flex: "0 0 auto",
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              style={{
                minHeight: 36,
                padding: "8px 12px",
                borderRadius: 10,
                border:
                  "1px solid var(--border, rgba(15,23,42,.14))",
                background: "var(--background, #fff)",
                color: "inherit",
                fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.65 : 1,
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={saveDisabled}
              title={unchanged ? "Drag the marker before saving" : "Save location"}
              style={{
                minHeight: 36,
                padding: "8px 13px",
                borderRadius: 10,
                border: 0,
                background: "var(--primary, #2563eb)",
                color: "var(--primary-foreground, #fff)",
                fontWeight: 800,
                cursor: saving
                  ? "wait"
                  : saveDisabled
                    ? "not-allowed"
                    : "pointer",
                opacity: saveDisabled ? 0.58 : 1,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 11,
            color: "var(--muted-foreground, #64748b)",
          }}
        >
          <span
            style={{
              padding: "4px 7px",
              borderRadius: 8,
              background: "var(--muted, rgba(148,163,184,.12))",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            From: {coordinateText(previousCoordinate)}
          </span>

          <span aria-hidden="true">→</span>

          <span
            style={{
              padding: "4px 7px",
              borderRadius: 8,
              background:
                "color-mix(in srgb, var(--primary, #2563eb) 10%, var(--background, #fff))",
              color: "var(--primary, #2563eb)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            To: {coordinateText(coordinate)}
          </span>

          {unchanged ? (
            <span>Drag the marker to enable Save.</span>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            style={{
              padding: "8px 10px",
              borderRadius: 9,
              border:
                "1px solid color-mix(in srgb, var(--danger, #dc2626) 38%, transparent)",
              background:
                "color-mix(in srgb, var(--danger, #dc2626) 9%, var(--background, #fff))",
              color: "var(--danger, #dc2626)",
              fontSize: 11,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        ) : null}
      </section>

      <style>{`
        @media (max-width: 640px) {
          [aria-label="Move map location"] > div:first-child {
            align-items: flex-start !important;
            flex-wrap: wrap !important;
          }

          [aria-label="Move map location"] > div:first-child > div:last-child {
            width: 100% !important;
          }

          [aria-label="Move map location"] > div:first-child > div:last-child button {
            flex: 1 1 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default MapLocationEditSheet;