"use client";

import { Fragment, type ReactNode } from "react";
import type {
  MapMarker,
  MarkerCluster,
} from "../../../lib/maps";
import { EntityAvatar, EntityDetailsSheet } from "../../shared";

export interface MapDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marker?: MapMarker | null;
  cluster?: MarkerCluster | null;
  onMarkerSelect?: (marker: MapMarker) => void;
  onMoveLocation?: (marker: MapMarker) => void;
  allowLocationEditing?: boolean;
  actions?: ReactNode;
}

function metadataEntries(
  metadata?: Record<string, unknown>,
): Array<[string, unknown]> {
  return Object.entries(metadata ?? {}).filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      typeof value !== "object",
  );
}

export function MapDetailsSheet({
  open,
  onOpenChange,
  marker,
  cluster,
  onMarkerSelect,
  onMoveLocation,
  allowLocationEditing = false,
  actions,
}: MapDetailsSheetProps) {
  const title = marker
    ? marker.title
    : cluster
      ? `${cluster.count} locations`
      : "Map details";

  const resolvedActions =
    marker &&
    allowLocationEditing &&
    onMoveLocation ? (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        {actions}
        <button
          type="button"
          onClick={() => onMoveLocation(marker)}
          style={{
            minHeight: 38,
            padding: "9px 13px",
            borderRadius: 10,
            border:
              "1px solid color-mix(in srgb, var(--primary, #2563eb) 42%, transparent)",
            background:
              "color-mix(in srgb, var(--primary, #2563eb) 12%, var(--background, #fff))",
            color: "var(--primary, #2563eb)",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Move location
        </button>
      </div>
    ) : (
      actions
    );

  return (
    <EntityDetailsSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      subtitle={
        marker
          ? marker.subtitle ??
            marker.entityType.replaceAll("_", " ")
          : cluster
            ? "Marker cluster"
            : undefined
      }
      icon={
        marker ? (
          <EntityAvatar
            name={marker.title}
            imageUrl={marker.imageUrl}
            size="lg"
            shape="rounded"
          />
        ) : null
      }
      actions={resolvedActions}
      side="right"
      width={430}
    >
      {marker ? (
        <div style={{ display: "grid", gap: 16 }}>
          {marker.description ? (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.6,
                color:
                  "var(--muted-foreground, #64748b)",
              }}
            >
              {marker.description}
            </p>
          ) : null}

          <dl
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(100px, .7fr) minmax(0, 1.3fr)",
              gap: "9px 12px",
              margin: 0,
              fontSize: 12,
            }}
          >
            <dt style={{ fontWeight: 750 }}>Latitude</dt>
            <dd style={{ margin: 0 }}>
              {marker.coordinate.latitude.toFixed(6)}
            </dd>
            <dt style={{ fontWeight: 750 }}>Longitude</dt>
            <dd style={{ margin: 0 }}>
              {marker.coordinate.longitude.toFixed(6)}
            </dd>
            {marker.status ? (
              <>
                <dt style={{ fontWeight: 750 }}>Status</dt>
                <dd
                  style={{
                    margin: 0,
                    textTransform: "capitalize",
                  }}
                >
                  {marker.status.replaceAll("_", " ")}
                </dd>
              </>
            ) : null}
            {marker.layerId ? (
              <>
                <dt style={{ fontWeight: 750 }}>Layer</dt>
                <dd style={{ margin: 0 }}>
                  {marker.layerId}
                </dd>
              </>
            ) : null}
            {metadataEntries(marker.metadata).map(
              ([key, value]) => (
                <Fragment key={key}>
                  <dt
                    style={{
                      fontWeight: 750,
                      textTransform: "capitalize",
                    }}
                  >
                    {key.replaceAll("_", " ")}
                  </dt>
                  <dd
                    style={{
                      margin: 0,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {String(value)}
                  </dd>
                </Fragment>
              ),
            )}
          </dl>
        </div>
      ) : null}

      {cluster ? (
        <div style={{ display: "grid", gap: 8 }}>
          {cluster.markers.map((clusterMarker) => (
            <button
              key={clusterMarker.id}
              type="button"
              onClick={() => onMarkerSelect?.(clusterMarker)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                borderRadius: 12,
                border:
                  "1px solid var(--border, rgba(15,23,42,.10))",
                background: "var(--background, #fff)",
                color: "inherit",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <EntityAvatar
                name={clusterMarker.title}
                imageUrl={clusterMarker.imageUrl}
                size="sm"
              />
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {clusterMarker.title}
                </span>
                {clusterMarker.subtitle ? (
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      fontSize: 11,
                      color:
                        "var(--muted-foreground, #64748b)",
                    }}
                  >
                    {clusterMarker.subtitle}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </EntityDetailsSheet>
  );
}

export default MapDetailsSheet;