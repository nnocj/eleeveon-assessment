/**
 * app/lib/design/gradients.ts
 * --------------------------------------------------------------------------
 * Signature Eleeveon gradient recipes.
 */

import type {
  EleeveonAppearanceMode,
} from "./colors";

export interface EleeveonGradientSet {
  brand: string;
  brandSoft: string;
  hero: string;
  pageGlow: string;
  windowChrome: string;
  sidebar: string;
  cardSheen: string;
  success: string;
  warning: string;
  danger: string;
}

export const ELEEVEON_LIGHT_GRADIENTS:
  EleeveonGradientSet = {
  brand:
    "linear-gradient(135deg, #2f6fed 0%, #4f7cff 48%, #6757e8 100%)",
  brandSoft:
    "linear-gradient(135deg, rgba(47,111,237,.15), rgba(99,102,241,.07))",
  hero:
    "radial-gradient(circle at 16% 0%, rgba(47,111,237,.22), transparent 40%), linear-gradient(135deg, #eef5ff 0%, #ffffff 58%, #f5f3ff 100%)",
  pageGlow:
    "radial-gradient(circle at 12% 10%, rgba(47,111,237,.10), transparent 30%), radial-gradient(circle at 88% 4%, rgba(99,102,241,.08), transparent 28%)",
  windowChrome:
    "linear-gradient(180deg, rgba(255,255,255,.96), rgba(247,250,255,.92))",
  sidebar:
    "linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,255,.96))",
  cardSheen:
    "linear-gradient(135deg, rgba(255,255,255,.82), rgba(255,255,255,.12) 42%, transparent 70%)",
  success:
    "linear-gradient(135deg, #16a34a, #22c55e)",
  warning:
    "linear-gradient(135deg, #d97706, #f59e0b)",
  danger:
    "linear-gradient(135deg, #dc2626, #ef4444)",
};

export const ELEEVEON_DARK_GRADIENTS:
  EleeveonGradientSet = {
  brand:
    "linear-gradient(135deg, #6f9cff 0%, #7998ff 48%, #8b7cff 100%)",
  brandSoft:
    "linear-gradient(135deg, rgba(111,156,255,.20), rgba(139,124,255,.09))",
  hero:
    "radial-gradient(circle at 16% 0%, rgba(111,156,255,.23), transparent 38%), linear-gradient(135deg, #101d31 0%, #0e192a 58%, #16172e 100%)",
  pageGlow:
    "radial-gradient(circle at 12% 9%, rgba(111,156,255,.13), transparent 31%), radial-gradient(circle at 88% 4%, rgba(139,124,255,.11), transparent 29%)",
  windowChrome:
    "linear-gradient(180deg, rgba(17,30,49,.97), rgba(10,20,35,.94))",
  sidebar:
    "linear-gradient(180deg, rgba(15,27,45,.99), rgba(9,19,34,.98))",
  cardSheen:
    "linear-gradient(135deg, rgba(255,255,255,.06), transparent 44%)",
  success:
    "linear-gradient(135deg, #22c55e, #4ade80)",
  warning:
    "linear-gradient(135deg, #f59e0b, #fbbf24)",
  danger:
    "linear-gradient(135deg, #ef4444, #f87171)",
};

export function gradientsFor(
  mode: EleeveonAppearanceMode,
): EleeveonGradientSet {
  return mode === "dark"
    ? ELEEVEON_DARK_GRADIENTS
    : ELEEVEON_LIGHT_GRADIENTS;
}

export function gradientCssVariables(
  gradients: EleeveonGradientSet,
): Record<string, string> {
  return {
    "--eds-gradient-brand":
      gradients.brand,
    "--eds-gradient-brand-soft":
      gradients.brandSoft,
    "--eds-gradient-hero":
      gradients.hero,
    "--eds-gradient-page-glow":
      gradients.pageGlow,
    "--eds-gradient-window":
      gradients.windowChrome,
    "--eds-gradient-sidebar":
      gradients.sidebar,
    "--eds-gradient-card-sheen":
      gradients.cardSheen,
    "--eds-gradient-success":
      gradients.success,
    "--eds-gradient-warning":
      gradients.warning,
    "--eds-gradient-danger":
      gradients.danger,
  };
}
