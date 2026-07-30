import type {
  MapBounds,
  MapMarker,
  MarkerCluster,
} from "./types";
import { boundsFromCoordinates } from "./viewport";

function clusterCellSizeDegrees(zoom: number, radiusPixels: number): number {
  const worldPixels = 256 * 2 ** Math.max(0, zoom);
  return (360 / worldPixels) * Math.max(1, radiusPixels);
}

export function clusterMarkers(
  markers: readonly MapMarker[],
  zoom: number,
  radiusPixels = 56,
): MarkerCluster[] {
  const cellSize = clusterCellSizeDegrees(zoom, radiusPixels);
  const cells = new Map<string, MapMarker[]>();

  for (const marker of markers) {
    if (marker.visible === false) continue;

    const x = Math.floor((marker.coordinate.longitude + 180) / cellSize);
    const y = Math.floor((marker.coordinate.latitude + 90) / cellSize);
    const key = `${x}:${y}`;
    (cells.get(key) ?? cells.set(key, []).get(key)!).push(marker);
  }

  return [...cells.entries()].map(([key, group]) => {
    const latitude =
      group.reduce((sum, marker) => sum + marker.coordinate.latitude, 0) /
      group.length;
    const longitude =
      group.reduce((sum, marker) => sum + marker.coordinate.longitude, 0) /
      group.length;
    const bounds =
      boundsFromCoordinates(group.map((marker) => marker.coordinate)) ?? {
        north: latitude,
        south: latitude,
        east: longitude,
        west: longitude,
      };

    return {
      id: `cluster:${zoom}:${key}`,
      coordinate: { latitude, longitude },
      markerIds: group.map((marker) => marker.id),
      markers: group,
      count: group.length,
      bounds,
      layerIds: [...new Set(group.map((marker) => marker.layerId ?? "default"))],
    };
  });
}

export function splitClusters(
  clusters: readonly MarkerCluster[],
): {
  singles: MapMarker[];
  groups: MarkerCluster[];
} {
  const singles: MapMarker[] = [];
  const groups: MarkerCluster[] = [];

  for (const cluster of clusters) {
    if (cluster.count === 1) singles.push(cluster.markers[0]);
    else groups.push(cluster);
  }

  return { singles, groups };
}
