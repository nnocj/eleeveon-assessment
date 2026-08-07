"use client";

import {
  useMemo,
} from "react";

import {
  useWindowChrome,
} from "../context/window-chrome-context";

import {
  useDesign,
} from "../context/design-context";

export default function useWindowTheme() {
  const windowChrome =
    useWindowChrome();

  const design =
    useDesign();

  return useMemo(
    () => ({
      overlayVisible:
        windowChrome.overlayVisible,
      metrics:
        windowChrome.metrics,
      appearance:
        windowChrome.appearance,
      density:
        design.preferences.density,
      glassLevel:
        design.preferences.glassLevel,
      contrast:
        design.preferences.contrast,
      reduceMotion:
        design.preferences.reduceMotion,
      setWindowAppearance:
        windowChrome.setAppearance,
    }),
    [
      design.preferences.contrast,
      design.preferences.density,
      design.preferences.glassLevel,
      design.preferences.reduceMotion,
      windowChrome.appearance,
      windowChrome.metrics,
      windowChrome.overlayVisible,
      windowChrome.setAppearance,
    ],
  );
}
