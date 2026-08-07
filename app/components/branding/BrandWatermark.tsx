"use client";

import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";

export type BrandWatermarkPlacement =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export interface BrandWatermarkProps
  extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  text?: string;
  placement?: BrandWatermarkPlacement;
  opacity?: number;
  rotate?: number;
  size?: string;
  decorative?: boolean;
}

const PLACEMENT_STYLE:
  Record<
    BrandWatermarkPlacement,
    CSSProperties
  > = {
  "top-left": {
    top: "1rem",
    left: "1rem",
  },
  "top-right": {
    top: "1rem",
    right: "1rem",
  },
  "bottom-left": {
    bottom: "1rem",
    left: "1rem",
  },
  "bottom-right": {
    bottom: "1rem",
    right: "1rem",
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

export default function BrandWatermark({
  children,
  text = "E",
  placement = "bottom-right",
  opacity = 0.055,
  rotate = 0,
  size = "6rem",
  decorative = true,
  style,
  ...props
}: BrandWatermarkProps) {
  const placementStyle =
    PLACEMENT_STYLE[placement];

  const baseTransform =
    placement === "center"
      ? "translate(-50%, -50%)"
      : "";

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
        pointerEvents: "none",
        color:
          "var(--eds-primary)",
        fontFamily:
          "var(--eds-font-display)",
        fontSize: size,
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: "-0.08em",
        userSelect: "none",
        opacity: clamp(
          opacity,
          0,
          1,
        ),
        ...placementStyle,
        transform: [
          baseTransform,
          `rotate(${rotate}deg)`,
        ]
          .filter(Boolean)
          .join(" "),
        ...style,
      }}
      {...props}
    >
      {children ?? text}
    </div>
  );
}
