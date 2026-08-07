/**
 * app/lib/design/iconography.ts
 * --------------------------------------------------------------------------
 * Shared icon geometry and sizing rules.
 */

export const ELEEVEON_ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
  "2xl": 32,
} as const;

export const ELEEVEON_ICONOGRAPHY = {
  strokeWidth: 1.8,
  roundedStrokeWidth: 2,
  lineCap: "round",
  lineJoin: "round",
  opticalPadding: 1,
  activeScale: 0.97,
} as const;

export type EleeveonIconSize =
  keyof typeof ELEEVEON_ICON_SIZES;

export function iconSize(
  size:
    | EleeveonIconSize
    | number = "md",
): number {
  return typeof size === "number"
    ? size
    : ELEEVEON_ICON_SIZES[size];
}

export function iconCssVariables():
  Record<string, string> {
  return {
    "--eds-icon-xs":
      `${ELEEVEON_ICON_SIZES.xs}px`,
    "--eds-icon-sm":
      `${ELEEVEON_ICON_SIZES.sm}px`,
    "--eds-icon-md":
      `${ELEEVEON_ICON_SIZES.md}px`,
    "--eds-icon-lg":
      `${ELEEVEON_ICON_SIZES.lg}px`,
    "--eds-icon-xl":
      `${ELEEVEON_ICON_SIZES.xl}px`,
    "--eds-icon-stroke":
      String(
        ELEEVEON_ICONOGRAPHY.strokeWidth,
      ),
  };
}
