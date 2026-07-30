import {
  MAX_LATITUDE,
  MAX_LONGITUDE,
  MIN_LATITUDE,
  MIN_LONGITUDE,
} from "./constants";
import type { Coordinate, Coordinate3D, MapLocationLike } from "./types";

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isValidLatitude(value: unknown): value is number {
  return isFiniteNumber(value) && value >= MIN_LATITUDE && value <= MAX_LATITUDE;
}

export function isValidLongitude(value: unknown): value is number {
  return (
    isFiniteNumber(value) &&
    value >= MIN_LONGITUDE &&
    value <= MAX_LONGITUDE
  );
}

export function isValidCoordinate(value: unknown): value is Coordinate {
  if (!value || typeof value !== "object") return false;
  const coordinate = value as Partial<Coordinate>;
  return (
    isValidLatitude(coordinate.latitude) &&
    isValidLongitude(coordinate.longitude)
  );
}

export function coordinateFrom(
  value: MapLocationLike | Coordinate | null | undefined,
): Coordinate | null {
  if (!value) return null;
  if (!isValidLatitude(value.latitude) || !isValidLongitude(value.longitude)) {
    return null;
  }

  return {
    latitude: value.latitude,
    longitude: value.longitude,
  };
}

export function coordinate3DFrom(
  value: MapLocationLike | Coordinate3D | null | undefined,
): Coordinate3D | null {
  const coordinate = coordinateFrom(value);
  if (!coordinate) return null;

  return {
    ...coordinate,
    altitudeMeters:
      isFiniteNumber(value?.altitudeMeters) ? value.altitudeMeters : null,
  };
}

export function normalizeLongitude(longitude: number): number {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

export function clampLatitude(latitude: number): number {
  return Math.max(MIN_LATITUDE, Math.min(MAX_LATITUDE, latitude));
}

export function normalizeCoordinate(coordinate: Coordinate): Coordinate {
  return {
    latitude: clampLatitude(coordinate.latitude),
    longitude: normalizeLongitude(coordinate.longitude),
  };
}

export function coordinatesEqual(
  a: Coordinate | null | undefined,
  b: Coordinate | null | undefined,
  tolerance = 1e-9,
): boolean {
  if (!a || !b) return false;
  return (
    Math.abs(a.latitude - b.latitude) <= tolerance &&
    Math.abs(a.longitude - b.longitude) <= tolerance
  );
}

export function formatCoordinate(
  coordinate: Coordinate | null | undefined,
  precision = 6,
): string {
  if (!coordinate || !isValidCoordinate(coordinate)) return "";
  return `${coordinate.latitude.toFixed(precision)}, ${coordinate.longitude.toFixed(precision)}`;
}

export function parseCoordinate(value: string): Coordinate | null {
  const parts = value
    .trim()
    .replace(/[()]/g, "")
    .split(/[\s,;]+/)
    .filter(Boolean);

  if (parts.length < 2) return null;

  const latitude = Number(parts[0]);
  const longitude = Number(parts[1]);
  return coordinateFrom({ latitude, longitude });
}

export function roundCoordinate(
  coordinate: Coordinate,
  precision = 6,
): Coordinate {
  const factor = 10 ** precision;
  return {
    latitude: Math.round(coordinate.latitude * factor) / factor,
    longitude: Math.round(coordinate.longitude * factor) / factor,
  };
}

export function deterministicApproximateCoordinate(
  coordinate: Coordinate,
  entityKey: string,
  radiusMeters: number,
): Coordinate {
  let hash = 2166136261;
  for (const character of entityKey) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  const angle = ((hash >>> 0) % 360) * (Math.PI / 180);
  const distance = Math.max(1, ((hash >>> 8) % 1000) / 1000 * radiusMeters);
  const latitudeOffset = (distance * Math.cos(angle)) / 111_320;
  const longitudeScale = Math.max(
    0.01,
    Math.cos(coordinate.latitude * (Math.PI / 180)),
  );
  const longitudeOffset =
    (distance * Math.sin(angle)) / (111_320 * longitudeScale);

  return normalizeCoordinate({
    latitude: coordinate.latitude + latitudeOffset,
    longitude: coordinate.longitude + longitudeOffset,
  });
}
