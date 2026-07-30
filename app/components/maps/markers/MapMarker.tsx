"use client";

import {
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type {
  Coordinate,
  MapMarker as MapMarkerData,
} from "../../../lib/maps";
import type {
  MapCanvasChildProps,
} from "../core/MapCanvas";
import {
  MapEntityIcon,
  type MapEntityIconType,
} from "./MapEntityIcon";

export interface MapMarkerProps extends MapCanvasChildProps {
  marker: MapMarkerData;
  selected?: boolean;
  size?: number;
  draggable?: boolean;
  onClick?: (marker: MapMarkerData) => void;
  onDragStart?: (marker: MapMarkerData) => void;
  onDrag?: (
    marker: MapMarkerData,
    coordinate: Coordinate,
  ) => void;
  onDragEnd?: (
    marker: MapMarkerData,
    coordinate: Coordinate,
  ) => void;
  renderIcon?: (
    marker: MapMarkerData,
  ) => ReactNode;
}

type MarkerVisualConfig = {
  color: string;
  icon: MapEntityIconType;
};

const ENTITY_MARKER_STYLES: Record<
  "student" | "teacher" | "parent" | "branch" | "person" | "custom",
  MarkerVisualConfig
> = {
  student: {
    color: "#2563eb",
    icon: "student",
  },
  teacher: {
    color: "#16a34a",
    icon: "teacher",
  },
  parent: {
    color: "#f97316",
    icon: "parent",
  },
  branch: {
    color: "#7c3aed",
    icon: "branch",
  },
  person: {
    color: "#0f766e",
    icon: "person",
  },
  custom: {
    color: "#64748b",
    icon: "custom",
  },
};

function normalizedEntityType(
  marker: MapMarkerData,
): keyof typeof ENTITY_MARKER_STYLES {
  const value = String(
    marker.icon ||
      marker.entityType ||
      marker.metadata?.markerRole ||
      "",
  )
    .trim()
    .toLowerCase();

  if (
    value === "branch" ||
    value === "school" ||
    value === "school_branch" ||
    value === "school-branch" ||
    value === "branch-building" ||
    value === "building"
  ) {
    return "branch";
  }

  if (
    value === "student" ||
    value === "learner" ||
    value === "pupil"
  ) {
    return "student";
  }

  if (
    value === "teacher" ||
    value === "staff" ||
    value === "tutor"
  ) {
    return "teacher";
  }

  if (
    value === "parent" ||
    value === "guardian" ||
    value === "family"
  ) {
    return "parent";
  }

  if (value === "person" || value === "user") {
    return "person";
  }

  return "custom";
}

function statusColor(status?: string): string {
  const value = String(status ?? "").toLowerCase();

  if (
    value.includes("critical") ||
    value.includes("absent") ||
    value.includes("failed") ||
    value.includes("denied")
  ) {
    return "var(--danger, #dc2626)";
  }

  if (
    value.includes("warning") ||
    value.includes("late") ||
    value.includes("risk")
  ) {
    return "var(--warning, #d97706)";
  }

  return "";
}

function markerColor(
  marker: MapMarkerData,
  config: MarkerVisualConfig,
): string {
  const explicit = String(
    marker.metadata?.markerColor ||
      marker.metadata?.color ||
      "",
  ).trim();

  if (explicit) return explicit;

  const statusOverride = statusColor(marker.status);
  if (statusOverride) return statusOverride;

  return config.color;
}

export function MapMarker({
  marker,
  selected = false,
  size = 34,
  draggable = false,
  onClick,
  onDragStart,
  onDrag,
  onDragEnd,
  renderIcon,
  mapContext,
}: MapMarkerProps) {
  const dragStateRef = useRef<{
    pointerId: number;
    started: boolean;
    lastCoordinate: Coordinate;
  } | null>(null);

  if (!mapContext || marker.visible === false) return null;

  const point = mapContext.projection.coordinateToPoint(
    marker.coordinate,
  );

  const entityType = normalizedEntityType(marker);
  const visualConfig = ENTITY_MARKER_STYLES[entityType];
  const fill = markerColor(marker, visualConfig);

  const coordinateFromPointer = (
    event: ReactPointerEvent<SVGGElement>,
  ): Coordinate | null => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return mapContext.projection.pointToCoordinate({
      x:
        ((event.clientX - rect.left) / rect.width) *
        mapContext.width,
      y:
        ((event.clientY - rect.top) / rect.height) *
        mapContext.height,
    });
  };

  const finishDrag = (
    event: ReactPointerEvent<SVGGElement>,
  ) => {
    const dragState = dragStateRef.current;

    if (
      !dragState ||
      dragState.pointerId !== event.pointerId
    ) {
      return;
    }

    event.stopPropagation();

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    } catch {
      // The browser may already have released capture.
    }

    mapContext.setMapDraggingEnabled?.(true);

    if (dragState.started) {
      onDragEnd?.(
        marker,
        dragState.lastCoordinate,
      );
    }

    dragStateRef.current = null;
  };

  return (
    <g
      transform={`translate(${point.x} ${point.y})`}
      role="button"
      tabIndex={0}
      aria-label={
        draggable
          ? `${marker.title}. Drag to move location.`
          : marker.title
      }
      onClick={(event) => {
        event.stopPropagation();

        if (dragStateRef.current?.started) {
          return;
        }

        onClick?.(marker);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(marker);
        }
      }}
      onPointerDown={(event) => {
        if (!draggable) return;

        event.preventDefault();
        event.stopPropagation();

        event.currentTarget.setPointerCapture(
          event.pointerId,
        );
        mapContext.setMapDraggingEnabled?.(false);

        dragStateRef.current = {
          pointerId: event.pointerId,
          started: false,
          lastCoordinate: marker.coordinate,
        };

        onDragStart?.(marker);
      }}
      onPointerMove={(event) => {
        const dragState = dragStateRef.current;

        if (
          !draggable ||
          !dragState ||
          dragState.pointerId !== event.pointerId
        ) {
          return;
        }

        const coordinate =
          coordinateFromPointer(event);
        if (!coordinate) return;

        event.preventDefault();
        event.stopPropagation();

        dragState.started = true;
        dragState.lastCoordinate = coordinate;
        onDrag?.(marker, coordinate);
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      style={{
        cursor: draggable ? "grab" : "pointer",
        outline: "none",
        touchAction: "none",
      }}
    >
      {selected ? (
        <circle
          r={size * 0.72}
          fill="none"
          stroke={fill}
          strokeWidth="3"
          opacity=".35"
        />
      ) : null}

      {draggable ? (
        <circle
          r={size * 0.88}
          fill={fill}
          opacity=".10"
          stroke={fill}
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      ) : null}

      <path
        d={`M 0 ${size * 0.55}
            C ${-size * 0.08} ${size * 0.36},
              ${-size * 0.46} ${size * 0.05},
              ${-size * 0.46} ${-size * 0.24}
            A ${size * 0.46} ${size * 0.46} 0 1 1
              ${size * 0.46} ${-size * 0.24}
            C ${size * 0.46} ${size * 0.05},
              ${size * 0.08} ${size * 0.36},
              0 ${size * 0.55} Z`}
        fill={fill}
        stroke="var(--background, #fff)"
        strokeWidth="2"
        filter="url(#eleeveon-map-shadow)"
      />

      <circle
        cy={-size * 0.20}
        r={size * 0.245}
        fill="var(--background, #fff)"
      />

      <g
        transform={`translate(${-size * 0.145} ${-size * 0.345})`}
        color={fill}
        pointerEvents="none"
      >
        {renderIcon ? (
          renderIcon(marker)
        ) : (
          <MapEntityIcon
            entityType={marker.entityType}
            icon={String(marker.icon || visualConfig.icon)}
            size={size * 0.29}
            strokeWidth={2}
            fallback={
              <text
                x={size * 0.145}
                y={size * 0.205}
                textAnchor="middle"
                fontSize={size * 0.22}
                fontWeight="800"
                fill="currentColor"
              >
                {String(marker.title || "?")
                  .trim()
                  .slice(0, 1)
                  .toUpperCase()}
              </text>
            }
          />
        )}
      </g>
    </g>
  );
}

export default MapMarker;