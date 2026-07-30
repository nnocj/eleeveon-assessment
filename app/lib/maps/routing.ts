import {
  DEFAULT_DRIVING_SPEED_METERS_PER_SECOND,
} from "./constants";
import type {
  Coordinate,
  RoutePlan,
  RouteSegment,
  RouteWaypoint,
} from "./types";
import {
  haversineDistanceMeters,
  pathDistanceMeters,
} from "./distance";
import { boundsFromCoordinates } from "./viewport";

export function estimateTravelSeconds(
  distanceMeters: number,
  speedMetersPerSecond = DEFAULT_DRIVING_SPEED_METERS_PER_SECOND,
): number {
  if (speedMetersPerSecond <= 0) return 0;
  return Math.round(distanceMeters / speedMetersPerSecond);
}

export function buildStraightLineRoute(
  waypoints: readonly RouteWaypoint[],
  speedMetersPerSecond = DEFAULT_DRIVING_SPEED_METERS_PER_SECOND,
): RoutePlan {
  const segments: RouteSegment[] = [];

  for (let index = 1; index < waypoints.length; index += 1) {
    const from = waypoints[index - 1];
    const to = waypoints[index];
    const distanceMeters = haversineDistanceMeters(from, to);

    segments.push({
      from,
      to,
      distanceMeters,
      estimatedDurationSeconds:
        estimateTravelSeconds(distanceMeters, speedMetersPerSecond) +
        (from.stopDurationSeconds ?? 0),
    });
  }

  return {
    waypoints: [...waypoints],
    segments,
    totalDistanceMeters: segments.reduce(
      (sum, segment) => sum + segment.distanceMeters,
      0,
    ),
    estimatedDurationSeconds: segments.reduce(
      (sum, segment) => sum + segment.estimatedDurationSeconds,
      0,
    ),
    bounds: boundsFromCoordinates(waypoints),
  };
}

export function nearestNeighborOrder(
  origin: Coordinate,
  waypoints: readonly RouteWaypoint[],
): RouteWaypoint[] {
  const remaining = [...waypoints];
  const ordered: RouteWaypoint[] = [];
  let current = origin;

  while (remaining.length) {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < remaining.length; index += 1) {
      const distance = haversineDistanceMeters(current, remaining[index]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    const [nearest] = remaining.splice(nearestIndex, 1);
    ordered.push(nearest);
    current = nearest;
  }

  return ordered;
}

export function optimizeWaypointOrder(
  origin: RouteWaypoint,
  destinations: readonly RouteWaypoint[],
  returnToOrigin = false,
): RouteWaypoint[] {
  const ordered = nearestNeighborOrder(origin, destinations);
  return returnToOrigin
    ? [origin, ...ordered, origin]
    : [origin, ...ordered];
}

export function routeProgress(
  routeCoordinates: readonly Coordinate[],
  travelledCoordinates: readonly Coordinate[],
): number {
  const total = pathDistanceMeters(routeCoordinates);
  if (!total) return 0;

  const travelled = pathDistanceMeters(travelledCoordinates);
  return Math.max(0, Math.min(1, travelled / total));
}
