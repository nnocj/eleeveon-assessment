"use client";

import type {
  CSSProperties,
  HTMLAttributes,
} from "react";

export interface EleeveonNoiseProps
  extends HTMLAttributes<HTMLDivElement> {
  opacity?: number;
  blendMode?:
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "soft-light";
  absolute?: boolean;
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

export default function EleeveonNoise({
  opacity = 0.04,
  blendMode = "soft-light",
  absolute = true,
  style,
  ...props
}: EleeveonNoiseProps) {
  const mergedStyle = {
    position: absolute
      ? "absolute"
      : undefined,
    inset: absolute ? 0 : undefined,
    pointerEvents: "none",
    backgroundImage:
      "var(--eds-texture-grain)",
    backgroundSize:
      "var(--eds-texture-grain-size, 140px 140px)",
    opacity: clamp(
      opacity,
      0,
      1,
    ),
    mixBlendMode: blendMode,
    ...style,
  } satisfies CSSProperties;

  return (
    <div
      aria-hidden="true"
      style={mergedStyle}
      {...props}
    />
  );
}
