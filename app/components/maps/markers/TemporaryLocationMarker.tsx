"use client";

import type { Coordinate } from "../core/types";
import type { MapCanvasChildProps } from "../core/MapCanvas";

export interface TemporaryLocationMarkerProps
  extends MapCanvasChildProps {
  coordinate: Coordinate;
  size?: number;
  label?: string;
}

/**
 * Visual-only marker for a coordinate selected on the map.
 * It never creates or updates a Dexie record by itself.
 */
export function TemporaryLocationMarker({
  coordinate,
  size = 38,
  label = "Selected location",
  mapContext,
}: TemporaryLocationMarkerProps) {
  if (!mapContext) return null;

  const point =
    mapContext.projection.coordinateToPoint(
      coordinate,
    );

  return (
    <g
      transform={`translate(${point.x} ${point.y})`}
      aria-label={label}
      pointerEvents="none"
    >
      <circle
        r={size * 0.72}
        fill="var(--primary, #2563eb)"
        opacity=".16"
      >
        <animate
          attributeName="r"
          values={`${size * 0.55};${size * 0.8};${size * 0.55}`}
          dur="1.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values=".26;.08;.26"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </circle>

      <path
        d={`M 0 ${size * 0.56}
            C ${-size * 0.08} ${size * 0.37},
              ${-size * 0.46} ${size * 0.05},
              ${-size * 0.46} ${-size * 0.24}
            A ${size * 0.46} ${size * 0.46} 0 1 1
              ${size * 0.46} ${-size * 0.24}
            C ${size * 0.46} ${size * 0.05},
              ${size * 0.08} ${size * 0.37},
              0 ${size * 0.56} Z`}
        fill="var(--primary, #2563eb)"
        stroke="var(--background, #fff)"
        strokeWidth="2.5"
        filter="url(#eleeveon-map-shadow)"
      />

      <circle
        cy={-size * 0.20}
        r={size * 0.19}
        fill="var(--background, #fff)"
      />

      <path
        d={`M ${-size * 0.09} ${-size * 0.20}
            H ${size * 0.09}
            M 0 ${-size * 0.29}
            V ${-size * 0.11}`}
        stroke="var(--primary, #2563eb)"
        strokeWidth={Math.max(2, size * 0.065)}
        strokeLinecap="round"
      />
    </g>
  );
}

export default TemporaryLocationMarker;