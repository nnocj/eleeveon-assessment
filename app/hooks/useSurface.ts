"use client";

import {
  useMemo,
} from "react";

import {
  useDesign,
} from "../context/design-context";

import useElevation from "./useElevation";

export interface SurfaceRecipe {
  className: string;
  style: React.CSSProperties;
}

export default function useSurface(
  options: {
    inset?: boolean;
    interactive?: boolean;
    branded?: boolean;
  } = {},
): SurfaceRecipe {
  const {
    preferences,
  } = useDesign();

  const elevation =
    useElevation();

  return useMemo(() => {
    const classes = [
      options.inset
        ? "eds-surface-sunken"
        : "eds-surface",
      elevation.className,
      options.interactive &&
        "eds-hover-lift eds-pressable",
      options.branded &&
        "eds-brand-soft",
    ].filter(Boolean);

    return {
      className:
        classes.join(" "),
      style: {
        borderRadius:
          "var(--eds-radius-card)",
        boxShadow:
          elevation.boxShadow,
        forcedColorAdjust:
          preferences.contrast ===
          "high"
            ? "none"
            : undefined,
      },
    };
  }, [
    elevation.boxShadow,
    elevation.className,
    options.branded,
    options.inset,
    options.interactive,
    preferences.contrast,
  ]);
}
