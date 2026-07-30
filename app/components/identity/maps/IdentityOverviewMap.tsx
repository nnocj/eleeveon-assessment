"use client";

import { useMemo } from "react";

import {
  identityEntitiesToMapMarkers,
} from "@/app/lib/identity/maps";

import {
  DomainMap,
  type DomainMapMarker,
} from "../../maps/DomainMap";

type IdentityMapInput =
  Parameters<
    typeof identityEntitiesToMapMarkers
  >[0];

export interface IdentityOverviewMapProps
  extends IdentityMapInput {
  selectedMarkerId?: string | null;
  height?: number | string;
  loading?: boolean;
  onMarkerSelect?: (
    marker: DomainMapMarker,
  ) => void;
}

export function IdentityOverviewMap({
  students,
  teachers,
  parents,
  accessPoints,
  devices,
  activityEvents,
  transportStops,
  personPrivacy,
  selectedMarkerId,
  height = 420,
  loading = false,
  onMarkerSelect,
}: IdentityOverviewMapProps) {
  const markers = useMemo(
    () =>
      identityEntitiesToMapMarkers({
        students,
        teachers,
        parents,
        accessPoints,
        devices,
        activityEvents,
        transportStops,
        personPrivacy,
      }),
    [
      students,
      teachers,
      parents,
      accessPoints,
      devices,
      activityEvents,
      transportStops,
      personPrivacy,
    ],
  );

  return (
    <DomainMap
      markers={markers}
      selectedMarkerId={selectedMarkerId}
      height={height}
      loading={loading}
      emptyTitle="No identity locations"
      emptyMessage="People, access points, devices, activity and transport stops will appear when location sharing permits."
      onMarkerClick={onMarkerSelect}
    />
  );
}

export default IdentityOverviewMap;
