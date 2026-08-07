/**
 * app/lib/design/typography.ts
 * --------------------------------------------------------------------------
 * Eleeveon typography scale and reusable type recipes.
 */

export const ELEEVEON_FONT_FAMILIES = {
  sans:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  display:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono:
    "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
} as const;

export const ELEEVEON_FONT_WEIGHTS = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

export const ELEEVEON_FONT_SIZES = {
  xs: "0.6875rem",
  sm: "0.75rem",
  md: "0.8125rem",
  base: "0.875rem",
  lg: "1rem",
  xl: "1.125rem",
  "2xl": "1.375rem",
  "3xl": "1.75rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
} as const;

export const ELEEVEON_LINE_HEIGHTS = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.45,
  relaxed: 1.65,
} as const;

export const ELEEVEON_LETTER_SPACING = {
  tighter: "-0.04em",
  tight: "-0.02em",
  normal: "0",
  wide: "0.045em",
  wider: "0.08em",
} as const;

export interface EleeveonTypographyRecipe {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  letterSpacing?: string;
  textTransform?:
    | "none"
    | "uppercase"
    | "lowercase"
    | "capitalize";
}

export const ELEEVEON_TYPOGRAPHY = {
  displayLarge: {
    fontFamily:
      ELEEVEON_FONT_FAMILIES.display,
    fontSize:
      ELEEVEON_FONT_SIZES["5xl"],
    fontWeight:
      ELEEVEON_FONT_WEIGHTS.black,
    lineHeight:
      ELEEVEON_LINE_HEIGHTS.tight,
    letterSpacing:
      ELEEVEON_LETTER_SPACING.tighter,
  },
  display: {
    fontFamily:
      ELEEVEON_FONT_FAMILIES.display,
    fontSize:
      ELEEVEON_FONT_SIZES["4xl"],
    fontWeight:
      ELEEVEON_FONT_WEIGHTS.black,
    lineHeight:
      ELEEVEON_LINE_HEIGHTS.tight,
    letterSpacing:
      ELEEVEON_LETTER_SPACING.tighter,
  },
  pageTitle: {
    fontFamily:
      ELEEVEON_FONT_FAMILIES.display,
    fontSize:
      ELEEVEON_FONT_SIZES["2xl"],
    fontWeight:
      ELEEVEON_FONT_WEIGHTS.extrabold,
    lineHeight:
      ELEEVEON_LINE_HEIGHTS.snug,
    letterSpacing:
      ELEEVEON_LETTER_SPACING.tight,
  },
  sectionTitle: {
    fontFamily:
      ELEEVEON_FONT_FAMILIES.sans,
    fontSize:
      ELEEVEON_FONT_SIZES.lg,
    fontWeight:
      ELEEVEON_FONT_WEIGHTS.bold,
    lineHeight:
      ELEEVEON_LINE_HEIGHTS.snug,
    letterSpacing:
      ELEEVEON_LETTER_SPACING.tight,
  },
  cardTitle: {
    fontFamily:
      ELEEVEON_FONT_FAMILIES.sans,
    fontSize:
      ELEEVEON_FONT_SIZES.base,
    fontWeight:
      ELEEVEON_FONT_WEIGHTS.bold,
    lineHeight:
      ELEEVEON_LINE_HEIGHTS.snug,
  },
  body: {
    fontFamily:
      ELEEVEON_FONT_FAMILIES.sans,
    fontSize:
      ELEEVEON_FONT_SIZES.base,
    fontWeight:
      ELEEVEON_FONT_WEIGHTS.regular,
    lineHeight:
      ELEEVEON_LINE_HEIGHTS.normal,
  },
  bodyStrong: {
    fontFamily:
      ELEEVEON_FONT_FAMILIES.sans,
    fontSize:
      ELEEVEON_FONT_SIZES.base,
    fontWeight:
      ELEEVEON_FONT_WEIGHTS.semibold,
    lineHeight:
      ELEEVEON_LINE_HEIGHTS.normal,
  },
  label: {
    fontFamily:
      ELEEVEON_FONT_FAMILIES.sans,
    fontSize:
      ELEEVEON_FONT_SIZES.sm,
    fontWeight:
      ELEEVEON_FONT_WEIGHTS.semibold,
    lineHeight:
      ELEEVEON_LINE_HEIGHTS.snug,
  },
  overline: {
    fontFamily:
      ELEEVEON_FONT_FAMILIES.sans,
    fontSize:
      ELEEVEON_FONT_SIZES.xs,
    fontWeight:
      ELEEVEON_FONT_WEIGHTS.extrabold,
    lineHeight:
      ELEEVEON_LINE_HEIGHTS.snug,
    letterSpacing:
      ELEEVEON_LETTER_SPACING.wider,
    textTransform: "uppercase",
  },
  caption: {
    fontFamily:
      ELEEVEON_FONT_FAMILIES.sans,
    fontSize:
      ELEEVEON_FONT_SIZES.xs,
    fontWeight:
      ELEEVEON_FONT_WEIGHTS.medium,
    lineHeight:
      ELEEVEON_LINE_HEIGHTS.normal,
  },
} as const satisfies Record<
  string,
  EleeveonTypographyRecipe
>;

export function typographyCssVariables():
  Record<string, string> {
  return {
    "--eds-font-sans":
      ELEEVEON_FONT_FAMILIES.sans,
    "--eds-font-display":
      ELEEVEON_FONT_FAMILIES.display,
    "--eds-font-mono":
      ELEEVEON_FONT_FAMILIES.mono,

    "--eds-font-xs":
      ELEEVEON_FONT_SIZES.xs,
    "--eds-font-sm":
      ELEEVEON_FONT_SIZES.sm,
    "--eds-font-md":
      ELEEVEON_FONT_SIZES.md,
    "--eds-font-base":
      ELEEVEON_FONT_SIZES.base,
    "--eds-font-lg":
      ELEEVEON_FONT_SIZES.lg,
    "--eds-font-xl":
      ELEEVEON_FONT_SIZES.xl,
    "--eds-font-2xl":
      ELEEVEON_FONT_SIZES["2xl"],
    "--eds-font-3xl":
      ELEEVEON_FONT_SIZES["3xl"],
    "--eds-font-4xl":
      ELEEVEON_FONT_SIZES["4xl"],
  };
}
