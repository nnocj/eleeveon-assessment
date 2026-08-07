"use client";

import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";

export type BrandTextureName =
  | "grain"
  | "dots"
  | "grid"
  | "network"
  | "paper";

export interface BrandTextureProps
  extends HTMLAttributes<HTMLDivElement> {
  texture?: BrandTextureName;
  intensity?: number;
  children?: ReactNode;
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

function join(
  ...values: Array<
    string | false | null | undefined
  >
) {
  return values.filter(Boolean).join(" ");
}

export default function BrandTexture({
  texture = "grain",
  intensity = 1,
  children,
  decorative = false,
  className,
  style,
  ...props
}: BrandTextureProps) {
  const mergedStyle = {
    "--eds-texture-intensity":
      String(clamp(intensity, 0, 2)),
    ...style,
  } as CSSProperties;

  return (
    <div
      className={join(
        "eds-texture",
        `eds-texture-${texture}`,
        className,
      )}
      style={mergedStyle}
      aria-hidden={
        decorative
          ? true
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}
