"use client";

import type {
  ComponentType,
  CSSProperties,
  ReactNode,
} from "react";

import type { MapMarker } from "@/app/lib/maps";
import { SchoolMap } from "./SchoolMap";

export type DomainMapMarker = MapMarker;

export interface DomainHeatPoint {
  id?: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  weight: number;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface DomainMapPath {
  id: string;
  coordinates: readonly {
    latitude: number;
    longitude: number;
  }[];
  label?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface DomainMapProps {
  markers?: readonly DomainMapMarker[];
  heatmap?: readonly DomainHeatPoint[];
  paths?: readonly DomainMapPath[];
  selectedMarkerId?: string | null;
  height?: number | string;
  minHeight?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
  onMarkerClick?: (
    marker: DomainMapMarker,
  ) => void;
}

type SchoolMapCompatibilityProps = {
  markers?: readonly DomainMapMarker[];
  items?: readonly DomainMapMarker[];
  heatmap?: readonly DomainHeatPoint[];
  heatPoints?: readonly DomainHeatPoint[];
  paths?: readonly DomainMapPath[];
  routes?: readonly DomainMapPath[];
  selectedId?: string | null;
  selectedMarkerId?: string | null;
  onMarkerClick?: (value: unknown) => void;
  onSelect?: (value: unknown) => void;
  children?: ReactNode;
  loading?: boolean;
};

const CompatibleSchoolMap =
  SchoolMap as unknown as ComponentType<
    SchoolMapCompatibilityProps
  >;

function markerId(value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value
  ) {
    const id = value.id;

    if (
      typeof id === "string" ||
      typeof id === "number"
    ) {
      return String(id);
    }
  }

  return "";
}

function isDomainMapMarker(
  value: unknown,
): value is DomainMapMarker {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    !("coordinate" in value)
  ) {
    return false;
  }

  const coordinate = value.coordinate;

  return (
    typeof coordinate === "object" &&
    coordinate !== null &&
    "latitude" in coordinate &&
    "longitude" in coordinate &&
    typeof coordinate.latitude === "number" &&
    typeof coordinate.longitude === "number"
  );
}

function hasValidMarkerCoordinate(
  marker: DomainMapMarker,
): boolean {
  return (
    Number.isFinite(
      marker.coordinate?.latitude,
    ) &&
    Number.isFinite(
      marker.coordinate?.longitude,
    )
  );
}

export function DomainMap({
  markers = [],
  heatmap = [],
  paths = [],
  selectedMarkerId = null,
  height = 380,
  minHeight = 260,
  emptyTitle = "No locations to display",
  emptyMessage =
    "Location data will appear here when coordinates are available.",
  loading = false,
  className,
  children,
  onMarkerClick,
}: DomainMapProps) {
  const validMarkers = markers.filter(
    hasValidMarkerCoordinate,
  );

  const validHeatmap = heatmap.filter(
    (point) =>
      Number.isFinite(
        point.coordinate?.latitude,
      ) &&
      Number.isFinite(
        point.coordinate?.longitude,
      ) &&
      Number.isFinite(point.weight),
  );

  function handleMarkerClick(
    value: unknown,
  ) {
    if (!onMarkerClick) return;

    if (isDomainMapMarker(value)) {
      onMarkerClick(value);
      return;
    }

    const id = markerId(value);

    if (!id) return;

    const marker = validMarkers.find(
      (item) =>
        String(item.id) === id,
    );

    if (marker) {
      onMarkerClick(marker);
    }
  }

  const hasMapContent =
    validMarkers.length > 0 ||
    validHeatmap.length > 0 ||
    paths.length > 0;

  return (
    <section
      className={className}
      style={
        {
          height,
          minHeight,
          position: "relative",
          width: "100%",
          overflow: "hidden",
          borderRadius: 16,
        } as CSSProperties
      }
    >
      <style>{stateCss}</style>

      {loading ? (
        <div
          className="domain-map-state"
          aria-live="polite"
        >
          <span className="domain-map-spinner" />
          <strong>Loading map…</strong>
        </div>
      ) : hasMapContent ? (
        <CompatibleSchoolMap
          markers={validMarkers}
          items={validMarkers}
          heatmap={validHeatmap}
          heatPoints={validHeatmap}
          paths={paths}
          routes={paths}
          selectedId={selectedMarkerId}
          selectedMarkerId={
            selectedMarkerId
          }
          onMarkerClick={
            handleMarkerClick
          }
          onSelect={handleMarkerClick}
        >
          {children}
        </CompatibleSchoolMap>
      ) : (
        <div className="domain-map-state">
          <span
            className="domain-map-empty-icon"
            aria-hidden="true"
          >
            ⌖
          </span>

          <strong>{emptyTitle}</strong>
          <small>{emptyMessage}</small>
        </div>
      )}
    </section>
  );
}

const stateCss = `
.domain-map-state{
  position:absolute;
  inset:0;
  display:grid;
  place-content:center;
  justify-items:center;
  gap:7px;
  text-align:center;
  padding:24px;
  background:var(--card-background,#fff);
  color:var(--text-color,#172033);
  border:1px solid rgba(148,163,184,.2);
  border-radius:16px;
}

.domain-map-state strong{
  font-size:13px;
}

.domain-map-state small{
  max-width:330px;
  font-size:10px;
  line-height:1.5;
  opacity:.6;
}

.domain-map-empty-icon{
  width:38px;
  height:38px;
  border-radius:13px;
  display:grid;
  place-items:center;
  background:rgba(148,163,184,.12);
  font-size:20px;
}

.domain-map-spinner{
  width:24px;
  height:24px;
  border-radius:50%;
  border:3px solid rgba(148,163,184,.2);
  border-top-color:currentColor;
  animation:domainMapSpin .8s linear infinite;
}

@keyframes domainMapSpin{
  to{
    transform:rotate(360deg);
  }
}
`;

export default DomainMap;