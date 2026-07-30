"use client";

import type {
  TrackingTrail,
} from "../../../lib/maps";
import type {
  MapCanvasChildProps,
} from "../core/MapCanvas";

export interface TrackingTrailOverlayProps
  extends MapCanvasChildProps {
  trail: TrackingTrail;
  selected?: boolean;
  showPoints?: boolean;
  onClick?: (trail: TrackingTrail) => void;
}

export function TrackingTrailOverlay({
  trail,
  selected = false,
  showPoints = false,
  onClick,
  mapContext,
}: TrackingTrailOverlayProps) {
  if (!mapContext || trail.points.length < 2) return null;

  const points = trail.points
    .map((point) =>
      mapContext.projection.coordinateToPoint(point),
    )
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <g
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(trail);
      }}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--warning, #d97706)"
        strokeWidth={selected ? 6 : 4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="9 6"
        opacity=".9"
      />

      {showPoints
        ? trail.points.map((trackingPoint, index) => {
            const point =
              mapContext.projection.coordinateToPoint(
                trackingPoint,
              );
            return (
              <circle
                key={
                  trackingPoint.id ??
                  `${trail.entityId}:${index}`
                }
                cx={point.x}
                cy={point.y}
                r={index === trail.points.length - 1 ? 6 : 3}
                fill={
                  index === trail.points.length - 1
                    ? "var(--danger, #dc2626)"
                    : "var(--background, #fff)"
                }
                stroke="var(--warning, #d97706)"
                strokeWidth="2"
              />
            );
          })
        : null}
    </g>
  );
}

export default TrackingTrailOverlay;
