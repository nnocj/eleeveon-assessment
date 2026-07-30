"use client";

import { useMemo } from "react";

import {
  activityEventToMapMarker,
} from "@/app/lib/identity/maps";

import {
  DomainMap,
  type DomainMapMarker,
} from "../../maps/DomainMap";

type ActivityEvent =
  Parameters<
    typeof activityEventToMapMarker
  >[0];

type ActivityOptions =
  Parameters<
    typeof activityEventToMapMarker
  >[1];

export interface IdentityActivityMapProps {
  events: readonly ActivityEvent[];
  markerOptions?: ActivityOptions;
  selectedEventId?: string | null;
  height?: number | string;
  loading?: boolean;
  onEventSelect?: (
    marker: DomainMapMarker,
  ) => void;
}

export function IdentityActivityMap({
  events,
  markerOptions,
  selectedEventId,
  height = 380,
  loading = false,
  onEventSelect,
}: IdentityActivityMapProps) {
  const markers = useMemo(
    () =>
      events
        .map((event) =>
          activityEventToMapMarker(
            event,
            markerOptions,
          ),
        )
        .filter(
          (
            marker,
          ): marker is NonNullable<
            typeof marker
          > => Boolean(marker),
        ),
    [events, markerOptions],
  );

  return (
    <DomainMap
      markers={markers}
      selectedMarkerId={selectedEventId}
      height={height}
      loading={loading}
      emptyTitle="No identity activity locations"
      emptyMessage="Scans, access events and verification activity with coordinates will appear here."
      onMarkerClick={onEventSelect}
    />
  );
}

export default IdentityActivityMap;
