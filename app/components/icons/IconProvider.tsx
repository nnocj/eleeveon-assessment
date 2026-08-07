"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import type {
  EleeveonIconSize,
  EleeveonIconTone,
  IconProviderValue,
} from "./icon-types";

const DEFAULT_ICON_CONTEXT:
  IconProviderValue = {
  size: "md",
  tone: "current",
  strokeWidth: 1.8,
};

const IconContext =
  createContext<IconProviderValue>(
    DEFAULT_ICON_CONTEXT,
  );

export interface IconProviderProps {
  children: ReactNode;
  size?: EleeveonIconSize;
  tone?: EleeveonIconTone;
  strokeWidth?: number;
}

export default function IconProvider({
  children,
  size = DEFAULT_ICON_CONTEXT.size,
  tone = DEFAULT_ICON_CONTEXT.tone,
  strokeWidth =
    DEFAULT_ICON_CONTEXT.strokeWidth,
}: IconProviderProps) {
  const value =
    useMemo<IconProviderValue>(
      () => ({
        size,
        tone,
        strokeWidth,
      }),
      [
        size,
        strokeWidth,
        tone,
      ],
    );

  return (
    <IconContext.Provider
      value={value}
    >
      {children}
    </IconContext.Provider>
  );
}

export function useIconDefaults() {
  return useContext(IconContext);
}
