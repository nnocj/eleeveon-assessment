"use client";

import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";

export type EleeveonBackdropTone =
  | "neutral"
  | "dim"
  | "brand"
  | "glass";

export interface EleeveonBackdropProps
  extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  tone?: EleeveonBackdropTone;
  fixed?: boolean;
  blur?: boolean;
}

const BACKGROUND:
  Record<EleeveonBackdropTone, string> = {
  neutral:
    "var(--eds-overlay)",
  dim:
    "rgba(2, 6, 23, .64)",
  brand:
    "color-mix(in srgb, var(--eds-primary) 20%, rgba(2,6,23,.66))",
  glass:
    "color-mix(in srgb, var(--eds-surface) 38%, transparent)",
};

export default function EleeveonBackdrop({
  children,
  tone = "neutral",
  fixed = true,
  blur = true,
  style,
  ...props
}: EleeveonBackdropProps) {
  const mergedStyle = {
    position: fixed
      ? "fixed"
      : "absolute",
    inset: 0,
    zIndex: 40,
    display: "grid",
    placeItems: "center",
    padding: "var(--eds-space-4)",
    background:
      BACKGROUND[tone],
    backdropFilter: blur
      ? "blur(8px)"
      : undefined,
    WebkitBackdropFilter: blur
      ? "blur(8px)"
      : undefined,
    ...style,
  } satisfies CSSProperties;

  return (
    <div
      style={mergedStyle}
      {...props}
    >
      {children}
    </div>
  );
}
