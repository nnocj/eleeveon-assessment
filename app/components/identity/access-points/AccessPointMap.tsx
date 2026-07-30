"use client";

import type { ComponentType, ReactNode } from "react";

import type { IdentityAccessPoint } from "../infrastructure-types";

import { SchoolMap } from "../../maps/SchoolMap";
import { CircleGeofenceOverlay } from "../../maps/overlays/CircleGeofenceOverlay";

export interface AccessPointMapProps {
  accessPoints: readonly IdentityAccessPoint[];
  selectedId?: string | null;
  onSelect?: (accessPoint: IdentityAccessPoint) => void;
  height?: number | string;
}

/**
 * Compatibility wrappers are intentionally kept local because the generic map
 * components may expose stricter prop contracts than the identity adapter.
 */
const CompatibleSchoolMap =
  SchoolMap as unknown as ComponentType<{
    markers?: readonly IdentityAccessPoint[];
    items?: readonly IdentityAccessPoint[];
    selectedId?: string | null;
    onMarkerClick?: (value: unknown) => void;
    children?: ReactNode;
  }>;

const CompatibleCircleGeofenceOverlay =
  CircleGeofenceOverlay as unknown as ComponentType<{
    geofence: unknown;
    selected?: boolean;
    fillOpacity?: number;
    onClick?: () => void;
  }>;

function getAccessPointId(value: unknown): string {
  if (typeof value === "string") {
    return value;
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

function createCircleGeofence(
  accessPoint: IdentityAccessPoint,
) {
  if (
    typeof accessPoint.latitude !== "number" ||
    typeof accessPoint.longitude !== "number"
  ) {
    return null;
  }

  const radiusMeters =
    typeof accessPoint.allowedRadiusMeters === "number"
      ? accessPoint.allowedRadiusMeters
      : 0;

  if (radiusMeters <= 0) {
    return null;
  }

  /*
   * This object is passed through the compatibility adapter because the
   * concrete CircleGeofence model belongs to the shared maps layer.
   */
  return {
    id: `access-point-geofence-${accessPoint.id}`,

    center: {
      latitude: accessPoint.latitude,
      longitude: accessPoint.longitude,
    },

    coordinate: {
      latitude: accessPoint.latitude,
      longitude: accessPoint.longitude,
    },

    latitude: accessPoint.latitude,
    longitude: accessPoint.longitude,

    radius: radiusMeters,
    radiusMeters,
  };
}

export function AccessPointMap({
  accessPoints,
  selectedId = null,
  onSelect,
  height = 380,
}: AccessPointMapProps) {
  const visibleAccessPoints = accessPoints.filter(
    (accessPoint) =>
      !accessPoint.isDeleted &&
      accessPoint.active !== false &&
      typeof accessPoint.latitude === "number" &&
      typeof accessPoint.longitude === "number",
  );

  function handleMarkerClick(value: unknown) {
    const selectedAccessPointId =
      getAccessPointId(value);

    if (!selectedAccessPointId) {
      return;
    }

    const accessPoint =
      visibleAccessPoints.find(
        (item) =>
          String(item.id) ===
          selectedAccessPointId,
      );

    if (accessPoint) {
      onSelect?.(accessPoint);
    }
  }

  return (
    <div
      style={{
        height,
        minHeight: 260,
        position: "relative",
      }}
    >
      <CompatibleSchoolMap
        markers={visibleAccessPoints}
        items={visibleAccessPoints}
        selectedId={selectedId}
        onMarkerClick={handleMarkerClick}
      >
        {visibleAccessPoints.map(
          (accessPoint) => {
            const geofence =
              createCircleGeofence(
                accessPoint,
              );

            if (!geofence) {
              return null;
            }

            return (
              <CompatibleCircleGeofenceOverlay
                key={`geofence-${accessPoint.id}`}
                geofence={geofence}
                selected={
                  String(selectedId ?? "") ===
                  String(accessPoint.id)
                }
                onClick={() =>
                  onSelect?.(accessPoint)
                }
              />
            );
          },
        )}
      </CompatibleSchoolMap>
    </div>
  );
}

export default AccessPointMap;
