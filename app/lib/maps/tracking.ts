import {
  DEFAULT_LOCATION_STALE_AFTER_MS,
  DEFAULT_TRACKING_MAX_ACCURACY_METERS,
} from "./constants";
import type {
  TrackingPoint,
  TrackingSnapshot,
  TrackingTrail,
} from "./types";
import {
  haversineDistanceMeters,
  pathDistanceMeters,
} from "./distance";
import { boundsFromCoordinates } from "./viewport";

export function isTrackingPointUsable(
  point: TrackingPoint,
  maximumAccuracyMeters = DEFAULT_TRACKING_MAX_ACCURACY_METERS,
): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    (point.accuracyMeters == null ||
      point.accuracyMeters <= maximumAccuracyMeters)
  );
}

export function sortTrackingPoints(
  points: readonly TrackingPoint[],
): TrackingPoint[] {
  return [...points].sort(
    (a, b) => (a.capturedAt ?? 0) - (b.capturedAt ?? 0),
  );
}

export function trackingSnapshot(
  points: readonly TrackingPoint[],
  now = Date.now(),
  staleAfterMs = DEFAULT_LOCATION_STALE_AFTER_MS,
): TrackingSnapshot | null {
  const sorted = sortTrackingPoints(
    points.filter(isTrackingPointUsable),
  );

  const latest = sorted.at(-1);
  if (!latest) return null;

  const previous = sorted.at(-2);

  const elapsedMilliseconds = previous
    ? Math.max(
        0,
        (latest.capturedAt ?? 0) -
          (previous.capturedAt ?? 0),
      )
    : 0;

  const distanceFromPreviousMeters = previous
    ? haversineDistanceMeters(previous, latest)
    : 0;

  const calculatedSpeedMetersPerSecond =
    elapsedMilliseconds > 0
      ? distanceFromPreviousMeters /
        (elapsedMilliseconds / 1_000)
      : latest.speedMetersPerSecond ?? 0;

  return {
    entityId: latest.entityId,
    latest,
    previous,
    distanceFromPreviousMeters,
    elapsedMilliseconds,
    calculatedSpeedMetersPerSecond,
    stale:
      latest.capturedAt == null ||
      now - latest.capturedAt > staleAfterMs,
  };
}

export function buildTrackingTrail(
  entityId: string,
  points: readonly TrackingPoint[],
): TrackingTrail {
  const sorted = sortTrackingPoints(
    points.filter(
      (point) =>
        point.entityId === entityId &&
        isTrackingPointUsable(point),
    ),
  );

  const firstPoint = sorted[0];
  const lastPoint = sorted.at(-1);

  return {
    entityId,
    points: sorted,
    totalDistanceMeters: pathDistanceMeters(sorted),
    startedAt: firstPoint?.capturedAt ?? undefined,
    endedAt: lastPoint?.capturedAt ?? undefined,
    bounds: boundsFromCoordinates(sorted),
  };
}

export function compressTrackingTrail(
  points: readonly TrackingPoint[],
  minimumDistanceMeters = 5,
  minimumIntervalMs = 5_000,
): TrackingPoint[] {
  const sorted = sortTrackingPoints(points);
  if (sorted.length < 2) return sorted;

  const result = [sorted[0]];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = result[result.length - 1];

    const distance = haversineDistanceMeters(
      previous,
      current,
    );

    const elapsed =
      (current.capturedAt ?? 0) -
      (previous.capturedAt ?? 0);

    if (
      distance >= minimumDistanceMeters ||
      elapsed >= minimumIntervalMs ||
      index === sorted.length - 1
    ) {
      result.push(current);
    }
  }

  return result;
}