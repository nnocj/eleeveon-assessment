"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import {
  BrandGlow,
  BrandPattern,
  BrandWatermark,
} from "../branding";

export interface EleeveonHeroProps
  extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  watermark?: ReactNode;
  compact?: boolean;
}

export default function EleeveonHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  watermark,
  compact = false,
  className,
  children,
  ...props
}: EleeveonHeroProps) {
  return (
    <section
      className={[
        "eds-panel",
        "eds-brand-field",
        "eds-texture",
        "eds-texture-network",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns:
          aside
            ? "minmax(0, 1fr) minmax(180px, .52fr)"
            : "1fr",
        alignItems: "center",
        gap: "var(--eds-space-5)",
        minHeight: compact
          ? "10rem"
          : "14rem",
        background:
          "var(--eds-gradient-hero, var(--eds-gradient-brand-soft)), var(--eds-card)",
      }}
      {...props}
    >
      <BrandGlow
        placement="top-left"
        size="26rem"
        opacity={0.16}
      />
      <BrandPattern
        variant="network"
        opacity={0.045}
      />
      <BrandWatermark
        placement="bottom-right"
        opacity={0.04}
        size="9rem"
      >
        {watermark ?? "E"}
      </BrandWatermark>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minWidth: 0,
        }}
      >
        {eyebrow ? (
          <div className="eds-type-overline eds-text-primary">
            {eyebrow}
          </div>
        ) : null}

        <div
          className="eds-type-display eds-text-balance"
          style={{
            marginTop: eyebrow
              ? "var(--eds-space-2)"
              : undefined,
          }}
        >
          {title}
        </div>

        {description ? (
          <div
            className="eds-type-body eds-text-muted"
            style={{
              maxWidth: "46rem",
              marginTop:
                "var(--eds-space-3)",
            }}
          >
            {description}
          </div>
        ) : null}

        {actions ? (
          <div
            className="eds-row-wrap"
            style={{
              marginTop:
                "var(--eds-space-4)",
            }}
          >
            {actions}
          </div>
        ) : null}

        {children}
      </div>

      {aside ? (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            minWidth: 0,
          }}
        >
          {aside}
        </div>
      ) : null}
    </section>
  );
}
