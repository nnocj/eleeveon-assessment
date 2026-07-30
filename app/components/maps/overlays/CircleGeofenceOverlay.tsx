"use client";

import {
  haversineDistanceMeters,
  type CircleGeofence,
  type Coordinate,
} from "../../../lib/maps";
import type {
  MapCanvasChildProps,
} from "../core/MapCanvas";

export interface CircleGeofenceOverlayProps
  extends MapCanvasChildProps {
  geofence: CircleGeofence;
  selected?: boolean;
  fillOpacity?: number;
  onClick?: (geofence: CircleGeofence) => void;
}

function metersToPixelRadius(
  center: Coordinate,
  radiusMeters: number,
  coordinateToPoint: (
    coordinate: Coordinate,
  ) => { x: number; y: number },
): number {
  const latitudeOffset = radiusMeters / 111_320;
  const edge = {
    latitude: center.latitude + latitudeOffset,
    longitude: center.longitude,
  };
  const a = coordinateToPoint(center);
  const b = coordinateToPoint(edge);
  return Math.max(3, Math.abs(a.y - b.y));
}

export function CircleGeofenceOverlay({
  geofence,
  selected = false,
  fillOpacity = 0.12,
  onClick,
  mapContext,
}: CircleGeofenceOverlayProps) {
  if (!mapContext) return null;

  const point = mapContext.projection.coordinateToPoint(
    geofence.center,
  );
  const radius = metersToPixelRadius(
    geofence.center,
    geofence.radiusMeters,
    mapContext.projection.coordinateToPoint,
  );

  return (
    <g
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(geofence);
      }}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <circle
        cx={point.x}
        cy={point.y}
        r={radius}
        fill="var(--primary, #2563eb)"
        fillOpacity={fillOpacity}
        stroke="var(--primary, #2563eb)"
        strokeWidth={selected ? 3 : 2}
        strokeDasharray={selected ? undefined : "7 5"}
      />
      {geofence.label ? (
        <text
          x={point.x}
          y={point.y - radius - 8}
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="var(--foreground, #0f172a)"
          pointerEvents="none"
        >
          {geofence.label}
        </text>
      ) : null}
    </g>
  );
}

export default CircleGeofenceOverlay;
