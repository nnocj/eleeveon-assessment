"use client";

import type {
  CSSProperties,
} from "react";
import type {
  MapLayerDefinition,
} from "../core/types";

export interface MapLegendProps {
  layers: readonly MapLayerDefinition[];
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function MapLegend({
  layers,
  compact = true,
  className,
  style,
}: MapLegendProps) {
  const visibleLayers = layers.filter(
    (layer) => layer.enabled !== false,
  );
  if (!visibleLayers.length) return null;

  return (
    <div
      className={className}
      aria-label="Map legend"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: compact ? 6 : 10,
        ...style,
      }}
    >
      {visibleLayers.map((layer) => (
        <div
          key={layer.id}
          title={layer.description}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minHeight: compact ? 26 : 30,
            padding: compact ? "3px 7px" : "4px 9px",
            borderRadius: 999,
            background:
              "var(--muted, rgba(148,163,184,.13))",
            color:
              "var(--muted-foreground, #64748b)",
            fontSize: compact ? 11 : 12,
            fontWeight: 700,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background:
                layer.color ??
                "var(--primary, #2563eb)",
            }}
          />
          <span>{layer.label}</span>
          {typeof layer.count === "number" ? (
            <span>({layer.count})</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default MapLegend;
