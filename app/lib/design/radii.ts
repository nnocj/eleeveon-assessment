/**
 * app/lib/design/radii.ts
 * --------------------------------------------------------------------------
 * Eleeveon shape language.
 */

export const ELEEVEON_RADII = {
  none: "0",
  xs: "0.375rem",
  sm: "0.625rem",
  md: "0.875rem",
  lg: "1.125rem",
  xl: "1.375rem",
  "2xl": "1.75rem",
  "3xl": "2.25rem",
  pill: "999px",
  circle: "50%",
} as const;

export const ELEEVEON_RADIUS_RECIPES = {
  control: ELEEVEON_RADII.md,
  compactControl: ELEEVEON_RADII.sm,
  card: ELEEVEON_RADII.lg,
  featureCard: ELEEVEON_RADII.xl,
  panel: ELEEVEON_RADII["2xl"],
  sheet: ELEEVEON_RADII["2xl"],
  avatar: ELEEVEON_RADII.circle,
  badge: ELEEVEON_RADII.pill,
} as const;

export function radiusCssVariables():
  Record<string, string> {
  return {
    "--eds-radius-xs":
      ELEEVEON_RADII.xs,
    "--eds-radius-sm":
      ELEEVEON_RADII.sm,
    "--eds-radius-md":
      ELEEVEON_RADII.md,
    "--eds-radius-lg":
      ELEEVEON_RADII.lg,
    "--eds-radius-xl":
      ELEEVEON_RADII.xl,
    "--eds-radius-2xl":
      ELEEVEON_RADII["2xl"],
    "--eds-radius-pill":
      ELEEVEON_RADII.pill,
    "--eds-radius-control":
      ELEEVEON_RADIUS_RECIPES.control,
    "--eds-radius-card":
      ELEEVEON_RADIUS_RECIPES.card,
    "--eds-radius-panel":
      ELEEVEON_RADIUS_RECIPES.panel,
  };
}
