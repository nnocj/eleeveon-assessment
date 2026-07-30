"use client";

import type {
  MarkerCluster,
} from "../../../lib/maps";
import type {
  MapCanvasChildProps,
} from "../core/MapCanvas";

export interface MapMarkerClusterProps
  extends MapCanvasChildProps {
  cluster: MarkerCluster;
  selected?: boolean;
  onClick?: (cluster: MarkerCluster) => void;
}

export function MapMarkerCluster({
  cluster,
  selected = false,
  onClick,
  mapContext,
}: MapMarkerClusterProps) {
  if (!mapContext) return null;

  const point = mapContext.projection.coordinateToPoint(
    cluster.coordinate,
  );
  const radius = Math.min(
    28,
    14 + Math.log2(cluster.count + 1) * 3,
  );

  return (
    <g
      transform={`translate(${point.x} ${point.y})`}
      role="button"
      tabIndex={0}
      aria-label={`${cluster.count} map markers`}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(cluster);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(cluster);
        }
      }}
      style={{ cursor: "pointer", outline: "none" }}
    >
      {selected ? (
        <circle
          r={radius + 8}
          fill="none"
          stroke="var(--primary, #2563eb)"
          strokeWidth="3"
          opacity=".3"
        />
      ) : null}

      <circle
        r={radius + 5}
        fill="var(--primary-soft, rgba(37,99,235,.18))"
      />
      <circle
        r={radius}
        fill="var(--primary, #2563eb)"
        stroke="var(--background, #fff)"
        strokeWidth="2"
        filter="url(#eleeveon-map-shadow)"
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={Math.max(11, radius * 0.65)}
        fontWeight="800"
        pointerEvents="none"
      >
        {cluster.count}
      </text>
    </g>
  );
}

export default MapMarkerCluster;
