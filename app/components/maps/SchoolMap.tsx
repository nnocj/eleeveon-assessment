"use client";

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clusterMarkers,
  filterMarkersByLayers,
  searchMarkers,
  splitClusters,
  viewportForMarkers,
  type MapMarker,
  type MarkerCluster,
  type MapViewport,
} from "../../lib/maps";
import {
  EntitySearchToolbar,
  PageToolbar,
} from "../shared";
import { MapCanvas } from "./core/MapCanvas";
import { MapContainer } from "./core/MapContainer";
import {
  MapProvider,
  useMapController,
} from "./core/MapProvider";
import type {
  Coordinate,
  MapCreateEntityType,
  MapCreateRequest,
  MapLayerDefinition,
  MapLocationDraft,
  MapLocationUpdateRequest,
  SchoolMapData,
} from "./core/types";
import { MapViewportController } from "./core/MapViewportController";
import {
  MapMarker as MapMarkerVisual,
  MapMarkerCluster,
  MapMarkerPopup,
  TemporaryLocationMarker,
} from "./markers";
import {
  CircleGeofenceOverlay,
  MapHeatmapOverlay,
  RouteOverlay,
  TrackingTrailOverlay,
} from "./overlays";
import {
  MapCreateLocationSheet,
  MapDetailsSheet,
  MapFilterSheet,
  MapLegend,
  MapLocationEditSheet,
} from "./panels";

const GHANA_VIEWPORT: MapViewport = {
  center: {
    latitude: 7.9465,
    longitude: -1.0232,
  },
  zoom: 7,
};

export interface SchoolMapProps
  extends SchoolMapData {
  layers?: readonly MapLayerDefinition[];
  initialViewport?: MapViewport;
  height?: number | string;
  cluster?: boolean;
  clusterRadiusPixels?: number;
  searchable?: boolean;
  filterable?: boolean;
  showLegend?: boolean;
  showPopup?: boolean;
  fitMarkers?: boolean;
  toolbarActions?: ReactNode;
  emptyView?: ReactNode;
  tileUrl?: string;
  tileAttribution?: string;
  onMarkerSelect?: (
    marker: MapMarker | null,
  ) => void;
  onClusterSelect?: (
    cluster: MarkerCluster | null,
  ) => void;
  onCoordinateSelect?: (coordinate: Coordinate) => void;

  /** Enable click-on-map creation actions. */
  allowCreateAtLocation?: boolean;

  /** Entity choices shown after the user clicks an empty map location. */
  createEntityTypes?: readonly MapCreateEntityType[];

  /** Called only after the user chooses an entity from the location sheet. */
  onCreateAtLocation?: (request: MapCreateRequest) => void;

  /** Show Move location for selected markers. */
  allowLocationEditing?: boolean;

  /** Persist the confirmed location change in the owning page. */
  onLocationUpdate?: (
    request: MapLocationUpdateRequest,
  ) => void | Promise<void>;
}

function inferLayers(
  markers: readonly MapMarker[],
): MapLayerDefinition[] {
  const groups = new Map<
    string,
    MapMarker[]
  >();

  for (const marker of markers) {
    const id = marker.layerId ?? "default";
    const group = groups.get(id) ?? [];
    group.push(marker);
    groups.set(id, group);
  }

  return [...groups.entries()].map(
    ([id, group]) => ({
      id,
      label: id
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) =>
          character.toUpperCase(),
        ),
      count: group.length,
      enabled: true,
    }),
  );
}

function SchoolMapInner({
  markers = [],
  geofences = [],
  routes = [],
  trackingTrails = [],
  heatPoints = [],
  layers: providedLayers,
  height,
  cluster = true,
  clusterRadiusPixels = 56,
  searchable = true,
  filterable = true,
  showLegend = true,
  showPopup = true,
  fitMarkers = true,
  toolbarActions,
  emptyView,
  tileUrl,
  tileAttribution,
  onMarkerSelect,
  onClusterSelect,
  onCoordinateSelect,
  allowCreateAtLocation = false,
  createEntityTypes = [],
  onCreateAtLocation,
  allowLocationEditing = false,
  onLocationUpdate,
}: Omit<SchoolMapProps, "initialViewport">) {
  const controller = useMapController();
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] =
    useState(false);
  const [detailsOpen, setDetailsOpen] =
    useState(false);
  const [
    selectedCluster,
    setSelectedCluster,
  ] = useState<MarkerCluster | null>(null);
  const [pendingCoordinate, setPendingCoordinate] =
    useState<Coordinate | null>(null);
  const [createLocationOpen, setCreateLocationOpen] =
    useState(false);
  const [locationDraft, setLocationDraft] =
    useState<MapLocationDraft | null>(null);
  const [locationEditSaving, setLocationEditSaving] =
    useState(false);
  const [locationEditError, setLocationEditError] =
    useState<string | null>(null);

  const layers = useMemo(
    () =>
      providedLayers ??
      inferLayers(markers),
    [markers, providedLayers],
  );

  const enabledLayerIds = useMemo(() => {
    if (controller.enabledLayerIds.size) {
      return controller.enabledLayerIds;
    }

    return new Set(
      layers
        .filter(
          (layer) =>
            layer.enabled !== false,
        )
        .map((layer) => layer.id),
    );
  }, [
    controller.enabledLayerIds,
    layers,
  ]);

  const visibleMarkers = useMemo(() => {
    const searched = searchMarkers(
      markers,
      query,
    );

    return filterMarkersByLayers(
      searched,
      enabledLayerIds,
    );
  }, [
    enabledLayerIds,
    markers,
    query,
  ]);

  const clusterableMarkers = useMemo(
    () =>
      locationDraft
        ? visibleMarkers.filter(
            (marker) =>
              marker.id !== locationDraft.marker.id,
          )
        : visibleMarkers,
    [locationDraft, visibleMarkers],
  );

  const clustered = useMemo(
    () =>
      splitClusters(
        clusterMarkers(
          clusterableMarkers,
          controller.viewport.zoom,
          clusterRadiusPixels,
        ),
      ),
    [
      clusterRadiusPixels,
      clusterableMarkers,
      controller.viewport.zoom,
    ],
  );

  const selectedMarker =
    visibleMarkers.find(
      (marker) =>
        marker.id ===
        controller.selectedMarkerId,
    ) ?? null;

  const selectMarker = (
    marker: MapMarker | null,
  ) => {
    controller.setSelectedMarkerId(
      marker?.id ?? null,
    );
    setSelectedCluster(null);
    onMarkerSelect?.(marker);
  };

  const selectCluster = (
    next: MarkerCluster | null,
  ) => {
    setSelectedCluster(next);
    controller.setSelectedMarkerId(null);
    onClusterSelect?.(next);

    if (next) {
      controller.setViewport(
        (current) => ({
          ...current,
          center: next.coordinate,
          zoom: Math.min(
            19,
            current.zoom + 2,
          ),
          bounds: next.bounds,
        }),
      );
    }
  };

  const startLocationEdit = (
    marker: MapMarker,
  ) => {
    if (!allowLocationEditing || !onLocationUpdate) {
      return;
    }

    setLocationEditError(null);
    setLocationDraft({
      marker,
      previousCoordinate: marker.coordinate,
      coordinate: marker.coordinate,
    });
    setDetailsOpen(false);
    setSelectedCluster(null);
    controller.setSelectedMarkerId(marker.id);
  };

  const cancelLocationEdit = () => {
    if (locationEditSaving) return;

    setLocationDraft(null);
    setLocationEditError(null);
  };

  const saveLocationEdit = async () => {
    if (!locationDraft || !onLocationUpdate) return;

    try {
      setLocationEditSaving(true);
      setLocationEditError(null);

      await onLocationUpdate({
        marker: locationDraft.marker,
        previousCoordinate:
          locationDraft.previousCoordinate,
        coordinate: locationDraft.coordinate,
      });

      setLocationDraft(null);
    } catch (error) {
      console.error(
        "Failed to update map location:",
        error,
      );
      setLocationEditError(
        error instanceof Error
          ? error.message
          : "Failed to save the new location.",
      );
    } finally {
      setLocationEditSaving(false);
    }
  };

  const hasMapData =
    visibleMarkers.length > 0 ||
    geofences.length > 0 ||
    routes.length > 0 ||
    trackingTrails.length > 0 ||
    heatPoints.length > 0;

  return (
    <>
      <MapViewportController
        markers={markers}
        fit={fitMarkers}
        fitKey={markers
          .map((marker) => marker.id)
          .join("|")}
      />

      <MapContainer
        height={height}
        toolbar={
          searchable ||
          filterable ||
          toolbarActions ? (
            <PageToolbar
              compact
              search={
                searchable ? (
                  <EntitySearchToolbar
                    value={query}
                    onChange={setQuery}
                    placeholder="Search map..."
                    resultCount={
                      visibleMarkers.length
                    }
                  />
                ) : undefined
              }
              filterAction={
                filterable ? (
                  <button
                    type="button"
                    onClick={() =>
                      setFilterOpen(true)
                    }
                    aria-label="Open map filters"
                    title="Filters"
                    style={{
                      width: 36,
                      height: 36,
                      border: 0,
                      borderRadius: 10,
                      background:
                        "var(--muted, rgba(148,163,184,.14))",
                      color: "inherit",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    ≡
                  </button>
                ) : undefined
              }
              trailing={toolbarActions}
            />
          ) : undefined
        }
        footer={
          showLegend ? (
            <MapLegend
              layers={layers.map(
                (layer) => ({
                  ...layer,
                  enabled:
                    enabledLayerIds.has(
                      layer.id,
                    ),
                }),
              )}
            />
          ) : undefined
        }
      >
        {!hasMapData ? (
          emptyView ?? (
            <div
              style={{
                position: "absolute",
                zIndex: 650,
                left: 12,
                bottom: 12,
                maxWidth: 280,
                padding: "10px 12px",
                border:
                  "1px solid var(--border, rgba(148,163,184,.32))",
                borderRadius: 12,
                background:
                  "color-mix(in srgb, var(--card, #fff) 92%, transparent)",
                boxShadow:
                  "0 8px 26px rgba(15,23,42,.14)",
                color:
                  "var(--muted-foreground, #64748b)",
                fontSize: 12,
                lineHeight: 1.45,
                pointerEvents: "none",
              }}
            >
              The world map is ready. Add
              coordinates or search for a
              location to place records here.
            </div>
          )
        ) : null}

        <MapCanvas
          tileUrl={tileUrl}
          tileAttribution={
            tileAttribution
          }
          onMapClick={({ coordinate }) => {
            if (locationDraft) return;

            selectMarker(null);
            selectCluster(null);
            onCoordinateSelect?.(coordinate);

            if (
              allowCreateAtLocation &&
              createEntityTypes.length > 0
            ) {
              setPendingCoordinate(coordinate);
              setCreateLocationOpen(true);
            }
          }}
        >
          {heatPoints.length ? (
            <MapHeatmapOverlay
              points={heatPoints}
            />
          ) : null}

          {geofences.map(
            (geofence, index) => (
              <CircleGeofenceOverlay
                key={
                  geofence.id ??
                  `geofence-${index}`
                }
                geofence={geofence}
              />
            ),
          )}

          {routes.map(
            (route, index) => (
              <RouteOverlay
                key={`route-${index}`}
                route={route}
              />
            ),
          )}

          {trackingTrails.map(
            (trail) => (
              <TrackingTrailOverlay
                key={trail.entityId}
                trail={trail}
                showPoints
              />
            ),
          )}

          {(cluster
            ? clustered.singles
            : clusterableMarkers
          ).map((marker) => (
            <MapMarkerVisual
              key={marker.id}
              marker={marker}
              selected={
                marker.id ===
                controller.selectedMarkerId
              }
              onClick={selectMarker}
            />
          ))}

          {locationDraft ? (
            <MapMarkerVisual
              key={`location-edit-${locationDraft.marker.id}`}
              marker={{
                ...locationDraft.marker,
                coordinate: locationDraft.coordinate,
              }}
              selected
              draggable
              onDrag={(_, coordinate) => {
                setLocationDraft((current) =>
                  current
                    ? {
                        ...current,
                        coordinate,
                      }
                    : current,
                );
              }}
              onDragEnd={(_, coordinate) => {
                setLocationDraft((current) =>
                  current
                    ? {
                        ...current,
                        coordinate,
                      }
                    : current,
                );
              }}
            />
          ) : null}

          {cluster
            ? clustered.groups.map(
                (markerCluster) => (
                  <MapMarkerCluster
                    key={
                      markerCluster.id
                    }
                    cluster={
                      markerCluster
                    }
                    selected={
                      markerCluster.id ===
                      selectedCluster?.id
                    }
                    onClick={
                      selectCluster
                    }
                  />
                ),
              )
            : null}

          {pendingCoordinate ? (
            <TemporaryLocationMarker
              coordinate={pendingCoordinate}
            />
          ) : null}

          {showPopup &&
          selectedMarker &&
          !locationDraft ? (
            <MapMarkerPopup
              marker={selectedMarker}
              onClose={() =>
                selectMarker(null)
              }
              onOpenDetails={() =>
                setDetailsOpen(true)
              }
            />
          ) : null}
        </MapCanvas>
      </MapContainer>

      <MapFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        layers={layers}
        enabledLayerIds={
          enabledLayerIds
        }
        onLayerEnabledChange={
          controller.setLayerEnabled
        }
        onReset={() => {
          for (const layer of layers) {
            controller.setLayerEnabled(
              layer.id,
              true,
            );
          }
        }}
      />

      <MapCreateLocationSheet
        open={createLocationOpen}
        coordinate={pendingCoordinate}
        entityTypes={createEntityTypes}
        onCreate={(entityType) => {
          if (!pendingCoordinate) return;

          onCreateAtLocation?.({
            entityType,
            coordinate: pendingCoordinate,
            source: "map_click",
          });

          setCreateLocationOpen(false);
          setPendingCoordinate(null);
        }}
        onClose={() => {
          setCreateLocationOpen(false);
          setPendingCoordinate(null);
        }}
      />

      <MapLocationEditSheet
        open={Boolean(locationDraft)}
        marker={locationDraft?.marker}
        previousCoordinate={
          locationDraft?.previousCoordinate
        }
        coordinate={locationDraft?.coordinate}
        saving={locationEditSaving}
        error={locationEditError}
        onSave={saveLocationEdit}
        onCancel={cancelLocationEdit}
      />

      <MapDetailsSheet
        open={
          detailsOpen ||
          Boolean(selectedCluster)
        }
        onOpenChange={(open) => {
          setDetailsOpen(open);

          if (!open) {
            selectCluster(null);
          }
        }}
        marker={selectedMarker}
        cluster={selectedCluster}
        allowLocationEditing={
          allowLocationEditing &&
          Boolean(onLocationUpdate)
        }
        onMoveLocation={startLocationEdit}
        onMarkerSelect={(marker) => {
          selectMarker(marker);
          setDetailsOpen(true);
        }}
      />
    </>
  );
}

export function SchoolMap({
  initialViewport,
  markers = [],
  layers,
  ...props
}: SchoolMapProps) {
  const inferred =
    layers ?? inferLayers(markers);

  const initialLayerIds = inferred
    .filter(
      (layer) =>
        layer.enabled !== false,
    )
    .map((layer) => layer.id);

  const resolvedInitialViewport =
    initialViewport ??
    (markers.length
      ? viewportForMarkers(markers)
      : GHANA_VIEWPORT);

  return (
    <MapProvider
      initialViewport={
        resolvedInitialViewport
      }
      initialLayerIds={
        initialLayerIds
      }
    >
      <SchoolMapInner
        markers={markers}
        layers={inferred}
        {...props}
      />
    </MapProvider>
  );
}

export default SchoolMap;