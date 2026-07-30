"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import L, {
  type LeafletMouseEvent,
  type Map as LeafletMap,
  type TileLayer,
} from "leaflet";
import "leaflet/dist/leaflet.css";

import type {
  Coordinate,
  MapBounds,
  MapViewport,
} from "../../../lib/maps";
import { useMapController } from "./MapProvider";
import type {
  MapCanvasClickEvent,
  MapCanvasProjection,
  MapCanvasRenderContext,
} from "./types";

export interface MapCanvasChildProps {
  mapContext?: MapCanvasRenderContext;
}

export interface MapCanvasProps {
  children?: ReactNode;
  width?: number;
  height?: number;
  viewport?: MapViewport;
  onViewportChange?: (viewport: MapViewport) => void;
  onMapClick?: (event: MapCanvasClickEvent) => void;
  pannable?: boolean;
  zoomable?: boolean;

  /**
   * Kept for backward compatibility. The real tile map replaces the old grid.
   * Set to true only when you want the lightweight coordinate grid above tiles.
   */
  showGrid?: boolean;

  tileUrl?: string;
  tileAttribution?: string;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

const DEFAULT_TILE_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const DEFAULT_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function visibleSpan(zoom: number): {
  latitude: number;
  longitude: number;
} {
  const scale = 2 ** Math.max(0, zoom - 1);

  return {
    latitude: Math.max(0.002, 170 / scale),
    longitude: Math.max(0.002, 360 / scale),
  };
}

function boundsForViewport(viewport: MapViewport): MapBounds {
  if (viewport.bounds) return viewport.bounds;

  const span = visibleSpan(viewport.zoom);

  return {
    north: Math.min(
      90,
      viewport.center.latitude + span.latitude / 2,
    ),
    south: Math.max(
      -90,
      viewport.center.latitude - span.latitude / 2,
    ),
    east: Math.min(
      180,
      viewport.center.longitude + span.longitude / 2,
    ),
    west: Math.max(
      -180,
      viewport.center.longitude - span.longitude / 2,
    ),
  };
}

function fallbackProjection(
  viewport: MapViewport,
  width: number,
  height: number,
): MapCanvasProjection {
  const bounds = boundsForViewport(viewport);
  const longitudeSpan = Math.max(
    0.000001,
    bounds.east - bounds.west,
  );
  const latitudeSpan = Math.max(
    0.000001,
    bounds.north - bounds.south,
  );

  return {
    coordinateToPoint(coordinate) {
      return {
        x:
          ((coordinate.longitude - bounds.west) /
            longitudeSpan) *
          width,
        y:
          ((bounds.north - coordinate.latitude) /
            latitudeSpan) *
          height,
      };
    },
    pointToCoordinate(point) {
      return {
        latitude:
          bounds.north -
          (point.y / height) * latitudeSpan,
        longitude:
          bounds.west +
          (point.x / width) * longitudeSpan,
      };
    },
  };
}

function clampZoom(
  zoom: number,
  minZoom: number,
  maxZoom: number,
): number {
  return Math.max(minZoom, Math.min(maxZoom, zoom));
}

function viewportEquals(
  current: MapViewport,
  next: MapViewport,
): boolean {
  const epsilon = 0.0000001;

  return (
    Math.abs(
      current.center.latitude -
        next.center.latitude,
    ) < epsilon &&
    Math.abs(
      current.center.longitude -
        next.center.longitude,
    ) < epsilon &&
    Math.abs(current.zoom - next.zoom) < epsilon
  );
}

function viewportFromLeaflet(
  map: LeafletMap,
): MapViewport {
  const center = map.getCenter();

  /*
   * Manual movement should save only the current center
   * and zoom.
   *
   * Do not save Leaflet's visible bounds here. In this map
   * system, viewport.bounds means "perform fitBounds".
   * Saving visible bounds after every zoom would immediately
   * trigger another automatic fit and fight the user.
   */
  return {
    center: {
      latitude: center.lat,
      longitude: center.lng,
    },
    zoom: map.getZoom(),
    bounds: undefined,
  };
}

export function MapCanvas({
  children,
  width = 1000,
  height = 650,
  viewport: viewportProp,
  onViewportChange,
  onMapClick,
  pannable = true,
  zoomable = true,
  showGrid = false,
  tileUrl = DEFAULT_TILE_URL,
  tileAttribution = DEFAULT_TILE_ATTRIBUTION,
  minZoom = 1,
  maxZoom = 19,
  className,
  style,
  ariaLabel = "Interactive school map",
}: MapCanvasProps) {
  const controller = useMapController();
  const viewport = viewportProp ?? controller.viewport;

  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastPublishedViewportRef =
    useRef<MapViewport>(viewport);

  const [projectionRevision, setProjectionRevision] = useState(0);

  const controllerRef = useRef(controller);
  const onViewportChangeRef = useRef(onViewportChange);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    controllerRef.current = controller;
  }, [controller]);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  const publishViewport = useCallback(
    (next: MapViewport) => {
      const normalized: MapViewport = {
        ...next,
        zoom: clampZoom(
          next.zoom,
          minZoom,
          maxZoom,
        ),
      };

      if (
        viewportEquals(
          lastPublishedViewportRef.current,
          normalized,
        )
      ) {
        return;
      }

      lastPublishedViewportRef.current = normalized;
      controllerRef.current.setViewport(normalized);
      onViewportChangeRef.current?.(normalized);
    },
    [maxZoom, minZoom],
  );

  const requestProjectionRefresh = useCallback(() => {
    if (frameRef.current !== null) return;

    frameRef.current = window.requestAnimationFrame(
      () => {
        frameRef.current = null;
        setProjectionRevision((revision) => revision + 1);
      },
    );
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || mapRef.current) return;

    const map = L.map(host, {
      center: [
        viewport.center.latitude,
        viewport.center.longitude,
      ],
      zoom: clampZoom(
        viewport.zoom,
        minZoom,
        maxZoom,
      ),
      minZoom,
      maxZoom,
      zoomControl: zoomable,
      dragging: pannable,
      scrollWheelZoom: zoomable,
      doubleClickZoom: zoomable,
      touchZoom: zoomable,
      boxZoom: zoomable,
      keyboard: true,
      worldCopyJump: true,
      attributionControl: true,
    });

    mapRef.current = map;

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      minZoom,
      maxZoom,
      maxNativeZoom: maxZoom,
      crossOrigin: true,
    }).addTo(map);

    const handleMove = () => {
      requestProjectionRefresh();
    };

    const handleMoveEnd = () => {
      requestProjectionRefresh();
      publishViewport(viewportFromLeaflet(map));
    };

    const handleClick = (
      event: LeafletMouseEvent,
    ) => {
      onMapClickRef.current?.({
        coordinate: {
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        },
        nativeEvent:
          event.originalEvent as unknown as MapCanvasClickEvent["nativeEvent"],
      });
    };

    map.on("move zoom resize", handleMove);
    map.on("moveend zoomend", handleMoveEnd);
    map.on("click", handleClick);

    window.setTimeout(() => {
      map.invalidateSize();
      requestProjectionRefresh();
    }, 0);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      map.off("move zoom resize", handleMove);
      map.off("moveend zoomend", handleMoveEnd);
      map.off("click", handleClick);
      map.remove();

      mapRef.current = null;
      tileLayerRef.current = null;
    };
  }, [
    maxZoom,
    minZoom,
    pannable,
    publishViewport,
    requestProjectionRefresh,
    tileAttribution,
    tileUrl,
    zoomable,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (viewport.bounds) {
      const bounds = L.latLngBounds(
        [
          viewport.bounds.south,
          viewport.bounds.west,
        ],
        [
          viewport.bounds.north,
          viewport.bounds.east,
        ],
      );

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          animate: false,
          padding: [30, 30],
          maxZoom,
        });
        return;
      }
    }

    const nextZoom = clampZoom(
      viewport.zoom,
      minZoom,
      maxZoom,
    );
    const currentCenter = map.getCenter();

    const unchanged =
      Math.abs(
        currentCenter.lat -
          viewport.center.latitude,
      ) < 0.0000001 &&
      Math.abs(
        currentCenter.lng -
          viewport.center.longitude,
      ) < 0.0000001 &&
      Math.abs(map.getZoom() - nextZoom) <
        0.0000001;

    if (!unchanged) {
      map.setView(
        [
          viewport.center.latitude,
          viewport.center.longitude,
        ],
        nextZoom,
        { animate: false },
      );
    }
  }, [
    maxZoom,
    minZoom,
    viewport.bounds,
    viewport.center.latitude,
    viewport.center.longitude,
    viewport.zoom,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pannable) map.dragging.enable();
    else map.dragging.disable();

    if (zoomable) {
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoom.enable();
      map.boxZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoom.disable();
      map.boxZoom.disable();
    }
  }, [pannable, zoomable]);

  useEffect(() => {
    const layer = tileLayerRef.current;
    if (!layer) return;

    layer.setUrl(tileUrl);
  }, [tileUrl]);

  const setMapDraggingEnabled = useCallback(
    (enabled: boolean) => {
      const map = mapRef.current;
      if (!map) return;

      if (enabled && pannable) {
        map.dragging.enable();
      } else {
        map.dragging.disable();
      }
    },
    [pannable],
  );

  const projection = useMemo<MapCanvasProjection>(
    () => {
      const map = mapRef.current;

      if (!map) {
        return fallbackProjection(
          viewport,
          width,
          height,
        );
      }

      const size = map.getSize();
      const scaleX =
        size.x > 0 ? width / size.x : 1;
      const scaleY =
        size.y > 0 ? height / size.y : 1;

      return {
        coordinateToPoint(coordinate) {
          const point =
            map.latLngToContainerPoint([
              coordinate.latitude,
              coordinate.longitude,
            ]);

          return {
            x: point.x * scaleX,
            y: point.y * scaleY,
          };
        },
        pointToCoordinate(point) {
          const latLng =
            map.containerPointToLatLng([
              point.x / scaleX,
              point.y / scaleY,
            ]);

          return {
            latitude: latLng.lat,
            longitude: latLng.lng,
          };
        },
      };
    },
    [
      height,
      projectionRevision,
      viewport,
      width,
    ],
  );

  const context = useMemo<MapCanvasRenderContext>(
    () => ({
      width,
      height,
      viewport,
      projection,
      setMapDraggingEnabled,
    }),
    [
      height,
      projection,
      setMapDraggingEnabled,
      viewport,
      width,
    ],
  );

  const enhancedChildren = Children.map(
    children,
    (child) =>
      isValidElement(child)
        ? cloneElement(
            child as ReactElement<MapCanvasChildProps>,
            { mapContext: context },
          )
        : child,
  );

  return (
    <div
      role="application"
      aria-label={ariaLabel}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 220,
        overflow: "hidden",
        background:
          "var(--map-ground, #e5e7eb)",
        touchAction: "none",
        ...style,
      }}
    >
      <div
        ref={hostRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      />

      <svg
        aria-hidden="true"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 400,
          width: "100%",
          height: "100%",
          display: "block",
          overflow: "visible",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <defs>
          <pattern
            id="eleeveon-map-grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="var(--map-grid, rgba(100,116,139,.16))"
              strokeWidth="1"
            />
          </pattern>

          <filter
            id="eleeveon-map-shadow"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodOpacity=".24"
            />
          </filter>
        </defs>

        {showGrid ? (
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill="url(#eleeveon-map-grid)"
            pointerEvents="none"
          />
        ) : null}

        <g style={{ pointerEvents: "auto" }}>
          {enhancedChildren}
        </g>
      </svg>
    </div>
  );
}

export default MapCanvas;