"use client";

import {
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  viewportForCoordinates,
  viewportForMarkers,
  type Coordinate,
  type MapMarker,
  type MapViewport,
} from "../../../lib/maps";
import { useMapController } from "./MapProvider";

export interface MapViewportControllerProps {
  viewport?: MapViewport;
  markers?: readonly MapMarker[];
  coordinates?: readonly Coordinate[];
  fit?: boolean;
  fitKey?: string | number;
  fallbackCenter?: Coordinate;
  selectedMarkerId?: string | null;
  selectedZoom?: number;
}

const EPSILON = 0.0000001;

function coordinateEquals(
  first?: Coordinate | null,
  second?: Coordinate | null,
): boolean {
  if (!first || !second) {
    return first === second;
  }

  return (
    Math.abs(
      first.latitude - second.latitude,
    ) < EPSILON &&
    Math.abs(
      first.longitude - second.longitude,
    ) < EPSILON
  );
}

function boundsEqual(
  first?: MapViewport["bounds"],
  second?: MapViewport["bounds"],
): boolean {
  if (!first || !second) {
    return first === second;
  }

  return (
    Math.abs(first.north - second.north) <
      EPSILON &&
    Math.abs(first.south - second.south) <
      EPSILON &&
    Math.abs(first.east - second.east) <
      EPSILON &&
    Math.abs(first.west - second.west) <
      EPSILON
  );
}

function viewportEquals(
  first: MapViewport,
  second: MapViewport,
): boolean {
  return (
    coordinateEquals(
      first.center,
      second.center,
    ) &&
    Math.abs(first.zoom - second.zoom) <
      EPSILON &&
    boundsEqual(
      first.bounds,
      second.bounds,
    )
  );
}

function markerFitSignature(
  markers?: readonly MapMarker[],
): string {
  if (!markers?.length) return "markers:none";

  return markers
    .map(
      (marker) =>
        [
          marker.id,
          marker.coordinate.latitude,
          marker.coordinate.longitude,
        ].join(":"),
    )
    .sort()
    .join("|");
}

function coordinateFitSignature(
  coordinates?: readonly Coordinate[],
): string {
  if (!coordinates?.length) {
    return "coordinates:none";
  }

  return coordinates
    .map(
      (coordinate) =>
        `${coordinate.latitude}:${coordinate.longitude}`,
    )
    .sort()
    .join("|");
}

function viewportSignature(
  viewport?: MapViewport,
): string {
  if (!viewport) return "viewport:none";

  return [
    viewport.center.latitude,
    viewport.center.longitude,
    viewport.zoom,
    viewport.bounds?.north ?? "",
    viewport.bounds?.south ?? "",
    viewport.bounds?.east ?? "",
    viewport.bounds?.west ?? "",
  ].join(":");
}

export function MapViewportController({
  viewport,
  markers,
  coordinates,
  fit = false,
  fitKey,
  fallbackCenter,
  selectedMarkerId,
  selectedZoom = 17,
}: MapViewportControllerProps) {
  const { setViewport } = useMapController();

  /*
   * Prevent the same controlled viewport from being
   * applied repeatedly when its object identity changes.
   */
  const appliedViewportSignatureRef =
    useRef<string>("");

  /*
   * Prevent fit-to-data from running after every render.
   * It should run only when the actual fit input changes.
   */
  const appliedFitSignatureRef =
    useRef<string>("");

  /*
   * Prevent repeatedly centring the same selected marker.
   */
  const appliedSelectionSignatureRef =
    useRef<string>("");

  const controlledViewportSignature =
    useMemo(
      () => viewportSignature(viewport),
      [viewport],
    );

  const markersSignature = useMemo(
    () => markerFitSignature(markers),
    [markers],
  );

  const coordinatesSignature = useMemo(
    () =>
      coordinateFitSignature(coordinates),
    [coordinates],
  );

  const fallbackSignature = useMemo(
    () =>
      fallbackCenter
        ? `${fallbackCenter.latitude}:${fallbackCenter.longitude}`
        : "fallback:none",
    [
      fallbackCenter?.latitude,
      fallbackCenter?.longitude,
    ],
  );

  const selectedMarker = useMemo(() => {
    if (!selectedMarkerId || !markers) {
      return null;
    }

    return (
      markers.find(
        (marker) =>
          marker.id === selectedMarkerId,
      ) ?? null
    );
  }, [
    markers,
    selectedMarkerId,
  ]);

  /*
   * Apply an explicitly supplied viewport.
   */
  useEffect(() => {
    if (!viewport) return;

    if (
      appliedViewportSignatureRef.current ===
      controlledViewportSignature
    ) {
      return;
    }

    appliedViewportSignatureRef.current =
      controlledViewportSignature;

    setViewport((current) =>
      viewportEquals(current, viewport)
        ? current
        : viewport,
    );
  }, [
    controlledViewportSignature,
    setViewport,
    viewport,
  ]);

  /*
   * Fit markers or coordinates only when the real fit
   * inputs change. This avoids the maximum-depth loop and
   * prevents auto-fit from fighting manual map navigation.
   */
  useEffect(() => {
    if (!fit) {
      appliedFitSignatureRef.current = "";
      return;
    }

    const dataSignature = markers
      ? markersSignature
      : coordinatesSignature;

    const nextFitSignature = [
      String(fitKey ?? ""),
      markers ? "markers" : "coordinates",
      dataSignature,
      fallbackSignature,
    ].join("::");

    if (
      appliedFitSignatureRef.current ===
      nextFitSignature
    ) {
      return;
    }

    appliedFitSignatureRef.current =
      nextFitSignature;

    let nextViewport: MapViewport | null =
      null;

    if (markers?.length) {
      nextViewport = viewportForMarkers(
        markers,
        fallbackCenter,
      );
    } else if (coordinates?.length) {
      nextViewport =
        viewportForCoordinates(
          coordinates,
          fallbackCenter,
        );
    }

    if (!nextViewport) return;

    setViewport((current) =>
      viewportEquals(
        current,
        nextViewport as MapViewport,
      )
        ? current
        : (nextViewport as MapViewport),
    );
  }, [
    coordinates,
    coordinatesSignature,
    fallbackCenter,
    fallbackSignature,
    fit,
    fitKey,
    markers,
    markersSignature,
    setViewport,
  ]);

  /*
   * Centre the map when a marker is selected, but only once
   * for that marker/position/zoom combination.
   */
  useEffect(() => {
    if (!selectedMarker) {
      appliedSelectionSignatureRef.current =
        "";
      return;
    }

    const selectionSignature = [
      selectedMarker.id,
      selectedMarker.coordinate.latitude,
      selectedMarker.coordinate.longitude,
      selectedZoom,
    ].join(":");

    if (
      appliedSelectionSignatureRef.current ===
      selectionSignature
    ) {
      return;
    }

    appliedSelectionSignatureRef.current =
      selectionSignature;

    setViewport((current) => {
      const nextViewport: MapViewport = {
        ...current,
        center: selectedMarker.coordinate,
        zoom: Math.max(
          current.zoom,
          selectedZoom,
        ),
        bounds: undefined,
      };

      return viewportEquals(
        current,
        nextViewport,
      )
        ? current
        : nextViewport;
    });
  }, [
    selectedMarker,
    selectedZoom,
    setViewport,
  ]);

  return null;
}

export default MapViewportController;