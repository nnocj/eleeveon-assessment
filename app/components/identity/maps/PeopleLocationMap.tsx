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

export interface PeopleLocationMapProps {
  students?: IdentityMapInput["students"];
  teachers?: IdentityMapInput["teachers"];
  parents?: IdentityMapInput["parents"];
  personPrivacy?: IdentityMapInput["personPrivacy"];
  selectedPersonId?: string | null;
  height?: number | string;
  loading?: boolean;
  onPersonSelect?: (
    marker: DomainMapMarker,
  ) => void;
}

export function PeopleLocationMap({
  students,
  teachers,
  parents,
  personPrivacy,
  selectedPersonId,
  height = 400,
  loading = false,
  onPersonSelect,
}: PeopleLocationMapProps) {
  const markers = useMemo(
    () =>
      identityEntitiesToMapMarkers({
        students,
        teachers,
        parents,
        personPrivacy,
      }),
    [
      students,
      teachers,
      parents,
      personPrivacy,
    ],
  );

  return (
    <DomainMap
      markers={markers}
      selectedMarkerId={selectedPersonId}
      height={height}
      loading={loading}
      emptyTitle="No permitted people locations"
      emptyMessage="Only active people with valid coordinates and the required privacy consent are displayed."
      onMarkerClick={onPersonSelect}
    />
  );
}

export default PeopleLocationMap;
