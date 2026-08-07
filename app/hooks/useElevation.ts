"use client";

import {
  useMemo,
} from "react";

import {
  useDesign,
  type DesignSurfaceDepth,
} from "../context/design-context";

export interface ElevationRecipe {
  depth: DesignSurfaceDepth;
  className: string;
  boxShadow: string;
}

const RECIPES:
  Record<
    DesignSurfaceDepth,
    ElevationRecipe
  > = {
  flat: {
    depth: "flat",
    className: "eds-elevation-0",
    boxShadow: "none",
  },
  soft: {
    depth: "soft",
    className: "eds-elevation-1",
    boxShadow:
      "var(--eds-shadow-soft)",
  },
  raised: {
    depth: "raised",
    className: "eds-elevation-3",
    boxShadow:
      "var(--eds-shadow-raised)",
  },
  floating: {
    depth: "floating",
    className: "eds-elevation-4",
    boxShadow:
      "var(--eds-shadow-floating)",
  },
};

export default function useElevation(
  override?:
    | DesignSurfaceDepth
    | null,
): ElevationRecipe {
  const {
    preferences,
  } = useDesign();

  return useMemo(
    () =>
      RECIPES[
        override ||
          preferences.surfaceDepth
      ],
    [
      override,
      preferences.surfaceDepth,
    ],
  );
}
