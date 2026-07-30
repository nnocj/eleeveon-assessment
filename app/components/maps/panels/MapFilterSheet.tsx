"use client";

import { useMemo, useState } from "react";
import type {
  MapLayerDefinition,
} from "../core/types";
import { EntityDetailsSheet } from "../../shared";

export interface MapFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layers: readonly MapLayerDefinition[];
  enabledLayerIds: ReadonlySet<string>;
  onLayerEnabledChange: (
    layerId: string,
    enabled: boolean,
  ) => void;
  statuses?: readonly string[];
  selectedStatuses?: ReadonlySet<string>;
  onStatusEnabledChange?: (
    status: string,
    enabled: boolean,
  ) => void;
  onReset?: () => void;
}

export function MapFilterSheet({
  open,
  onOpenChange,
  layers,
  enabledLayerIds,
  onLayerEnabledChange,
  statuses = [],
  selectedStatuses,
  onStatusEnabledChange,
  onReset,
}: MapFilterSheetProps) {
  const [query, setQuery] = useState("");

  const filteredLayers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return layers;
    return layers.filter((layer) =>
      [layer.label, layer.description, layer.id].some(
        (value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(needle),
      ),
    );
  }, [layers, query]);

  return (
    <EntityDetailsSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Map filters"
      subtitle="Choose what appears on the map"
      side="right"
      width={390}
      footer={
        onReset ? (
          <button
            type="button"
            onClick={onReset}
            style={{
              width: "100%",
              minHeight: 38,
              borderRadius: 10,
              border:
                "1px solid var(--border, rgba(15,23,42,.12))",
              background: "transparent",
              color: "inherit",
              font: "inherit",
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            Reset filters
          </button>
        ) : null
      }
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search layers..."
        aria-label="Search map layers"
        style={{
          width: "100%",
          minHeight: 40,
          padding: "0 11px",
          borderRadius: 10,
          border:
            "1px solid var(--border, rgba(15,23,42,.12))",
          background: "var(--background, #fff)",
          color: "inherit",
          font: "inherit",
          boxSizing: "border-box",
        }}
      />

      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {filteredLayers.map((layer) => {
          const checked = enabledLayerIds.has(layer.id);
          return (
            <label
              key={layer.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                borderRadius: 12,
                border:
                  "1px solid var(--border, rgba(15,23,42,.10))",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  onLayerEnabledChange(
                    layer.id,
                    event.target.checked,
                  )
                }
              />
              <span
                aria-hidden="true"
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background:
                    layer.color ??
                    "var(--primary, #2563eb)",
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {layer.label}
                </span>
                {layer.description ? (
                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      fontSize: 11,
                      color:
                        "var(--muted-foreground, #64748b)",
                    }}
                  >
                    {layer.description}
                  </span>
                ) : null}
              </span>
              {typeof layer.count === "number" ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 750,
                    color:
                      "var(--muted-foreground, #64748b)",
                  }}
                >
                  {layer.count}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>

      {statuses.length && onStatusEnabledChange ? (
        <div style={{ marginTop: 20 }}>
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: 13,
              fontWeight: 850,
            }}
          >
            Statuses
          </h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 7,
            }}
          >
            {statuses.map((status) => {
              const checked =
                selectedStatuses?.has(status) ?? true;
              return (
                <label
                  key={status}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 8px",
                    borderRadius: 999,
                    background:
                      "var(--muted, rgba(148,163,184,.13))",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      onStatusEnabledChange(
                        status,
                        event.target.checked,
                      )
                    }
                  />
                  {status.replaceAll("_", " ")}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </EntityDetailsSheet>
  );
}

export default MapFilterSheet;
