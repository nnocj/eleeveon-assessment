"use client";

import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";

export type BrandIllustrationFit =
  | "contain"
  | "cover"
  | "fill";

export interface BrandIllustrationProps
  extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fit?: BrandIllustrationFit;
  aspectRatio?: string;
  fallback?: ReactNode;
  overlay?: boolean;
  decorative?: boolean;
}

export default function BrandIllustration({
  src,
  alt = "",
  fit = "contain",
  aspectRatio = "16 / 10",
  fallback,
  overlay = false,
  decorative = !alt,
  style,
  ...props
}: BrandIllustrationProps) {
  const mergedStyle = {
    position: "relative",
    overflow: "hidden",
    aspectRatio,
    borderRadius:
      "var(--eds-radius-panel)",
    background:
      "var(--eds-gradient-brand-soft)",
    ...style,
  } satisfies CSSProperties;

  return (
    <div
      style={mergedStyle}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          aria-hidden={
            decorative
              ? true
              : undefined
          }
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: fit,
          }}
        />
      ) : (
        fallback ?? (
          <div
            aria-hidden="true"
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              color:
                "var(--eds-primary)",
              fontSize: "3rem",
              fontWeight: 900,
            }}
          >
            E
          </div>
        )
      )}

      {overlay ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, transparent 48%, rgba(7,16,31,.34))",
          }}
        />
      ) : null}
    </div>
  );
}
