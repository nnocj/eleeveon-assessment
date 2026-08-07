"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import {
  BrandGlow,
  BrandPattern,
  BrandWatermark,
  type BrandPatternVariant,
} from "../branding";

export interface EleeveonBrandFieldProps
  extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  pattern?: BrandPatternVariant;
  watermark?: ReactNode;
  glow?: boolean;
  padded?: boolean;
}

export default function EleeveonBrandField({
  children,
  pattern = "network",
  watermark = "E",
  glow = true,
  padded = true,
  className,
  style,
  ...props
}: EleeveonBrandFieldProps) {
  return (
    <div
      className={[
        "eds-brand-field",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        borderRadius:
          "var(--eds-radius-panel)",
        padding: padded
          ? "var(--eds-card-padding)"
          : undefined,
        ...style,
      }}
      {...props}
    >
      {glow ? (
        <BrandGlow
          placement="top-left"
          size="20rem"
          opacity={0.12}
        />
      ) : null}

      <BrandPattern
        variant={pattern}
        opacity={0.045}
      />

      <BrandWatermark
        placement="bottom-right"
        opacity={0.035}
        size="7rem"
      >
        {watermark}
      </BrandWatermark>

      <div
        style={{
          position: "relative",
          zIndex: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
}
