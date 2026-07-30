"use client";

import { useMemo } from "react";

import {
  identityEntitiesToMapMarkers,
} from "@/app/lib/identity/maps";

import {
  DomainMap,
  type DomainMapMarker,
  type DomainMapPath,
} from "../../maps/DomainMap";

type IdentityMapInput =
  Parameters<
    typeof identityEntitiesToMapMarkers
  >[0];

export interface TransportJourneyPath
  extends DomainMapPath {}

export interface TransportJourneyMapProps {
  transportStops: NonNullable<
    IdentityMapInput["transportStops"]
  >;
  devices?: IdentityMapInput["devices"];
  activityEvents?: IdentityMapInput["activityEvents"];
  journeyPaths?: readonly TransportJourneyPath[];
  selectedMarkerId?: string | null;
  height?: number | string;
  loading?: boolean;
  onMarkerSelect?: (
    marker: DomainMapMarker,
  ) => void;
}

export function TransportJourneyMap({
  transportStops,
  devices,
  activityEvents,
  journeyPaths = [],
  selectedMarkerId,
  height = 420,
  loading = false,
  onMarkerSelect,
}: TransportJourneyMapProps) {
  const markers = useMemo(
    () =>
      identityEntitiesToMapMarkers({
        transportStops,
        devices,
        activityEvents,
      }),
    [
      transportStops,
      devices,
      activityEvents,
    ],
  );

  return (
    <DomainMap
      markers={markers}
      paths={journeyPaths}
      selectedMarkerId={selectedMarkerId}
      height={height}
      loading={loading}
      emptyTitle="No transport journey locations"
      emptyMessage="Stops, journey devices, activity events and supplied route paths will appear here."
      onMarkerClick={onMarkerSelect}
    />
  );
}

export default TransportJourneyMap;
