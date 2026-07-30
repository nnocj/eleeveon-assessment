"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  type MapViewport,
} from "../../../lib/maps";
import type {
  MapController,
  MapInteractionMode,
} from "./types";

const MapContext = createContext<MapController | null>(null);

export interface MapProviderProps {
  children: ReactNode;
  initialViewport?: MapViewport;
  initialLayerIds?: Iterable<string>;
  initialSelectedMarkerId?: string | null;
  initialInteractionMode?: MapInteractionMode;
  onViewportChange?: (viewport: MapViewport) => void;
  onSelectedMarkerChange?: (markerId: string | null) => void;
}

function normalizeViewport(viewport: MapViewport): MapViewport {
  return {
    ...viewport,
    zoom: Math.max(
      MIN_MAP_ZOOM,
      Math.min(MAX_MAP_ZOOM, viewport.zoom),
    ),
    center: {
      latitude: Math.max(
        -90,
        Math.min(90, viewport.center.latitude),
      ),
      longitude: Math.max(
        -180,
        Math.min(180, viewport.center.longitude),
      ),
    },
  };
}

/**
 * Map fitting and browser-map events can produce new viewport objects containing
 * the same values. Treating those objects as state changes creates a render loop
 * between MapViewportController and MapProvider.
 */
function viewportEquals(
  current: MapViewport,
  next: MapViewport,
): boolean {
  const EPSILON = 0.0000001;

  return (
    Math.abs(current.center.latitude - next.center.latitude) < EPSILON &&
    Math.abs(current.center.longitude - next.center.longitude) < EPSILON &&
    Math.abs(current.zoom - next.zoom) < EPSILON
  );
}

export function MapProvider({
  children,
  initialViewport = {
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
  },
  initialLayerIds = [],
  initialSelectedMarkerId = null,
  initialInteractionMode = "browse",
  onViewportChange,
  onSelectedMarkerChange,
}: MapProviderProps) {
  const [viewportState, setViewportState] =
    useState<MapViewport>(() => normalizeViewport(initialViewport));
  const [selectedMarkerIdState, setSelectedMarkerIdState] =
    useState<string | null>(initialSelectedMarkerId);
  const [enabledLayerIdsState, setEnabledLayerIdsState] =
    useState<ReadonlySet<string>>(
      () => new Set(initialLayerIds),
    );
  const [interactionMode, setInteractionMode] =
    useState<MapInteractionMode>(initialInteractionMode);

  const setViewport = useCallback<
    MapController["setViewport"]
  >(
    (next) => {
      setViewportState((current) => {
        const resolved =
          typeof next === "function" ? next(current) : next;
        const normalized = normalizeViewport(resolved);

        // Do not produce a new state object for an unchanged viewport.
        if (viewportEquals(current, normalized)) {
          return current;
        }

        onViewportChange?.(normalized);
        return normalized;
      });
    },
    [onViewportChange],
  );

  const setSelectedMarkerId = useCallback(
    (id: string | null) => {
      setSelectedMarkerIdState((current) => {
        if (current === id) return current;
        onSelectedMarkerChange?.(id);
        return id;
      });
    },
    [onSelectedMarkerChange],
  );

  const setLayerEnabled = useCallback(
    (layerId: string, enabled: boolean) => {
      setEnabledLayerIdsState((current) => {
        const alreadyEnabled = current.has(layerId);

        if (alreadyEnabled === enabled) {
          return current;
        }

        const next = new Set(current);
        if (enabled) next.add(layerId);
        else next.delete(layerId);
        return next;
      });
    },
    [],
  );

  const setAllLayersEnabled = useCallback(
    (enabled: boolean) => {
      setEnabledLayerIdsState((current) => {
        if (!enabled) {
          return current.size ? new Set() : current;
        }

        // The provider does not know every available layer ID, so enabling all
        // preserves the current enabled set. SchoolMap can enable known layers.
        return current;
      });
    },
    [],
  );

  const value = useMemo<MapController>(
    () => ({
      viewport: viewportState,
      setViewport,
      selectedMarkerId: selectedMarkerIdState,
      setSelectedMarkerId,
      enabledLayerIds: enabledLayerIdsState,
      setLayerEnabled,
      setAllLayersEnabled,
      interactionMode,
      setInteractionMode,
    }),
    [
      enabledLayerIdsState,
      interactionMode,
      selectedMarkerIdState,
      setLayerEnabled,
      setSelectedMarkerId,
      setViewport,
      viewportState,
    ],
  );

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapController(): MapController {
  const value = useContext(MapContext);

  if (!value) {
    throw new Error(
      "useMapController must be used inside MapProvider.",
    );
  }

  return value;
}

export default MapProvider;