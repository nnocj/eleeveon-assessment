"use client";

import type {
  CSSProperties,
  HTMLAttributes,
} from "react";

export type BrandGlowPlacement =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export interface BrandGlowProps
  extends HTMLAttributes<HTMLDivElement> {
  placement?: BrandGlowPlacement;
  size?: string;
  opacity?: number;
  blur?: string;
  color?: string;
  decorative?: boolean;
}

const POSITION:
  Record<
    BrandGlowPlacement,
    CSSProperties
  > = {
  "top-left": {
    top: "-30%",
    left: "-20%",
  },
  "top-right": {
    top: "-30%",
    right: "-20%",
  },
  "bottom-left": {
    bottom: "-30%",
    left: "-20%",
  },
  "bottom-right": {
    bottom: "-30%",
    right: "-20%",
  },
  center: {
    top: "50%",
    left: "50%",
    transform:
      "translate(-50%, -50%)",
  },
};

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

export default function BrandGlow({
  placement = "top-left",
  size = "24rem",
  opacity = 0.18,
  blur = "24px",
  color = "var(--eds-primary)",
  decorative = true,
  style,
  ...props
}: BrandGlowProps) {
  return (
    <div
      aria-hidden={
        decorative
          ? true
          : undefined
      }
      style={{
        position: "absolute",
        zIndex: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        pointerEvents: "none",
        background:
          `radial-gradient(circle, ${color} 0%, transparent 68%)`,
        filter: `blur(${blur})`,
        opacity: clamp(
          opacity,
          0,
          1,
        ),
        ...POSITION[placement],
        ...style,
      }}
      {...props}
    />
  );
}
