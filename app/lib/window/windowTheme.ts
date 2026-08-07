/**
 * app/lib/window/windowTheme.ts
 * --------------------------------------------------------------------------
 * Theme-colour and installed-window helpers.
 */

export type WindowAppearanceMode =
  | "light"
  | "dark";

export interface WindowThemeRecipe {
  themeColor: string;
  backgroundColor: string;
  textColor: string;
  mutedColor: string;
}

export const WINDOW_THEME_RECIPES:
  Record<
    WindowAppearanceMode,
    WindowThemeRecipe
  > = {
  light: {
    themeColor: "#f8fafc",
    backgroundColor: "#f8fafc",
    textColor: "#0f172a",
    mutedColor: "#64748b",
  },
  dark: {
    themeColor: "#0f172a",
    backgroundColor: "#07101f",
    textColor: "#f8fbff",
    mutedColor: "#9fb0c7",
  },
};

export function windowThemeFor(
  mode: WindowAppearanceMode,
): WindowThemeRecipe {
  return WINDOW_THEME_RECIPES[mode];
}

export function updateThemeColorMeta(
  color: string,
): void {
  if (
    typeof document === "undefined"
  ) {
    return;
  }

  let meta =
    document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][data-eleeveon-runtime="true"]',
    );

  if (!meta) {
    meta =
      document.createElement("meta");
    meta.name = "theme-color";
    meta.dataset.eleeveonRuntime =
      "true";
    document.head.appendChild(meta);
  }

  meta.content = color;
}

export function isInstalledDisplayMode():
  boolean {
  if (
    typeof window === "undefined"
  ) {
    return false;
  }

  return [
    "standalone",
    "window-controls-overlay",
    "fullscreen",
  ].some((mode) =>
    window.matchMedia(
      `(display-mode: ${mode})`,
    ).matches,
  );
}
