import type {
  Coordinate,
  MapBounds,
  MapMarker,
  MapEntityType,
} from "./types";
import { coordinateFrom } from "./coordinates";
import { boundsContainCoordinate } from "./geometry";
import { haversineDistanceMeters } from "./distance";

export function createMapMarker(input: {
  id: string;
  entityType: MapEntityType | string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  description?: string;
  layerId?: string;
  status?: string;
  schoolId?: string;
  branchId?: string | null;
  imageUrl?: string;
  icon?: string;
  accuracyMeters?: number | null;
  occurredAt?: number | null;
  restricted?: boolean;
  metadata?: Record<string, unknown>;
  source?: unknown;
}): MapMarker {
  const coordinate = coordinateFrom(input);
  if (!coordinate) {
    throw new Error("A valid latitude and longitude are required.");
  }

  return {
    id: input.id,
    entityType: input.entityType,
    coordinate,
    title: input.title.trim(),
    subtitle: input.subtitle,
    description: input.description,
    layerId: input.layerId,
    status: input.status,
    schoolId: input.schoolId,
    branchId: input.branchId,
    imageUrl: input.imageUrl,
    icon: input.icon,
    accuracyMeters: input.accuracyMeters,
    occurredAt: input.occurredAt,
    restricted: input.restricted,
    visible: true,
    metadata: input.metadata,
    source: input.source,
  };
}

export function filterMarkersByBounds(
  markers: readonly MapMarker[],
  bounds: MapBounds,
): MapMarker[] {
  return markers.filter(
    (marker) =>
      marker.visible !== false &&
      boundsContainCoordinate(bounds, marker.coordinate),
  );
}

export function filterMarkersByLayers(
  markers: readonly MapMarker[],
  enabledLayerIds: ReadonlySet<string>,
): MapMarker[] {
  return markers.filter(
    (marker) =>
      marker.visible !== false &&
      (!marker.layerId || enabledLayerIds.has(marker.layerId)),
  );
}

export function searchMarkers(
  markers: readonly MapMarker[],
  query: string,
): MapMarker[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...markers];

  return markers.filter((marker) =>
    [
      marker.title,
      marker.subtitle,
      marker.description,
      marker.status,
      marker.entityType,
    ].some((value) => String(value ?? "").toLowerCase().includes(needle)),
  );
}

export function sortMarkersByDistance(
  markers: readonly MapMarker[],
  from: Coordinate,
): Array<MapMarker & { distanceMeters: number }> {
  return markers
    .map((marker) => ({
      ...marker,
      distanceMeters: haversineDistanceMeters(from, marker.coordinate),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function groupMarkersByLayer(
  markers: readonly MapMarker[],
): Record<string, MapMarker[]> {
  return markers.reduce<Record<string, MapMarker[]>>((groups, marker) => {
    const layer = marker.layerId ?? "default";
    (groups[layer] ??= []).push(marker);
    return groups;
  }, {});
}
