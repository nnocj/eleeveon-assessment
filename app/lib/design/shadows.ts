/**
 * app/lib/design/shadows.ts
 * --------------------------------------------------------------------------
 * Theme-aware shadow recipes.
 */

import type {
  EleeveonAppearanceMode,
} from "./colors";

export interface EleeveonShadowSet {
  hairline: string;
  soft: string;
  card: string;
  raised: string;
  floating: string;
  overlay: string;
  insetHighlight: string;
}

export const ELEEVEON_LIGHT_SHADOWS:
  EleeveonShadowSet = {
  hairline:
    "0 1px 0 rgba(255,255,255,.82) inset",
  soft:
    "0 6px 20px rgba(15,23,42,.055)",
  card:
    "0 10px 28px rgba(15,23,42,.075), 0 1px 2px rgba(15,23,42,.035)",
  raised:
    "0 18px 44px rgba(15,23,42,.105), 0 3px 10px rgba(15,23,42,.055)",
  floating:
    "0 28px 70px rgba(15,23,42,.15), 0 8px 24px rgba(15,23,42,.08)",
  overlay:
    "0 34px 90px rgba(15,23,42,.24)",
  insetHighlight:
    "inset 0 1px 0 rgba(255,255,255,.86)",
};

export const ELEEVEON_DARK_SHADOWS:
  EleeveonShadowSet = {
  hairline:
    "0 1px 0 rgba(255,255,255,.04) inset",
  soft:
    "0 8px 24px rgba(0,0,0,.20)",
  card:
    "0 12px 34px rgba(0,0,0,.26), 0 1px 0 rgba(255,255,255,.025) inset",
  raised:
    "0 20px 52px rgba(0,0,0,.34), 0 1px 0 rgba(255,255,255,.035) inset",
  floating:
    "0 30px 80px rgba(0,0,0,.46), 0 10px 26px rgba(0,0,0,.24)",
  overlay:
    "0 36px 100px rgba(0,0,0,.62)",
  insetHighlight:
    "inset 0 1px 0 rgba(255,255,255,.045)",
};

export function shadowsFor(
  mode: EleeveonAppearanceMode,
): EleeveonShadowSet {
  return mode === "dark"
    ? ELEEVEON_DARK_SHADOWS
    : ELEEVEON_LIGHT_SHADOWS;
}

export function shadowCssVariables(
  shadows: EleeveonShadowSet,
): Record<string, string> {
  return {
    "--eds-shadow-hairline":
      shadows.hairline,
    "--eds-shadow-soft":
      shadows.soft,
    "--eds-shadow-card":
      shadows.card,
    "--eds-shadow-raised":
      shadows.raised,
    "--eds-shadow-floating":
      shadows.floating,
    "--eds-shadow-overlay":
      shadows.overlay,
    "--eds-inset-highlight":
      shadows.insetHighlight,

    // Compatibility alias.
    "--shell-shadow":
      shadows.raised,
  };
}
