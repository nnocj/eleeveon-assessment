import type {
  Coordinate,
  LineProjectionResult,
  MapBounds,
  PolygonGeofence,
} from "./types";
import { haversineDistanceMeters } from "./distance";

export function pointInPolygon(
  point: Coordinate,
  polygon: readonly Coordinate[],
): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  for (
    let current = 0, previous = polygon.length - 1;
    current < polygon.length;
    previous = current, current += 1
  ) {
    const currentPoint = polygon[current];
    const previousPoint = polygon[previous];

    const intersects =
      currentPoint.latitude > point.latitude !==
        previousPoint.latitude > point.latitude &&
      point.longitude <
        ((previousPoint.longitude - currentPoint.longitude) *
          (point.latitude - currentPoint.latitude)) /
          (previousPoint.latitude - currentPoint.latitude || Number.EPSILON) +
          currentPoint.longitude;

    if (intersects) inside = !inside;
  }

  return inside;
}

export function polygonCentroid(
  points: readonly Coordinate[],
): Coordinate | null {
  if (!points.length) return null;

  let latitude = 0;
  let longitude = 0;

  for (const point of points) {
    latitude += point.latitude;
    longitude += point.longitude;
  }

  return {
    latitude: latitude / points.length,
    longitude: longitude / points.length,
  };
}

export function polygonAreaSquareMeters(
  points: readonly Coordinate[],
): number {
  if (points.length < 3) return 0;

  const centroid = polygonCentroid(points);
  if (!centroid) return 0;

  const latitudeScale = 111_320;
  const longitudeScale =
    111_320 * Math.cos((centroid.latitude * Math.PI) / 180);

  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];

    const currentX =
      (current.longitude - centroid.longitude) * longitudeScale;
    const currentY =
      (current.latitude - centroid.latitude) * latitudeScale;
    const nextX = (next.longitude - centroid.longitude) * longitudeScale;
    const nextY = (next.latitude - centroid.latitude) * latitudeScale;

    area += currentX * nextY - nextX * currentY;
  }

  return Math.abs(area) / 2;
}

export function boundsContainCoordinate(
  bounds: MapBounds,
  coordinate: Coordinate,
): boolean {
  const latitudeInside =
    coordinate.latitude >= bounds.south &&
    coordinate.latitude <= bounds.north;

  const longitudeInside =
    bounds.west <= bounds.east
      ? coordinate.longitude >= bounds.west &&
        coordinate.longitude <= bounds.east
      : coordinate.longitude >= bounds.west ||
        coordinate.longitude <= bounds.east;

  return latitudeInside && longitudeInside;
}

export function projectPointOntoLine(
  point: Coordinate,
  line: readonly Coordinate[],
): LineProjectionResult | null {
  if (line.length < 2) return null;

  let best: LineProjectionResult | null = null;
  const latitudeScale = 111_320;
  const longitudeScale =
    111_320 * Math.cos((point.latitude * Math.PI) / 180);

  for (let index = 0; index < line.length - 1; index += 1) {
    const start = line[index];
    const end = line[index + 1];

    const startX = (start.longitude - point.longitude) * longitudeScale;
    const startY = (start.latitude - point.latitude) * latitudeScale;
    const endX = (end.longitude - point.longitude) * longitudeScale;
    const endY = (end.latitude - point.latitude) * latitudeScale;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const lengthSquared = deltaX ** 2 + deltaY ** 2;

    const fraction =
      lengthSquared === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              -(startX * deltaX + startY * deltaY) / lengthSquared,
            ),
          );

    const projected: Coordinate = {
      latitude: start.latitude + (end.latitude - start.latitude) * fraction,
      longitude:
        start.longitude + (end.longitude - start.longitude) * fraction,
    };

    const distanceMeters = haversineDistanceMeters(point, projected);

    if (!best || distanceMeters < best.distanceMeters) {
      best = {
        point: projected,
        distanceMeters,
        segmentIndex: index,
        fraction,
      };
    }
  }

  return best;
}

export function closePolygon(
  points: readonly Coordinate[],
): Coordinate[] {
  if (!points.length) return [];
  const result = [...points];
  const first = result[0];
  const last = result[result.length - 1];

  if (
    first.latitude !== last.latitude ||
    first.longitude !== last.longitude
  ) {
    result.push({ ...first });
  }

  return result;
}
