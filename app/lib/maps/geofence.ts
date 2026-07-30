import type {
  CircleGeofence,
  Coordinate,
  Geofence,
  GeofenceCheckResult,
  PolygonGeofence,
} from "./types";
import {
  destinationCoordinate,
  haversineDistanceMeters,
} from "./distance";
import {
  pointInPolygon,
  projectPointOntoLine,
} from "./geometry";

export function isCircleGeofence(
  geofence: Geofence,
): geofence is CircleGeofence {
  return "center" in geofence && "radiusMeters" in geofence;
}

export function isPolygonGeofence(
  geofence: Geofence,
): geofence is PolygonGeofence {
  return "points" in geofence;
}

export function checkCircleGeofence(
  coordinate: Coordinate,
  geofence: CircleGeofence,
): GeofenceCheckResult {
  const distanceFromCenter = haversineDistanceMeters(
    coordinate,
    geofence.center,
  );

  return {
    inside: distanceFromCenter <= geofence.radiusMeters,
    distanceToBoundaryMeters: Math.abs(
      distanceFromCenter - geofence.radiusMeters,
    ),
    nearestPoint: destinationCoordinate(
      geofence.center,
      geofence.radiusMeters,
      0,
    ),
  };
}

export function checkPolygonGeofence(
  coordinate: Coordinate,
  geofence: PolygonGeofence,
): GeofenceCheckResult {
  const projection = projectPointOntoLine(
    coordinate,
    [...geofence.points, geofence.points[0]].filter(Boolean),
  );

  return {
    inside: pointInPolygon(coordinate, geofence.points),
    distanceToBoundaryMeters:
      projection?.distanceMeters ?? Number.POSITIVE_INFINITY,
    nearestPoint: projection?.point,
  };
}

export function checkGeofence(
  coordinate: Coordinate,
  geofence: Geofence,
): GeofenceCheckResult {
  return isCircleGeofence(geofence)
    ? checkCircleGeofence(coordinate, geofence)
    : checkPolygonGeofence(coordinate, geofence);
}

export function coordinateInsideAnyGeofence(
  coordinate: Coordinate,
  geofences: readonly Geofence[],
): boolean {
  return geofences.some(
    (geofence) => checkGeofence(coordinate, geofence).inside,
  );
}

export function nearestGeofence(
  coordinate: Coordinate,
  geofences: readonly Geofence[],
): { geofence: Geofence; result: GeofenceCheckResult } | null {
  let best:
    | { geofence: Geofence; result: GeofenceCheckResult }
    | null = null;

  for (const geofence of geofences) {
    const result = checkGeofence(coordinate, geofence);
    if (
      !best ||
      result.distanceToBoundaryMeters <
        best.result.distanceToBoundaryMeters
    ) {
      best = { geofence, result };
    }
  }

  return best;
}
