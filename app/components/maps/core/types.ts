import type { MouseEvent as ReactMouseEvent } from "react";
import type {
  CircleGeofence,
  Coordinate,
  MapBounds,
  MapMarker as MapMarkerData,
  MapViewport,
  MarkerCluster,
  RoutePlan,
  TrackingTrail,
} from "../../../lib/maps";

export type MapCreateEntityType =
  | "student"
  | "parent"
  | "teacher";

export type MapCoordinateSelectionSource =
  | "map_click";

export interface MapCoordinateSelection {
  coordinate: Coordinate;
  source: MapCoordinateSelectionSource;
}

export interface MapCreateRequest {
  entityType: MapCreateEntityType;
  coordinate: Coordinate;
  source: MapCoordinateSelectionSource;
}

export interface MapLocationDraft {
  marker: MapMarkerData;
  previousCoordinate: Coordinate;
  coordinate: Coordinate;
}

export interface MapLocationUpdateRequest {
  marker: MapMarkerData;
  previousCoordinate: Coordinate;
  coordinate: Coordinate;
}

export type MapInteractionMode =
  | "browse"
  | "select"
  | "draw_circle"
  | "measure";

export interface MapLayerDefinition {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  count?: number;
  enabled?: boolean;
  color?: string;
}

export interface MapHeatPoint {
  id: string;
  coordinate: Coordinate;
  weight: number;
  label?: string;
  status?: string;
  sourceIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface MapCanvasProjection {
  coordinateToPoint(
    coordinate: Coordinate,
  ): { x: number; y: number };
  pointToCoordinate(point: {
    x: number;
    y: number;
  }): Coordinate;
}

export interface MapCanvasRenderContext {
  width: number;
  height: number;
  viewport: MapViewport;
  projection: MapCanvasProjection;

  /**
   * Used by draggable map overlays to stop Leaflet from panning while
   * the overlay itself is being moved.
   */
  setMapDraggingEnabled?: (enabled: boolean) => void;
}

export interface SchoolMapSelection {
  marker?: MapMarkerData | null;
  cluster?: MarkerCluster | null;
  coordinate?: Coordinate | null;
}

export interface SchoolMapData {
  markers?: readonly MapMarkerData[];
  geofences?: readonly CircleGeofence[];
  routes?: readonly RoutePlan[];
  trackingTrails?: readonly TrackingTrail[];
  heatPoints?: readonly MapHeatPoint[];
}

export interface MapController {
  viewport: MapViewport;
  setViewport: (
    next:
      | MapViewport
      | ((current: MapViewport) => MapViewport),
  ) => void;
  selectedMarkerId: string | null;
  setSelectedMarkerId: (id: string | null) => void;
  enabledLayerIds: ReadonlySet<string>;
  setLayerEnabled: (layerId: string, enabled: boolean) => void;
  setAllLayersEnabled: (enabled: boolean) => void;
  interactionMode: MapInteractionMode;
  setInteractionMode: (mode: MapInteractionMode) => void;
}

export interface MapTheme {
  background: string;
  foreground: string;
  muted: string;
  border: string;
  primary: string;
  danger: string;
  success: string;
  warning: string;
}

export interface MapCanvasClickEvent {
  coordinate: Coordinate;
  nativeEvent: ReactMouseEvent<SVGSVGElement>;
}

export type {
  CircleGeofence,
  Coordinate,
  MapBounds,
  MapMarkerData,
  MapViewport,
  MarkerCluster,
  RoutePlan,
  TrackingTrail,
};