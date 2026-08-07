/**
 * app/lib/design/glass.ts
 * --------------------------------------------------------------------------
 * Theme-aware translucent surface recipes.
 */

import type {
  EleeveonAppearanceMode,
} from "./colors";

export type EleeveonGlassStrength =
  | "subtle"
  | "medium"
  | "strong";

export interface EleeveonGlassRecipe {
  background: string;
  backdropFilter: string;
  border: string;
  saturation: string;
}

export function glassRecipe(
  mode: EleeveonAppearanceMode,
  strength:
    EleeveonGlassStrength = "medium",
): EleeveonGlassRecipe {
  const blur = {
    subtle: "10px",
    medium: "18px",
    strong: "28px",
  }[strength];

  const alpha = {
    subtle:
      mode === "dark"
        ? 0.74
        : 0.78,
    medium:
      mode === "dark"
        ? 0.82
        : 0.86,
    strong:
      mode === "dark"
        ? 0.90
        : 0.94,
  }[strength];

  return {
    background:
      mode === "dark"
        ? `rgba(15, 27, 45, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`,
    backdropFilter:
      `blur(${blur}) saturate(1.18)`,
    border:
      mode === "dark"
        ? "1px solid rgba(148,163,184,.17)"
        : "1px solid rgba(100,116,139,.16)",
    saturation: "1.18",
  };
}

export function glassCssVariables(
  mode: EleeveonAppearanceMode,
): Record<string, string> {
  const subtle =
    glassRecipe(mode, "subtle");
  const medium =
    glassRecipe(mode, "medium");
  const strong =
    glassRecipe(mode, "strong");

  return {
    "--eds-glass-subtle-bg":
      subtle.background,
    "--eds-glass-subtle-filter":
      subtle.backdropFilter,
    "--eds-glass-medium-bg":
      medium.background,
    "--eds-glass-medium-filter":
      medium.backdropFilter,
    "--eds-glass-strong-bg":
      strong.background,
    "--eds-glass-strong-filter":
      strong.backdropFilter,
  };
}
