/**
 * app/lib/design/textures.ts
 * --------------------------------------------------------------------------
 * CSS-generated texture recipes. These avoid large raster assets and remain
 * theme-aware.
 */

import type {
  EleeveonAppearanceMode,
} from "./colors";

export type EleeveonTextureName =
  | "none"
  | "grain"
  | "microDots"
  | "grid"
  | "network"
  | "paper";

export interface EleeveonTextureRecipe {
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition?: string;
  opacity: number;
  blendMode:
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "soft-light";
}

const lightInk =
  "rgba(15, 23, 42, .22)";
const darkInk =
  "rgba(226, 232, 240, .28)";

export function textureRecipe(
  name: EleeveonTextureName,
  mode: EleeveonAppearanceMode,
): EleeveonTextureRecipe {
  const ink =
    mode === "dark"
      ? darkInk
      : lightInk;

  switch (name) {
    case "grain":
      return {
        backgroundImage:
          `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".78" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity=".34"/></svg>`,
          )}")`,
        backgroundSize: "140px 140px",
        opacity:
          mode === "dark"
            ? 0.055
            : 0.035,
        blendMode:
          mode === "dark"
            ? "screen"
            : "multiply",
      };

    case "microDots":
      return {
        backgroundImage:
          `radial-gradient(${ink} .55px, transparent .7px)`,
        backgroundSize: "10px 10px",
        opacity:
          mode === "dark"
            ? 0.12
            : 0.09,
        blendMode: "normal",
      };

    case "grid":
      return {
        backgroundImage:
          `linear-gradient(${ink} 1px, transparent 1px), linear-gradient(90deg, ${ink} 1px, transparent 1px)`,
        backgroundSize:
          "24px 24px",
        opacity:
          mode === "dark"
            ? 0.09
            : 0.055,
        blendMode: "normal",
      };

    case "network":
      return {
        backgroundImage:
          `radial-gradient(circle at 20% 28%, ${ink} 1px, transparent 1.4px), radial-gradient(circle at 68% 18%, ${ink} 1px, transparent 1.4px), radial-gradient(circle at 82% 72%, ${ink} 1px, transparent 1.4px), linear-gradient(118deg, transparent 48%, ${ink} 49%, transparent 50%)`,
        backgroundSize:
          "96px 96px",
        opacity:
          mode === "dark"
            ? 0.11
            : 0.07,
        blendMode: "normal",
      };

    case "paper":
      return {
        backgroundImage:
          `linear-gradient(90deg, transparent 96%, ${ink} 100%), linear-gradient(transparent 96%, ${ink} 100%)`,
        backgroundSize:
          "6px 6px",
        opacity:
          mode === "dark"
            ? 0.045
            : 0.035,
        blendMode: "soft-light",
      };

    default:
      return {
        backgroundImage: "none",
        backgroundSize: "auto",
        opacity: 0,
        blendMode: "normal",
      };
  }
}

export const ELEEVEON_TEXTURE_DEFAULTS = {
  page: "microDots",
  hero: "network",
  card: "grain",
  window: "microDots",
  sidebar: "grain",
} as const satisfies Record<
  string,
  EleeveonTextureName
>;

export function textureCssVariables(
  mode: EleeveonAppearanceMode,
): Record<string, string> {
  const grain =
    textureRecipe("grain", mode);
  const dots =
    textureRecipe(
      "microDots",
      mode,
    );
  const grid =
    textureRecipe("grid", mode);
  const network =
    textureRecipe(
      "network",
      mode,
    );

  return {
    "--eds-texture-grain":
      grain.backgroundImage,
    "--eds-texture-grain-size":
      grain.backgroundSize,
    "--eds-texture-grain-opacity":
      String(grain.opacity),

    "--eds-texture-dots":
      dots.backgroundImage,
    "--eds-texture-dots-size":
      dots.backgroundSize,
    "--eds-texture-dots-opacity":
      String(dots.opacity),

    "--eds-texture-grid":
      grid.backgroundImage,
    "--eds-texture-grid-size":
      grid.backgroundSize,
    "--eds-texture-grid-opacity":
      String(grid.opacity),

    "--eds-texture-network":
      network.backgroundImage,
    "--eds-texture-network-size":
      network.backgroundSize,
    "--eds-texture-network-opacity":
      String(network.opacity),
  };
}
