"use client";

import type {
  CSSProperties,
  ElementType,
  HTMLAttributes,
  ReactNode,
} from "react";

export type EleeveonSurfaceTone =
  | "default"
  | "raised"
  | "sunken"
  | "brand"
  | "brand-soft";

export type EleeveonSurfaceElevation =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5;

export interface EleeveonSurfaceProps
  extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children?: ReactNode;
  tone?: EleeveonSurfaceTone;
  elevation?: EleeveonSurfaceElevation;
  radius?:
    | "none"
    | "control"
    | "card"
    | "panel"
    | "pill";
  padding?: boolean | string;
  interactive?: boolean;
}

const TONE_CLASS:
  Record<EleeveonSurfaceTone, string> = {
  default: "eds-surface",
  raised: "eds-surface-raised",
  sunken: "eds-surface-sunken",
  brand: "eds-brand-surface",
  "brand-soft": "eds-brand-soft",
};

const RADIUS_CLASS = {
  none: "",
  control: "eds-radius-control",
  card: "eds-radius-card",
  panel: "eds-radius-panel",
  pill: "eds-radius-pill",
} as const;

function join(
  ...values: Array<
    string | false | null | undefined
  >
) {
  return values.filter(Boolean).join(" ");
}

export default function EleeveonSurface({
  as: Component = "div",
  children,
  tone = "default",
  elevation = 1,
  radius = "card",
  padding = false,
  interactive = false,
  className,
  style,
  ...props
}: EleeveonSurfaceProps) {
  const mergedStyle = {
    padding:
      typeof padding === "string"
        ? padding
        : padding
          ? "var(--eds-card-padding)"
          : undefined,
    ...style,
  } satisfies CSSProperties;

  return (
    <Component
      className={join(
        TONE_CLASS[tone],
        `eds-elevation-${elevation}`,
        RADIUS_CLASS[radius],
        interactive &&
          "eds-hover-lift eds-pressable",
        className,
      )}
      style={mergedStyle}
      {...props}
    >
      {children}
    </Component>
  );
}
