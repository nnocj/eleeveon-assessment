"use client";

import { useEffect } from "react";
import type {
  Coordinate,
  MapCreateEntityType,
} from "../core/types";

export interface MapCreateLocationSheetProps {
  open: boolean;
  coordinate: Coordinate | null;
  entityTypes: readonly MapCreateEntityType[];
  onCreate: (entityType: MapCreateEntityType) => void;
  onClose: () => void;
}

const ENTITY_LABELS: Record<
  MapCreateEntityType,
  { label: string; icon: string }
> = {
  student: { label: "Add Student", icon: "🎓" },
  parent: { label: "Add Parent", icon: "👪" },
  teacher: { label: "Add Teacher", icon: "👩‍🏫" },
};

export function MapCreateLocationSheet({
  open,
  coordinate,
  entityTypes,
  onCreate,
  onClose,
}: MapCreateLocationSheetProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
  }, [onClose, open]);

  if (!open || !coordinate) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 12,
        background: "rgba(15,23,42,.36)",
        backdropFilter: "blur(2px)",
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-create-location-title"
        style={{
          width: "min(100%, 430px)",
          maxHeight: "min(72vh, 620px)",
          overflowY: "auto",
          border:
            "1px solid var(--border, rgba(148,163,184,.28))",
          borderRadius: 18,
          background: "var(--card, #fff)",
          color: "var(--foreground, #0f172a)",
          boxShadow: "0 24px 70px rgba(15,23,42,.30)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: "16px 16px 12px",
            borderBottom:
              "1px solid var(--border, rgba(148,163,184,.20))",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              id="map-create-location-title"
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 850,
              }}
            >
              Selected location
            </h2>
            <p
              style={{
                margin: "5px 0 0",
                color:
                  "var(--muted-foreground, #64748b)",
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              {coordinate.latitude.toFixed(6)}, {" "}
              {coordinate.longitude.toFixed(6)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close selected location actions"
            style={{
              width: 34,
              height: 34,
              flex: "0 0 auto",
              border:
                "1px solid var(--border, rgba(148,163,184,.24))",
              borderRadius: 10,
              background:
                "var(--muted, rgba(148,163,184,.12))",
              color: "inherit",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </header>

        <div
          style={{
            display: "grid",
            gap: 8,
            padding: 12,
          }}
        >
          {entityTypes.map((entityType) => {
            const item = ENTITY_LABELS[entityType];

            return (
              <button
                key={entityType}
                type="button"
                onClick={() => onCreate(entityType)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 13px",
                  border:
                    "1px solid color-mix(in srgb, var(--primary, #2563eb) 22%, var(--border, #cbd5e1))",
                  borderRadius: 13,
                  background:
                    "color-mix(in srgb, var(--primary, #2563eb) 7%, var(--card, #fff))",
                  color: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 38,
                    height: 38,
                    display: "grid",
                    placeItems: "center",
                    flex: "0 0 auto",
                    borderRadius: 11,
                    background:
                      "color-mix(in srgb, var(--primary, #2563eb) 14%, transparent)",
                    fontSize: 18,
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ minWidth: 0 }}>
                  <strong
                    style={{
                      display: "block",
                      fontSize: 13,
                    }}
                  >
                    {item.label}
                  </strong>
                  <small
                    style={{
                      display: "block",
                      marginTop: 3,
                      color:
                        "var(--muted-foreground, #64748b)",
                      fontSize: 11,
                    }}
                  >
                    Start with these map coordinates
                  </small>
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "11px 13px",
              border:
                "1px solid var(--border, rgba(148,163,184,.28))",
              borderRadius: 12,
              background: "var(--card, #fff)",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 750,
            }}
          >
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}

export default MapCreateLocationSheet;