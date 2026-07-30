"use client";

import type { ComponentProps } from "react";

import { LocationPicker } from "../../maps/inputs/LocationPicker";
import { RadiusField } from "../../maps/inputs/RadiusField";
import { CircleGeofenceOverlay } from "../../maps/overlays/CircleGeofenceOverlay";

export interface AccessPointGeofenceValue {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number | null;
  locationLabel?: string | null;
}

export interface AccessPointGeofenceEditorProps {
  value: AccessPointGeofenceValue;

  onChange: (
    value: AccessPointGeofenceValue,
  ) => void;

  disabled?: boolean;
  minRadiusMeters?: number;
  maxRadiusMeters?: number;
}

type LocationPickerValue =
  ComponentProps<
    typeof LocationPicker
  >["value"];

type CircleGeofence =
  ComponentProps<
    typeof CircleGeofenceOverlay
  >["geofence"];

export function AccessPointGeofenceEditor({
  value,
  onChange,
  disabled = false,
  minRadiusMeters = 5,
  maxRadiusMeters = 5000,
}: AccessPointGeofenceEditorProps) {
  const locationValue: LocationPickerValue =
    value.latitude == null ||
    value.longitude == null
      ? null
      : {
          latitude: value.latitude,
          longitude: value.longitude,
        };

  const radius =
    value.radiusMeters ?? 50;

  function handleLocationChange(
    nextLocation: LocationPickerValue,
  ) {
    if (!nextLocation) {
      onChange({
        ...value,
        latitude: null,
        longitude: null,
      });

      return;
    }

    const possibleLocationLabel =
      "locationLabel" in nextLocation
        ? nextLocation.locationLabel
        : undefined;

    onChange({
      ...value,

      latitude:
        nextLocation.latitude,

      longitude:
        nextLocation.longitude,

      locationLabel:
        typeof possibleLocationLabel ===
        "string"
          ? possibleLocationLabel
          : value.locationLabel ?? null,
    });
  }

  function handleRadiusChange(
    nextRadius: number,
  ) {
    const safeRadius = Math.min(
      maxRadiusMeters,
      Math.max(
        minRadiusMeters,
        nextRadius,
      ),
    );

    onChange({
      ...value,
      radiusMeters: safeRadius,
    });
  }

  

const geofence =
  value.latitude == null ||
  value.longitude == null
    ? null
    : ({
        id: "access-point-geofence",

        center: {
          latitude: value.latitude,
          longitude: value.longitude,
        },

        coordinate: {
          latitude: value.latitude,
          longitude: value.longitude,
        },

        latitude: value.latitude,
        longitude: value.longitude,
        radius: radius,
        radiusMeters: radius,
      } as unknown as CircleGeofence);

      
  return (
    <section
      style={{
        display: "grid",
        gap: 10,
      }}
    >
      <LocationPicker
        value={locationValue}
        onChange={handleLocationChange}
        disabled={disabled}
      />

      <RadiusField
        value={radius}
        onChange={handleRadiusChange}
        minimum={minRadiusMeters}
        maximum={maxRadiusMeters}
        disabled={disabled}
      />

      {geofence ? (
        <CircleGeofenceOverlay
          geofence={geofence}
          selected
        />
      ) : null}
    </section>
  );
}

export default AccessPointGeofenceEditor;
