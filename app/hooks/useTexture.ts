"use client";

import {
  useMemo,
} from "react";

import {
  useDesign,
} from "../context/design-context";

export type TextureKind =
  | "none"
  | "grain"
  | "dots"
  | "grid"
  | "network"
  | "paper";

export interface TextureRecipe {
  kind: TextureKind;
  className: string;
  intensity: number;
  style: React.CSSProperties;
}

export default function useTexture(
  kind: TextureKind = "grain",
  multiplier = 1,
): TextureRecipe {
  const {
    preferences,
  } = useDesign();

  return useMemo(() => {
    const intensity =
      Math.max(
        0,
        Math.min(
          2,
          preferences
            .textureIntensity *
            multiplier,
        ),
      );

    return {
      kind,
      className:
        kind === "none"
          ? ""
          : `eds-texture eds-texture-${kind}`,
      intensity,
      style: {
        "--eds-texture-intensity":
          String(intensity),
      } as React.CSSProperties,
    };
  }, [
    kind,
    multiplier,
    preferences.textureIntensity,
  ]);
}
