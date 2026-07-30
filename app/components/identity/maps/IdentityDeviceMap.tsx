"use client";

import { useMemo } from "react";

import {
  deviceToMapMarker,
} from "@/app/lib/identity/maps";

import {
  DomainMap,
  type DomainMapMarker,
} from "../../maps/DomainMap";

type IdentityDevice =
  Parameters<typeof deviceToMapMarker>[0];

type DeviceOptions =
  Parameters<typeof deviceToMapMarker>[1];

export interface IdentityDeviceMapProps {
  devices: readonly IdentityDevice[];
  markerOptions?: DeviceOptions;
  selectedDeviceId?: string | null;
  height?: number | string;
  loading?: boolean;
  onDeviceSelect?: (
    marker: DomainMapMarker,
  ) => void;
}

export function IdentityDeviceMap({
  devices,
  markerOptions,
  selectedDeviceId,
  height = 380,
  loading = false,
  onDeviceSelect,
}: IdentityDeviceMapProps) {
  const markers = useMemo(
    () =>
      devices
        .map((device) =>
          deviceToMapMarker(
            device,
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
    [devices, markerOptions],
  );

  return (
    <DomainMap
      markers={markers}
      selectedMarkerId={selectedDeviceId}
      height={height}
      loading={loading}
      emptyTitle="No located identity devices"
      emptyMessage="Active scanners, terminals and readers with known coordinates will appear here."
      onMarkerClick={onDeviceSelect}
    />
  );
}

export default IdentityDeviceMap;
