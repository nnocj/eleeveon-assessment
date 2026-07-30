"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Coordinate,
  MapMarker,
  MapViewport,
} from "../../../lib/maps";
import { createMapMarker } from "../../../lib/maps";
import {
  MapProvider,
  useMapController,
} from "../core/MapProvider";
import { MapContainer } from "../core/MapContainer";
import { MapCanvas } from "../core/MapCanvas";
import { MapMarker as MapMarkerVisual } from "../markers/MapMarker";
import { CoordinateField } from "./CoordinateField";

export interface LocationSearchResult {
  latitude: number;
  longitude: number;
  displayName: string;
  type?: string;
  importance?: number;
  raw?: unknown;
}

export interface LocationPickerProps {
  value: Coordinate | null;
  onChange: (coordinate: Coordinate | null) => void;
  onAddressResolved?: (
    result: LocationSearchResult,
  ) => void;
  initialViewport?: MapViewport;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  showCoordinateFields?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  countryCodes?: readonly string[];
  height?: number | string;
}

const GHANA_VIEWPORT: MapViewport = {
  center: {
    latitude: 7.9465,
    longitude: -1.0232,
  },
  zoom: 7,
};

function PickerViewportSync({
  value,
}: {
  value: Coordinate | null;
}) {
  const controller = useMapController();

  useEffect(() => {
    if (!value) return;

    controller.setViewport((current) => ({
      ...current,
      center: value,
      zoom: Math.max(current.zoom, 16),
      bounds: undefined,
    }));
  }, [
    controller,
    value?.latitude,
    value?.longitude,
  ]);

  return null;
}

function PickerContent({
  value,
  onChange,
  onAddressResolved,
  label,
  helperText,
  disabled,
  showCoordinateFields,
  searchable,
  searchPlaceholder,
  countryCodes,
  height,
}: Omit<LocationPickerProps, "initialViewport">) {
  const controller = useMapController();

  const [query, setQuery] = useState("");
  const [searching, setSearching] =
    useState(false);
  const [searchError, setSearchError] =
    useState("");
  const [results, setResults] = useState<
    LocationSearchResult[]
  >([]);

  const marker: MapMarker | null = useMemo(
    () =>
      value
        ? createMapMarker({
            id: "location-picker",
            entityType: "custom",
            latitude: value.latitude,
            longitude: value.longitude,
            title: label ?? "Selected location",
            icon: "⌖",
          })
        : null,
    [label, value],
  );

  const selectResult = (
    result: LocationSearchResult,
  ) => {
    const coordinate = {
      latitude: result.latitude,
      longitude: result.longitude,
    };

    onChange(coordinate);
    onAddressResolved?.(result);
    setQuery(result.displayName);
    setResults([]);
    setSearchError("");

    controller.setViewport({
      center: coordinate,
      zoom: 17,
      bounds: undefined,
    });
  };

  const searchAddress = async () => {
    const trimmed = query.trim();

    if (!trimmed) {
      setSearchError(
        "Enter an address, landmark, town, or area.",
      );
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      setSearchError("");

      const params = new URLSearchParams({
        q: trimmed,
        format: "jsonv2",
        addressdetails: "1",
        limit: "5",
      });

      if (countryCodes?.length) {
        params.set(
          "countrycodes",
          countryCodes.join(","),
        );
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Accept-Language": "en",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Location search failed (${response.status}).`,
        );
      }

      const payload = (await response.json()) as Array<{
        lat?: string;
        lon?: string;
        display_name?: string;
        type?: string;
        importance?: number;
      }>;

      const nextResults = payload
        .map((item) => ({
          latitude: Number(item.lat),
          longitude: Number(item.lon),
          displayName:
            item.display_name ||
            `${item.lat}, ${item.lon}`,
          type: item.type,
          importance: item.importance,
          raw: item,
        }))
        .filter(
          (item) =>
            Number.isFinite(item.latitude) &&
            Number.isFinite(item.longitude),
        );

      setResults(nextResults);

      if (!nextResults.length) {
        setSearchError(
          "No matching location was found. Try adding the city, region, or country.",
        );
      }
    } catch (error: any) {
      console.error(
        "Location search failed:",
        error,
      );
      setResults([]);
      setSearchError(
        error?.message ||
          "Unable to search for this location.",
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 9 }}>
      {label ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {label}
        </div>
      ) : null}

      {searchable ? (
        <div
          style={{
            display: "grid",
            gap: 7,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) auto",
              gap: 7,
            }}
          >
            <input
              value={query}
              disabled={disabled || searching}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void searchAddress();
                }
              }}
              placeholder={
                searchPlaceholder ??
                "Search address or landmark..."
              }
              aria-label="Search map location"
              style={{
                minWidth: 0,
                minHeight: 40,
                padding: "9px 11px",
                border:
                  "1px solid var(--border, rgba(148,163,184,.35))",
                borderRadius: 10,
                background:
                  "var(--card, var(--background, #fff))",
                color: "inherit",
                font: "inherit",
              }}
            />

            <button
              type="button"
              disabled={
                disabled ||
                searching ||
                !query.trim()
              }
              onClick={() =>
                void searchAddress()
              }
              style={{
                minHeight: 40,
                padding: "0 14px",
                border: 0,
                borderRadius: 10,
                background:
                  "var(--primary, var(--ba-primary, #2563eb))",
                color: "var(--primary-foreground, #fff)",
                font: "inherit",
                fontSize: 12,
                fontWeight: 800,
                cursor:
                  disabled || searching
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  disabled || searching
                    ? 0.62
                    : 1,
              }}
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>

          {searchError ? (
            <div
              role="status"
              style={{
                fontSize: 11,
                color:
                  "var(--danger, #dc2626)",
              }}
            >
              {searchError}
            </div>
          ) : null}

          {results.length ? (
            <div
              style={{
                display: "grid",
                gap: 5,
                padding: 6,
                border:
                  "1px solid var(--border, rgba(148,163,184,.28))",
                borderRadius: 11,
                background:
                  "var(--card, var(--background, #fff))",
                boxShadow:
                  "0 12px 30px rgba(15,23,42,.10)",
              }}
            >
              {results.map((result, index) => (
                <button
                  key={`${result.latitude}:${result.longitude}:${index}`}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    selectResult(result)
                  }
                  style={{
                    display: "grid",
                    gap: 2,
                    padding: "9px 10px",
                    border: 0,
                    borderRadius: 8,
                    background: "transparent",
                    color: "inherit",
                    textAlign: "left",
                    cursor: disabled
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  <strong
                    style={{
                      fontSize: 12,
                      lineHeight: 1.35,
                    }}
                  >
                    {result.displayName}
                  </strong>
                  <small
                    style={{
                      color:
                        "var(--muted-foreground, #64748b)",
                    }}
                  >
                    {result.latitude.toFixed(6)},{" "}
                    {result.longitude.toFixed(6)}
                  </small>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <MapContainer
        height={height ?? 340}
        minHeight={260}
        footer={
          helperText ? (
            <div
              style={{
                fontSize: 11,
                color:
                  "var(--muted-foreground, #64748b)",
              }}
            >
              {helperText}
            </div>
          ) : undefined
        }
      >
        <PickerViewportSync value={value} />

        <MapCanvas
          pannable={!disabled}
          zoomable={!disabled}
          onMapClick={({ coordinate }) => {
            if (disabled) return;
            onChange(coordinate);
          }}
        >
          {marker ? (
            <MapMarkerVisual
              marker={marker}
              selected
              onClick={() => undefined}
            />
          ) : null}
        </MapCanvas>
      </MapContainer>

      {showCoordinateFields ? (
        <CoordinateField
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      ) : null}

      {value ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onChange(null);
            setResults([]);
          }}
          style={{
            justifySelf: "start",
            padding: 0,
            border: 0,
            background: "transparent",
            color:
              "var(--danger, #dc2626)",
            font: "inherit",
            fontSize: 12,
            fontWeight: 750,
            cursor: disabled
              ? "not-allowed"
              : "pointer",
          }}
        >
          Clear location
        </button>
      ) : null}
    </div>
  );
}

export function LocationPicker({
  value,
  onChange,
  initialViewport,
  ...props
}: LocationPickerProps) {
  return (
    <MapProvider
      initialViewport={
        initialViewport ??
        (value
          ? {
              center: value,
              zoom: 17,
            }
          : GHANA_VIEWPORT)
      }
    >
      <PickerContent
        value={value}
        onChange={onChange}
        {...props}
      />
    </MapProvider>
  );
}

export default LocationPicker;