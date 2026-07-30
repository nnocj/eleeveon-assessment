"use client";

import type {
  RoutePlan,
} from "../../../lib/maps";
import type {
  MapCanvasChildProps,
} from "../core/MapCanvas";

export interface RouteOverlayProps
  extends MapCanvasChildProps {
  route: RoutePlan;
  selected?: boolean;
  showStops?: boolean;
  onClick?: (route: RoutePlan) => void;
}

export function RouteOverlay({
  route,
  selected = false,
  showStops = true,
  onClick,
  mapContext,
}: RouteOverlayProps) {
  if (!mapContext || route.waypoints.length < 2) return null;

  const points = route.waypoints
    .map((waypoint) =>
      mapContext.projection.coordinateToPoint(waypoint),
    )
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <g
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(route);
      }}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--background, #fff)"
        strokeWidth={selected ? 10 : 8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".9"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--primary, #2563eb)"
        strokeWidth={selected ? 6 : 4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {showStops
        ? route.waypoints.map((waypoint, index) => {
            const point =
              mapContext.projection.coordinateToPoint(
                waypoint,
              );
            return (
              <g key={waypoint.id ?? `waypoint-${index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={selected ? 7 : 5}
                  fill="var(--background, #fff)"
                  stroke="var(--primary, #2563eb)"
                  strokeWidth="3"
                />
                <text
                  x={point.x}
                  y={point.y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill="var(--foreground, #0f172a)"
                  pointerEvents="none"
                >
                  {index + 1}
                </text>
              </g>
            );
          })
        : null}
    </g>
  );
}

export default RouteOverlay;
