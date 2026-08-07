"use client";

import type {
  CSSProperties,
  HTMLAttributes,
} from "react";

import type {
  WindowTitlebarTexture,
} from "../../lib/window";

export interface WindowTextureProps
  extends HTMLAttributes<HTMLDivElement> {
  texture?: WindowTitlebarTexture;
  opacity?: number;
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

export default function WindowTexture({
  texture = "dots",
  opacity = 0.04,
  style,
  ...props
}: WindowTextureProps) {
  if (texture === "none") {
    return null;
  }

  const image = {
    dots:
      "var(--eds-texture-dots)",
    grain:
      "var(--eds-texture-grain)",
    network:
      "var(--eds-texture-network)",
  }[texture];

  const size = {
    dots:
      "var(--eds-texture-dots-size, 10px 10px)",
    grain:
      "var(--eds-texture-grain-size, 140px 140px)",
    network:
      "var(--eds-texture-network-size, 96px 96px)",
  }[texture];

  return (
    <div
      aria-hidden="true"
      className="window-titlebar-texture"
      style={
        {
          backgroundImage: image,
          backgroundSize: size,
          opacity: clamp(
            opacity,
            0,
            1,
          ),
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
}
