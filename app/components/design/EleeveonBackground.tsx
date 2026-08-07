"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import {
  BrandGlow,
  BrandPattern,
  type BrandPatternVariant,
} from "../branding";

export interface EleeveonBackgroundProps
  extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  pattern?: BrandPatternVariant | "none";
  glow?: boolean;
  fixed?: boolean;
}

export default function EleeveonBackground({
  children,
  pattern = "dots",
  glow = true,
  fixed = false,
  style,
  ...props
}: EleeveonBackgroundProps) {
  return (
    <div
      style={{
        position: fixed
          ? "fixed"
          : "relative",
        inset: fixed ? 0 : undefined,
        minHeight: fixed
          ? undefined
          : "100%",
        isolation: "isolate",
        background:
          "var(--eds-gradient-page-glow), var(--eds-bg)",
        ...style,
      }}
      {...props}
    >
      {glow ? (
        <>
          <BrandGlow
            placement="top-left"
            size="30rem"
            opacity={0.1}
          />
          <BrandGlow
            placement="bottom-right"
            size="24rem"
            opacity={0.07}
          />
        </>
      ) : null}

      {pattern !== "none" ? (
        <BrandPattern
          variant={pattern}
          opacity={0.035}
        />
      ) : null}

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
