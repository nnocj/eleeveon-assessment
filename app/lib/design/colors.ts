/**
 * app/lib/design/colors.ts
 * --------------------------------------------------------------------------
 * Canonical Eleeveon colour foundations.
 *
 * This file deliberately separates:
 * - raw colour scales;
 * - semantic light/dark palettes;
 * - CSS-variable export helpers.
 *
 * Product code should prefer semantic tokens over raw hex values.
 */

export const ELEEVEON_BLUE = {
  50: "#eff6ff",
  100: "#dbeafe",
  200: "#bfdbfe",
  300: "#93c5fd",
  400: "#60a5fa",
  500: "#3b82f6",
  600: "#2563eb",
  700: "#1d4ed8",
  800: "#1e40af",
  900: "#1e3a8a",
  950: "#172554",
} as const;

export const ELEEVEON_INDIGO = {
  50: "#eef2ff",
  100: "#e0e7ff",
  200: "#c7d2fe",
  300: "#a5b4fc",
  400: "#818cf8",
  500: "#6366f1",
  600: "#4f46e5",
  700: "#4338ca",
  800: "#3730a3",
  900: "#312e81",
  950: "#1e1b4b",
} as const;

export const ELEEVEON_SKY = {
  50: "#f0f9ff",
  100: "#e0f2fe",
  200: "#bae6fd",
  300: "#7dd3fc",
  400: "#38bdf8",
  500: "#0ea5e9",
  600: "#0284c7",
  700: "#0369a1",
  800: "#075985",
  900: "#0c4a6e",
  950: "#082f49",
} as const;

export const ELEEVEON_SLATE = {
  0: "#ffffff",
  25: "#fcfdff",
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
  950: "#020617",
  1000: "#000000",
} as const;

export const ELEEVEON_SUCCESS = {
  light: "#dcfce7",
  main: "#16a34a",
  strong: "#166534",
} as const;

export const ELEEVEON_WARNING = {
  light: "#fef3c7",
  main: "#d97706",
  strong: "#92400e",
} as const;

export const ELEEVEON_DANGER = {
  light: "#fee2e2",
  main: "#dc2626",
  strong: "#991b1b",
} as const;

export const ELEEVEON_INFO = {
  light: "#e0f2fe",
  main: "#0284c7",
  strong: "#075985",
} as const;

export type EleeveonAppearanceMode =
  | "light"
  | "dark";

export interface EleeveonSemanticColors {
  background: string;
  backgroundRaised: string;
  surface: string;
  surfaceRaised: string;
  surfaceSunken: string;
  surfaceStrong: string;
  card: string;
  cardStrong: string;
  input: string;
  overlay: string;

  text: string;
  textStrong: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;

  border: string;
  borderStrong: string;
  divider: string;
  focusRing: string;

  primary: string;
  primaryHover: string;
  primaryActive: string;
  primarySoft: string;
  primarySofter: string;
  primaryText: string;

  success: string;
  warning: string;
  danger: string;
  info: string;
}

export const ELEEVEON_LIGHT_COLORS:
  EleeveonSemanticColors = {
  background: "#f4f7fb",
  backgroundRaised: "#f8fafc",
  surface: "#ffffff",
  surfaceRaised: "#ffffff",
  surfaceSunken: "#f1f5f9",
  surfaceStrong: "#e8eef6",
  card: "#ffffff",
  cardStrong: "#fbfcfe",
  input: "#ffffff",
  overlay: "rgba(15, 23, 42, 0.44)",

  text: "#263244",
  textStrong: "#111827",
  textMuted: "#667085",
  textSubtle: "#98a2b3",
  textInverse: "#ffffff",

  border: "rgba(15, 23, 42, 0.09)",
  borderStrong: "rgba(15, 23, 42, 0.16)",
  divider: "rgba(15, 23, 42, 0.075)",
  focusRing: "rgba(47, 111, 237, 0.30)",

  primary: "#2f6fed",
  primaryHover: "#285fcf",
  primaryActive: "#214fae",
  primarySoft: "rgba(47, 111, 237, 0.105)",
  primarySofter: "rgba(47, 111, 237, 0.055)",
  primaryText: "#ffffff",

  success: ELEEVEON_SUCCESS.main,
  warning: ELEEVEON_WARNING.main,
  danger: ELEEVEON_DANGER.main,
  info: ELEEVEON_INFO.main,
};

export const ELEEVEON_DARK_COLORS:
  EleeveonSemanticColors = {
  background: "#0b1220",
  backgroundRaised: "#0f1828",
  surface: "#111a2b",
  surfaceRaised: "#162136",
  surfaceSunken: "#0c1524",
  surfaceStrong: "#1b2940",
  card: "#121d2f",
  cardStrong: "#17243a",
  input: "#0f1929",
  overlay: "rgba(2, 6, 23, 0.74)",

  text: "#e9eef7",
  textStrong: "#f8fafc",
  textMuted: "#a7b0c0",
  textSubtle: "#7f8ba0",
  textInverse: "#0b1220",

  border: "rgba(255, 255, 255, 0.11)",
  borderStrong: "rgba(255, 255, 255, 0.18)",
  divider: "rgba(255, 255, 255, 0.085)",
  focusRing: "rgba(111, 156, 255, 0.38)",

  primary: "#7aa2ff",
  primaryHover: "#91b2ff",
  primaryActive: "#6691ee",
  primarySoft: "rgba(122, 162, 255, 0.15)",
  primarySofter: "rgba(122, 162, 255, 0.075)",
  primaryText: "#08111f",

  success: "#4ade80",
  warning: "#fbbf24",
  danger: "#f87171",
  info: "#38bdf8",
};

export function semanticColorsFor(
  mode: EleeveonAppearanceMode,
): EleeveonSemanticColors {
  return mode === "dark"
    ? ELEEVEON_DARK_COLORS
    : ELEEVEON_LIGHT_COLORS;
}

export function semanticColorCssVariables(
  colors: EleeveonSemanticColors,
): Record<string, string> {
  return {
    "--eds-bg": colors.background,
    "--eds-bg-raised":
      colors.backgroundRaised,
    "--eds-surface": colors.surface,
    "--eds-surface-raised":
      colors.surfaceRaised,
    "--eds-surface-sunken":
      colors.surfaceSunken,
    "--eds-surface-strong":
      colors.surfaceStrong,
    "--eds-card": colors.card,
    "--eds-card-strong":
      colors.cardStrong,
    "--eds-input": colors.input,
    "--eds-overlay": colors.overlay,

    /*
     * Mature shell rule:
     * shell chrome is a neutral surface; brand colour is accent-only.
     */
    "--eds-shell-bg": colors.background,
    "--eds-sidebar-bg":
      colors.backgroundRaised,
    "--eds-header-bg":
      colors.backgroundRaised,
    "--eds-drawer-bg":
      colors.surface,
    "--eds-window-bg":
      colors.backgroundRaised,

    "--eds-text": colors.text,
    "--eds-text-strong":
      colors.textStrong,
    "--eds-text-muted":
      colors.textMuted,
    "--eds-text-subtle":
      colors.textSubtle,
    "--eds-text-inverse":
      colors.textInverse,

    "--eds-border": colors.border,
    "--eds-border-strong":
      colors.borderStrong,
    "--eds-divider": colors.divider,
    "--eds-focus-ring":
      colors.focusRing,

    "--eds-primary": colors.primary,
    "--eds-primary-hover":
      colors.primaryHover,
    "--eds-primary-active":
      colors.primaryActive,
    "--eds-primary-soft":
      colors.primarySoft,
    "--eds-primary-softer":
      colors.primarySofter,
    "--eds-primary-text":
      colors.primaryText,

    "--eds-success": colors.success,
    "--eds-warning": colors.warning,
    "--eds-danger": colors.danger,
    "--eds-info": colors.info,

    // Compatibility aliases used throughout the current application.
    "--bg": colors.background,
    "--surface": colors.surface,
    "--card": colors.card,
    "--card-bg": colors.card,
    "--input-bg": colors.input,
    "--text": colors.text,
    "--muted": colors.textMuted,
    "--border": colors.border,
  };
}
