/**
 * app/lib/design/spacing.ts
 * --------------------------------------------------------------------------
 * Compact-first spacing scale for Eleeveon application interfaces.
 */

export const ELEEVEON_SPACING = {
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const ELEEVEON_LAYOUT = {
  contentMaxWidth: "100%",
  readableMaxWidth: "72rem",
  sidebarCompact: "15rem",
  sidebarDefault: "18.75rem",
  sidebarWide: "23.75rem",
  headerHeight: "3rem",
  touchTarget: "2.75rem",
  touchTargetCompact: "2.5rem",
  sheetWidth: "26.875rem",
} as const;

export type EleeveonDensity =
  | "compact"
  | "comfortable"
  | "spacious";

export const ELEEVEON_DENSITY = {
  compact: {
    controlHeight: "2.25rem",
    cardPadding: "0.625rem",
    sectionGap: "0.5rem",
  },
  comfortable: {
    controlHeight: "2.625rem",
    cardPadding: "0.875rem",
    sectionGap: "0.75rem",
  },
  spacious: {
    controlHeight: "3rem",
    cardPadding: "1.125rem",
    sectionGap: "1rem",
  },
} as const;

export function spacingCssVariables(
  density: EleeveonDensity = "comfortable",
): Record<string, string> {
  const recipe =
    ELEEVEON_DENSITY[density];

  return {
    "--eds-space-1":
      ELEEVEON_SPACING[1],
    "--eds-space-2":
      ELEEVEON_SPACING[2],
    "--eds-space-3":
      ELEEVEON_SPACING[3],
    "--eds-space-4":
      ELEEVEON_SPACING[4],
    "--eds-space-5":
      ELEEVEON_SPACING[5],
    "--eds-space-6":
      ELEEVEON_SPACING[6],
    "--eds-control-height":
      recipe.controlHeight,
    "--eds-card-padding":
      recipe.cardPadding,
    "--eds-section-gap":
      recipe.sectionGap,
  };
}
