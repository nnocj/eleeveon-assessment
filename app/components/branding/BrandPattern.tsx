"use client";

import type {
  CSSProperties,
  HTMLAttributes,
} from "react";

export type BrandPatternVariant =
  | "network"
  | "grid"
  | "dots"
  | "rings"
  | "academic";

export interface BrandPatternProps
  extends HTMLAttributes<HTMLDivElement> {
  variant?: BrandPatternVariant;
  opacity?: number;
  density?: number;
  absolute?: boolean;
  decorative?: boolean;
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

function patternImage(
  variant: BrandPatternVariant,
) {
  switch (variant) {
    case "grid":
      return "var(--eds-texture-grid)";
    case "dots":
      return "var(--eds-texture-dots)";
    case "network":
      return "var(--eds-texture-network)";
    case "rings":
      return [
        "radial-gradient(circle at 20% 50%, transparent 0 18px, color-mix(in srgb, var(--eds-primary) 18%, transparent) 19px 20px, transparent 21px)",
        "radial-gradient(circle at 82% 30%, transparent 0 28px, color-mix(in srgb, var(--eds-primary) 12%, transparent) 29px 30px, transparent 31px)",
      ].join(",");
    case "academic":
      return [
        "linear-gradient(color-mix(in srgb, var(--eds-primary) 8%, transparent) 1px, transparent 1px)",
        "linear-gradient(90deg, color-mix(in srgb, var(--eds-primary) 8%, transparent) 1px, transparent 1px)",
        "radial-gradient(circle, color-mix(in srgb, var(--eds-primary) 20%, transparent) 1px, transparent 1.5px)",
      ].join(",");
  }
}

function patternSize(
  variant: BrandPatternVariant,
  density: number,
) {
  const factor = clamp(
    density,
    0.5,
    2,
  );

  switch (variant) {
    case "dots":
      return `${10 / factor}px ${10 / factor}px`;
    case "grid":
    case "academic":
      return `${24 / factor}px ${24 / factor}px`;
    case "network":
      return `${96 / factor}px ${96 / factor}px`;
    case "rings":
      return `${140 / factor}px ${140 / factor}px`;
  }
}

function join(
  ...values: Array<
    string | false | null | undefined
  >
) {
  return values.filter(Boolean).join(" ");
}

export default function BrandPattern({
  variant = "network",
  opacity = 0.08,
  density = 1,
  absolute = true,
  decorative = true,
  className,
  style,
  ...props
}: BrandPatternProps) {
  const mergedStyle = {
    position: absolute
      ? "absolute"
      : undefined,
    inset: absolute ? 0 : undefined,
    pointerEvents: decorative
      ? "none"
      : undefined,
    backgroundImage:
      patternImage(variant),
    backgroundSize:
      patternSize(
        variant,
        density,
      ),
    opacity: clamp(
      opacity,
      0,
      1,
    ),
    ...style,
  } satisfies CSSProperties;

  return (
    <div
      className={join(
        "eds-brand-pattern",
        `eds-brand-pattern-${variant}`,
        className,
      )}
      style={mergedStyle}
      aria-hidden={
        decorative
          ? true
          : undefined
      }
      {...props}
    />
  );
}
