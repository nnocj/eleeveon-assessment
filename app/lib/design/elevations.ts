/**
 * app/lib/design/elevations.ts
 * --------------------------------------------------------------------------
 * Surface depth system. Components should use named elevation levels rather
 * than hard-coded shadows.
 */

export type EleeveonElevation =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5;

export interface EleeveonElevationRecipe {
  shadowVariable: string;
  borderVariable: string;
  translateY: string;
  backgroundVariable: string;
}

export const ELEEVEON_ELEVATIONS:
  Record<
    EleeveonElevation,
    EleeveonElevationRecipe
  > = {
  0: {
    shadowVariable: "none",
    borderVariable:
      "var(--eds-border)",
    translateY: "0",
    backgroundVariable:
      "var(--eds-surface-sunken)",
  },
  1: {
    shadowVariable:
      "var(--eds-shadow-soft)",
    borderVariable:
      "var(--eds-border)",
    translateY: "0",
    backgroundVariable:
      "var(--eds-surface)",
  },
  2: {
    shadowVariable:
      "var(--eds-shadow-card)",
    borderVariable:
      "var(--eds-border)",
    translateY: "0",
    backgroundVariable:
      "var(--eds-card)",
  },
  3: {
    shadowVariable:
      "var(--eds-shadow-raised)",
    borderVariable:
      "var(--eds-border-strong)",
    translateY: "-1px",
    backgroundVariable:
      "var(--eds-surface-raised)",
  },
  4: {
    shadowVariable:
      "var(--eds-shadow-floating)",
    borderVariable:
      "var(--eds-border-strong)",
    translateY: "-2px",
    backgroundVariable:
      "var(--eds-surface-raised)",
  },
  5: {
    shadowVariable:
      "var(--eds-shadow-overlay)",
    borderVariable:
      "var(--eds-border-strong)",
    translateY: "-2px",
    backgroundVariable:
      "var(--eds-surface-raised)",
  },
};

export function elevationStyle(
  level: EleeveonElevation,
): Record<string, string> {
  const recipe =
    ELEEVEON_ELEVATIONS[level];

  return {
    background:
      recipe.backgroundVariable,
    border:
      `1px solid ${recipe.borderVariable}`,
    boxShadow:
      recipe.shadowVariable,
    transform:
      `translateY(${recipe.translateY})`,
  };
}
