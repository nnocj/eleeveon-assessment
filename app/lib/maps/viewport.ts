import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
} from "./constants";
import type {
  Coordinate,
  MapBounds,
  MapMarker,
  MapViewport,
} from "./types";

export function boundsFromCoordinates(
  coordinates: readonly Coordinate[],
): MapBounds | null {
  if (!coordinates.length) return null;

  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;

  for (const coordinate of coordinates) {
    north = Math.max(north, coordinate.latitude);
    south = Math.min(south, coordinate.latitude);
    east = Math.max(east, coordinate.longitude);
    west = Math.min(west, coordinate.longitude);
  }

  return { north, south, east, west };
}

export function boundsFromMarkers(
  markers: readonly MapMarker[],
): MapBounds | null {
  return boundsFromCoordinates(
    markers
      .filter((marker) => marker.visible !== false)
      .map((marker) => marker.coordinate),
  );
}

export function centerOfBounds(bounds: MapBounds): Coordinate {
  return {
    latitude: (bounds.north + bounds.south) / 2,
    longitude: (bounds.east + bounds.west) / 2,
  };
}

export function expandBounds(
  bounds: MapBounds,
  paddingRatio = 0.1,
): MapBounds {
  const latitudeSpan = Math.max(0.0001, bounds.north - bounds.south);
  const longitudeSpan = Math.max(0.0001, bounds.east - bounds.west);

  return {
    north: Math.min(90, bounds.north + latitudeSpan * paddingRatio),
    south: Math.max(-90, bounds.south - latitudeSpan * paddingRatio),
    east: Math.min(180, bounds.east + longitudeSpan * paddingRatio),
    west: Math.max(-180, bounds.west - longitudeSpan * paddingRatio),
  };
}

export function approximateZoomForBounds(
  bounds: MapBounds,
): number {
  const longitudeSpan = Math.max(
    0.000001,
    Math.abs(bounds.east - bounds.west),
  );
  const latitudeSpan = Math.max(
    0.000001,
    Math.abs(bounds.north - bounds.south),
  );
  const span = Math.max(longitudeSpan, latitudeSpan);
  const zoom = Math.log2(360 / span);
  return Math.max(
    MIN_MAP_ZOOM,
    Math.min(MAX_MAP_ZOOM, Math.floor(zoom)),
  );
}

export function viewportForCoordinates(
  coordinates: readonly Coordinate[],
  fallbackCenter: Coordinate = DEFAULT_MAP_CENTER,
): MapViewport {
  const bounds = boundsFromCoordinates(coordinates);

  if (!bounds) {
    return {
      center: fallbackCenter,
      zoom: DEFAULT_MAP_ZOOM,
    };
  }

  if (coordinates.length === 1) {
    return {
      center: coordinates[0],
      zoom: 17,
      bounds,
    };
  }

  const padded = expandBounds(bounds);
  return {
    center: centerOfBounds(padded),
    zoom: approximateZoomForBounds(padded),
    bounds: padded,
  };
}

export function viewportForMarkers(
  markers: readonly MapMarker[],
  fallbackCenter?: Coordinate,
): MapViewport {
  return viewportForCoordinates(
    markers
      .filter((marker) => marker.visible !== false)
      .map((marker) => marker.coordinate),
    fallbackCenter,
  );
}
