/**
 * app/lib/window/titlebarAppearance.ts
 * --------------------------------------------------------------------------
 * Title-bar visual and content-density helpers.
 */

export type WindowTitlebarDensity =
  | "compact"
  | "comfortable";

export type WindowTitlebarTexture =
  | "none"
  | "dots"
  | "grain"
  | "network";

export interface WindowTitlebarAppearance {
  density: WindowTitlebarDensity;
  texture: WindowTitlebarTexture;
  glow: boolean;
  divider: boolean;
  shadow: boolean;
  showWorkspace: boolean;
  showMemberRole: boolean;
}

export const DEFAULT_WINDOW_TITLEBAR_APPEARANCE:
  WindowTitlebarAppearance = {
  density: "compact",
  texture: "dots",
  glow: true,
  divider: true,
  shadow: true,
  showWorkspace: true,
  showMemberRole: true,
};

export function titlebarHeightFor(
  density: WindowTitlebarDensity,
): number {
  return density === "compact"
    ? 36
    : 42;
}

export function titlebarAppearanceCssVariables(
  appearance:
    WindowTitlebarAppearance,
): Record<string, string> {
  return {
    "--eds-window-density":
      appearance.density,
    "--eds-window-min-height":
      `${titlebarHeightFor(
        appearance.density,
      )}px`,
    "--eds-window-texture":
      appearance.texture,
    "--eds-window-glow":
      appearance.glow
        ? "1"
        : "0",
    "--eds-window-divider":
      appearance.divider
        ? "1"
        : "0",
    "--eds-window-shadow":
      appearance.shadow
        ? "1"
        : "0",
  };
}
