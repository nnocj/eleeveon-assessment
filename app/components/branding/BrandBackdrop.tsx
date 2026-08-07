"use client";

import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";

import BrandGlow from "./BrandGlow";
import BrandPattern, {
  type BrandPatternVariant,
} from "./BrandPattern";

export interface BrandBackdropProps
  extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  pattern?: BrandPatternVariant;
  patternOpacity?: number;
  glow?: boolean;
  clip?: boolean;
}

export default function BrandBackdrop({
  children,
  pattern = "network",
  patternOpacity = 0.055,
  glow = true,
  clip = true,
  style,
  ...props
}: BrandBackdropProps) {
  const mergedStyle = {
    position: "relative",
    isolation: "isolate",
    overflow: clip
      ? "hidden"
      : undefined,
    background:
      "var(--eds-gradient-page-glow), var(--eds-bg)",
    ...style,
  } satisfies CSSProperties;

  return (
    <div
      style={mergedStyle}
      {...props}
    >
      {glow ? (
        <BrandGlow
          placement="top-left"
          size="28rem"
          opacity={0.18}
        />
      ) : null}

      <BrandPattern
        variant={pattern}
        opacity={patternOpacity}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
