/**
 * app/lib/design/designTokens.ts
 * --------------------------------------------------------------------------
 * Composes the complete Eleeveon Design System token set.
 */

import {
  semanticColorCssVariables,
  semanticColorsFor,
  type EleeveonAppearanceMode,
} from "./colors";

import {
  shadowCssVariables,
  shadowsFor,
} from "./shadows";

import {
  gradientCssVariables,
  gradientsFor,
} from "./gradients";

import {
  textureCssVariables,
} from "./textures";

import {
  typographyCssVariables,
} from "./typography";

import {
  spacingCssVariables,
  type EleeveonDensity,
} from "./spacing";

import {
  radiusCssVariables,
} from "./radii";

import {
  motionCssVariables,
} from "./motion";

import {
  glassCssVariables,
} from "./glass";

import {
  iconCssVariables,
} from "./iconography";

export interface EleeveonDesignPreferences {
  mode: EleeveonAppearanceMode;
  density?: EleeveonDensity;
  reduceMotion?: boolean;
  primaryColor?: string | null;
  fontFamily?: string | null;
  fontSize?: number | null;
  textureIntensity?: number;
}

export interface EleeveonDesignTokens {
  mode: EleeveonAppearanceMode;
  variables: Record<string, string>;
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

export function createEleeveonDesignTokens(
  preferences:
    EleeveonDesignPreferences,
): EleeveonDesignTokens {
  const mode = preferences.mode;
  const colors =
    semanticColorsFor(mode);

  const variables = {
    ...semanticColorCssVariables(
      colors,
    ),
    ...shadowCssVariables(
      shadowsFor(mode),
    ),
    ...gradientCssVariables(
      gradientsFor(mode),
    ),
    ...textureCssVariables(mode),
    ...typographyCssVariables(),
    ...spacingCssVariables(
      preferences.density ??
        "comfortable",
    ),
    ...radiusCssVariables(),
    ...motionCssVariables(
      preferences.reduceMotion ??
        false,
    ),
    ...glassCssVariables(mode),
    ...iconCssVariables(),
  };

  if (
    preferences.primaryColor?.trim()
  ) {
    const primary =
      preferences.primaryColor.trim();

    variables["--eds-primary"] =
      primary;
    variables["--primary-color"] =
      primary;
    variables["--dashboard-primary"] =
      primary;
    variables["--branch-primary"] =
      primary;
    variables["--accent-color"] =
      primary;
  } else {
    variables["--primary-color"] =
      colors.primary;
    variables["--dashboard-primary"] =
      colors.primary;
    variables["--branch-primary"] =
      colors.primary;
    variables["--accent-color"] =
      colors.primary;
  }

  if (
    preferences.fontFamily?.trim()
  ) {
    variables["--font-family"] =
      preferences.fontFamily.trim();
    variables["--eds-font-sans"] =
      preferences.fontFamily.trim();
  } else {
    variables["--font-family"] =
      variables["--eds-font-sans"];
  }

  const fontSize =
    preferences.fontSize &&
    Number.isFinite(
      preferences.fontSize,
    )
      ? clamp(
          preferences.fontSize,
          12,
          24,
        )
      : 16;

  variables["--font-size"] =
    `${fontSize}px`;

  variables[
    "--eds-texture-intensity"
  ] = String(
    clamp(
      preferences.textureIntensity ??
        1,
      0,
      2,
    ),
  );

  /*
   * Compatibility bridge for legacy role-shell modules.
   * All old surface variables now resolve from the same Eleeveon palette.
   */
  variables["--bg"] =
    variables["--eds-bg"];
  variables["--background"] =
    variables["--eds-bg"];
  variables["--surface"] =
    variables["--eds-surface"];
  variables["--card"] =
    variables["--eds-card"];
  variables["--card-bg"] =
    variables["--eds-card"];
  variables["--input-bg"] =
    variables["--eds-input"];
  variables["--input-text"] =
    variables["--eds-text"];
  variables["--input-border"] =
    variables["--eds-border"];
  variables["--text"] =
    variables["--eds-text"];
  variables["--foreground"] =
    variables["--eds-text"];
  variables["--muted"] =
    variables["--eds-text-muted"];
  variables["--border"] =
    variables["--eds-border"];

  variables["--shell-sidebar-bg"] =
    variables["--eds-sidebar-bg"];
  variables["--shell-header-bg"] =
    variables["--eds-header-bg"];
  variables["--shell-menu-bg"] =
    variables["--eds-drawer-bg"];
  variables["--shell-section-bg"] =
    variables["--eds-surface-sunken"];
  variables["--shell-hover-bg"] =
    variables["--eds-primary-softer"];
  variables["--shell-active-bg"] =
    variables["--eds-primary-soft"];
  variables["--shell-soft-border"] =
    variables["--eds-divider"];

  variables["--eds-window-chrome-color"] =
    variables["--eds-window-bg"];
  variables["--window-chrome-fallback"] =
    variables["--eds-window-bg"];

  variables[
    "--eds-appearance-mode"
  ] = mode;

  return {
    mode,
    variables,
  };
}

export function applyEleeveonDesignTokens(
  target: HTMLElement,
  tokens: EleeveonDesignTokens,
): void {
  target.dataset.appearanceMode =
    tokens.mode;
  target.style.colorScheme =
    tokens.mode;

  for (
    const [name, value] of
    Object.entries(tokens.variables)
  ) {
    target.style.setProperty(
      name,
      value,
    );
  }
}

export function designTokenStyleObject(
  tokens: EleeveonDesignTokens,
): Record<string, string> {
  return {
    ...tokens.variables,
    colorScheme: tokens.mode,
  };
}
