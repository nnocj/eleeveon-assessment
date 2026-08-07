"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_WINDOW_TITLEBAR_APPEARANCE,
  DEFAULT_WINDOW_TITLEBAR_METRICS,
  type WindowTitlebarAppearance,
  type WindowTitlebarMetrics,
} from "../lib/window";

export interface WindowChromeIdentity {
  title: string;
  workspace: string;

  memberName: string;
  memberRole: string;
  memberImage?: string | null;
  memberMeta?: string | null;

  online: boolean;
  realtimeConnected: boolean;
  initialSyncDone: boolean;
  realtimeStatus: string;

  sidebarHidden: boolean;

  onToggleSidebar?:
    | (() => void)
    | null;

  onOpenStatus?:
    | (() => void)
    | null;

  onOpenAccount?:
    | (() => void)
    | null;
}

export interface WindowChromeContextValue {
  identity: WindowChromeIdentity;

  overlayVisible: boolean;
  titlebarHeight: number;
  metrics: WindowTitlebarMetrics;
  appearance: WindowTitlebarAppearance;

  setIdentity(
    identity:
      Partial<WindowChromeIdentity>,
  ): void;

  clearIdentity(): void;

  setOverlayState(
    visible: boolean,
    height?: number,
    metrics?:
      Partial<WindowTitlebarMetrics>,
  ): void;

  setAppearance(
    appearance:
      Partial<WindowTitlebarAppearance>,
  ): void;
}

const DEFAULT_IDENTITY:
  WindowChromeIdentity = {
  title: "Eleeveon",
  workspace: "School Management",

  memberName: "",
  memberRole: "",
  memberImage: null,
  memberMeta: null,

  online: true,
  realtimeConnected: false,
  initialSyncDone: false,
  realtimeStatus: "idle",

  sidebarHidden: false,

  onToggleSidebar: null,
  onOpenStatus: null,
  onOpenAccount: null,
};

const WindowChromeContext =
  createContext<
    WindowChromeContextValue | null
  >(null);

export function WindowChromeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    identity,
    setIdentityState,
  ] =
    useState<WindowChromeIdentity>(
      DEFAULT_IDENTITY,
    );

  const [
    metrics,
    setMetrics,
  ] =
    useState<WindowTitlebarMetrics>(
      DEFAULT_WINDOW_TITLEBAR_METRICS,
    );

  const [
    appearance,
    setAppearanceState,
  ] =
    useState<WindowTitlebarAppearance>(
      DEFAULT_WINDOW_TITLEBAR_APPEARANCE,
    );

  const setIdentity = useCallback(
    (
      next:
        Partial<WindowChromeIdentity>,
    ) => {
      setIdentityState(
        (current) => ({
          ...current,
          ...next,
        }),
      );
    },
    [],
  );

  const clearIdentity =
    useCallback(() => {
      setIdentityState(
        DEFAULT_IDENTITY,
      );
    }, []);

  const setOverlayState =
    useCallback(
      (
        visible: boolean,
        height = 0,
        nextMetrics?: Partial<
          WindowTitlebarMetrics
        >,
      ) => {
        setMetrics((current) => {
          if (!visible) {
            return {
              ...DEFAULT_WINDOW_TITLEBAR_METRICS,
            };
          }

          return {
            ...current,
            ...nextMetrics,
            visible: true,
            height: Math.max(
              0,
              nextMetrics?.height ??
                height,
            ),
          };
        });
      },
      [],
    );

  const setAppearance =
    useCallback(
      (
        next: Partial<
          WindowTitlebarAppearance
        >,
      ) => {
        setAppearanceState(
          (current) => ({
            ...current,
            ...next,
          }),
        );
      },
      [],
    );

  const value =
    useMemo<WindowChromeContextValue>(
      () => ({
        identity,

        overlayVisible:
          metrics.visible,
        titlebarHeight:
          metrics.height,
        metrics,
        appearance,

        setIdentity,
        clearIdentity,
        setOverlayState,
        setAppearance,
      }),
      [
        appearance,
        clearIdentity,
        identity,
        metrics,
        setAppearance,
        setIdentity,
        setOverlayState,
      ],
    );

  return (
    <WindowChromeContext.Provider
      value={value}
    >
      {children}
    </WindowChromeContext.Provider>
  );
}

export function useWindowChrome() {
  const context = useContext(
    WindowChromeContext,
  );

  if (!context) {
    throw new Error(
      "useWindowChrome must be used inside WindowChromeProvider.",
    );
  }

  return context;
}
