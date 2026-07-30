"use client";

import type {
  MapMarker as MapMarkerData,
} from "../../../lib/maps";
import type {
  MapCanvasChildProps,
} from "../core/MapCanvas";

export interface MapMarkerPopupProps
  extends MapCanvasChildProps {
  marker: MapMarkerData;
  open?: boolean;
  width?: number;
  onClose?: () => void;
  onOpenDetails?: (marker: MapMarkerData) => void;
}

export function MapMarkerPopup({
  marker,
  open = true,
  width = 250,
  onClose,
  onOpenDetails,
  mapContext,
}: MapMarkerPopupProps) {
  if (!open || !mapContext) return null;

  const point =
    mapContext.projection.coordinateToPoint(
      marker.coordinate,
    );

  const x = Math.max(
    width / 2 + 8,
    Math.min(
      mapContext.width - width / 2 - 8,
      point.x,
    ),
  );

  const estimatedHeight = 116;

  const y =
    point.y - estimatedHeight - 32 < 8
      ? point.y + 42
      : point.y - estimatedHeight - 20;

  return (
    <foreignObject
      x={x - width / 2}
      y={y}
      width={width}
      height={estimatedHeight}
      style={{ overflow: "visible" }}
    >
      <div
        style={{
          width,
          minHeight: 92,
          padding: 11,
          borderRadius: 12,
          border:
            "1px solid var(--border, rgba(15,23,42,.14))",
          background: "var(--background, #fff)",
          color: "var(--foreground, #0f172a)",
          boxShadow:
            "0 10px 30px rgba(2,6,23,.2)",
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.25,
                fontWeight: 800,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {marker.title}
            </div>

            {marker.subtitle ? (
              <div
                style={{
                  marginTop: 3,
                  fontSize: 11,
                  color:
                    "var(--muted-foreground, #64748b)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {marker.subtitle}
              </div>
            ) : null}
          </div>

          {onClose ? (
            <button
              type="button"
              aria-label="Close marker popup"
              onClick={onClose}
              style={{
                width: 24,
                height: 24,
                padding: 0,
                border: 0,
                borderRadius: 6,
                background:
                  "var(--muted, rgba(148,163,184,.15))",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          ) : null}
        </div>

        {marker.status ? (
          <div
            style={{
              marginTop: 7,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "capitalize",
              color: "var(--primary, #2563eb)",
            }}
          >
            {marker.status.replaceAll("_", " ")}
          </div>
        ) : null}

        {onOpenDetails ? (
          <button
            type="button"
            onClick={() => onOpenDetails(marker)}
            style={{
              marginTop: 8,
              padding: 0,
              border: 0,
              background: "transparent",
              color: "var(--primary, #2563eb)",
              font: "inherit",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            View details →
          </button>
        ) : null}
      </div>
    </foreignObject>
  );
}

export default MapMarkerPopup;