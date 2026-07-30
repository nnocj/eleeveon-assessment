import {
  EARTH_RADIUS_METERS,
  METERS_PER_KILOMETER,
  METERS_PER_MILE,
} from "./constants";
import type { Coordinate, Coordinate3D } from "./types";

export function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function radiansToDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

export function haversineDistanceMeters(
  from: Coordinate,
  to: Coordinate,
): number {
  const latitude1 = degreesToRadians(from.latitude);
  const latitude2 = degreesToRadians(to.latitude);
  const latitudeDelta = degreesToRadians(to.latitude - from.latitude);
  const longitudeDelta = degreesToRadians(to.longitude - from.longitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)))
  );
}

export function distance3DMeters(
  from: Coordinate3D,
  to: Coordinate3D,
): number {
  const surface = haversineDistanceMeters(from, to);
  const altitudeDelta =
    (to.altitudeMeters ?? 0) - (from.altitudeMeters ?? 0);
  return Math.sqrt(surface ** 2 + altitudeDelta ** 2);
}

export function pathDistanceMeters(
  coordinates: readonly Coordinate[],
): number {
  let total = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    total += haversineDistanceMeters(
      coordinates[index - 1],
      coordinates[index],
    );
  }
  return total;
}

export function initialBearingDegrees(
  from: Coordinate,
  to: Coordinate,
): number {
  const latitude1 = degreesToRadians(from.latitude);
  const latitude2 = degreesToRadians(to.latitude);
  const longitudeDelta = degreesToRadians(to.longitude - from.longitude);

  const y = Math.sin(longitudeDelta) * Math.cos(latitude2);
  const x =
    Math.cos(latitude1) * Math.sin(latitude2) -
    Math.sin(latitude1) *
      Math.cos(latitude2) *
      Math.cos(longitudeDelta);

  return (radiansToDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function destinationCoordinate(
  origin: Coordinate,
  distanceMeters: number,
  bearingDegrees: number,
): Coordinate {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const bearing = degreesToRadians(bearingDegrees);
  const latitude1 = degreesToRadians(origin.latitude);
  const longitude1 = degreesToRadians(origin.longitude);

  const latitude2 = Math.asin(
    Math.sin(latitude1) * Math.cos(angularDistance) +
      Math.cos(latitude1) *
        Math.sin(angularDistance) *
        Math.cos(bearing),
  );

  const longitude2 =
    longitude1 +
    Math.atan2(
      Math.sin(bearing) *
        Math.sin(angularDistance) *
        Math.cos(latitude1),
      Math.cos(angularDistance) -
        Math.sin(latitude1) * Math.sin(latitude2),
    );

  return {
    latitude: radiansToDegrees(latitude2),
    longitude: ((radiansToDegrees(longitude2) + 540) % 360) - 180,
  };
}

export function formatDistance(
  meters: number,
  system: "metric" | "imperial" = "metric",
): string {
  if (!Number.isFinite(meters)) return "";

  if (system === "imperial") {
    const miles = meters / METERS_PER_MILE;
    return miles < 0.1
      ? `${Math.round(meters * 3.28084)} ft`
      : `${miles.toFixed(miles < 10 ? 1 : 0)} mi`;
  }

  return meters < METERS_PER_KILOMETER
    ? `${Math.round(meters)} m`
    : `${(meters / METERS_PER_KILOMETER).toFixed(
        meters < 10_000 ? 1 : 0,
      )} km`;
}
