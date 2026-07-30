"use client";

import type {
  MapHeatPoint,
} from "../core/types";
import type {
  MapCanvasChildProps,
} from "../core/MapCanvas";

export interface MapHeatmapOverlayProps
  extends MapCanvasChildProps {
  points: readonly MapHeatPoint[];
  maximumRadius?: number;
  minimumRadius?: number;
  opacity?: number;
}

export function MapHeatmapOverlay({
  points,
  maximumRadius = 54,
  minimumRadius = 12,
  opacity = 0.34,
  mapContext,
}: MapHeatmapOverlayProps) {
  if (!mapContext || !points.length) return null;

  const maxWeight = Math.max(
    1,
    ...points.map((point) => point.weight),
  );

  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id="eleeveon-heat-gradient">
          <stop
            offset="0%"
            stopColor="var(--danger, #dc2626)"
            stopOpacity={opacity}
          />
          <stop
            offset="58%"
            stopColor="var(--warning, #f59e0b)"
            stopOpacity={opacity * 0.58}
          />
          <stop
            offset="100%"
            stopColor="var(--warning, #f59e0b)"
            stopOpacity="0"
          />
        </radialGradient>
      </defs>

      {points.map((heatPoint) => {
        const point =
          mapContext.projection.coordinateToPoint(
            heatPoint.coordinate,
          );
        const radius =
          minimumRadius +
          (heatPoint.weight / maxWeight) *
            (maximumRadius - minimumRadius);

        return (
          <circle
            key={heatPoint.id}
            cx={point.x}
            cy={point.y}
            r={radius}
            fill="url(#eleeveon-heat-gradient)"
          />
        );
      })}
    </g>
  );
}

export default MapHeatmapOverlay;
