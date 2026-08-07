"use client";

/**
 * app/context/design-context.tsx
 * --------------------------------------------------------------------------
 * Eleeveon design personalisation.
 *
 * Protected workspace branding is owned by ThemeContext.
 * Per-role appearance, density, motion and text are owned by
 * LocalAppearanceRuntime.
 *
 * This context owns the remaining personal design controls and composes
 * runtime-local density/motion as non-persistent overrides. It must never
 * repaint an old global preference over the active role portal.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DesignDensity =
  | "compact"
  | "comfortable"
  | "spacious";

export type DesignSurfaceDepth =
  | "flat"
  | "soft"
  | "raised"
  | "floating";

export type DesignGlassLevel =
  | "none"
  | "subtle"
  | "medium"
  | "strong";

export type DesignCornerTreatment =
  | "soft"
  | "rounded"
  | "expressive";

export type DesignContrast =
  | "standard"
  | "high";

export interface DesignPreferences {
  textureIntensity: number;
  surfaceDepth: DesignSurfaceDepth;
  glassLevel: DesignGlassLevel;
  reduceMotion: boolean;
  density: DesignDensity;
  cornerTreatment: DesignCornerTreatment;
  contrast: DesignContrast;
}

export interface DesignContextValue {
  preferences: DesignPreferences;
  ready: boolean;

  updatePreferences(
    patch:
      Partial<DesignPreferences>,
  ): void;

  resetPreferences(): void;
}

type RuntimeDesignOverrides =
  Partial<
    Pick<
      DesignPreferences,
      "density" |
      "reduceMotion"
    >
  >;

type AppearanceBridgeDetail = {
  density?: string;
  reduceMotion?: boolean;
  source?: string;
  storageKey?: string;
};

export const DEFAULT_DESIGN_PREFERENCES:
  DesignPreferences = {
  textureIntensity: 0.8,
  surfaceDepth: "raised",
  glassLevel: "medium",
  reduceMotion: false,
  density: "comfortable",
  cornerTreatment: "rounded",
  contrast: "standard",
};

const STORAGE_KEY =
  "eleeveon_design_preferences_v1";

const DesignContext =
  createContext<
    DesignContextValue | null
  >(null);

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}

function normalize(
  value:
    | Partial<DesignPreferences>
    | null
    | undefined,
): DesignPreferences {
  const source = value || {};

  return {
    textureIntensity:
      clamp(
        Number(
          source.textureIntensity ??
            DEFAULT_DESIGN_PREFERENCES
              .textureIntensity,
        ),
        0,
        2,
      ),

    surfaceDepth:
      source.surfaceDepth ??
      DEFAULT_DESIGN_PREFERENCES
        .surfaceDepth,

    glassLevel:
      source.glassLevel ??
      DEFAULT_DESIGN_PREFERENCES
        .glassLevel,

    reduceMotion:
      Boolean(
        source.reduceMotion ??
          DEFAULT_DESIGN_PREFERENCES
            .reduceMotion,
      ),

    density:
      source.density ??
      DEFAULT_DESIGN_PREFERENCES
        .density,

    cornerTreatment:
      source.cornerTreatment ??
      DEFAULT_DESIGN_PREFERENCES
        .cornerTreatment,

    contrast:
      source.contrast ??
      DEFAULT_DESIGN_PREFERENCES
        .contrast,
  };
}

function normalizeRuntimeDensity(
  value: unknown,
): DesignDensity | undefined {
  const density =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    density === "compact" ||
    density === "comfortable" ||
    density === "spacious"
  ) {
    return density;
  }

  return undefined;
}

function readStoredPreferences() {
  if (
    typeof window === "undefined"
  ) {
    return {
      ...DEFAULT_DESIGN_PREFERENCES,
    };
  }

  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    return normalize(
      raw
        ? JSON.parse(raw)
        : null,
    );
  } catch {
    return {
      ...DEFAULT_DESIGN_PREFERENCES,
    };
  }
}

function readRuntimeOverrides():
  RuntimeDesignOverrides {
  if (
    typeof document === "undefined"
  ) {
    return {};
  }

  const root =
    document.documentElement;

  const density =
    normalizeRuntimeDensity(
      root.dataset.localDensity,
    );

  const reduceMotion =
    root.dataset.reduceMotion ===
      "true"
      ? true
      : root.dataset
            .reduceMotion ===
          "false"
        ? false
        : undefined;

  return {
    ...(density
      ? { density }
      : {}),
    ...(reduceMotion !== undefined
      ? { reduceMotion }
      : {}),
  };
}

function applyToDocument(
  preferences:
    DesignPreferences,
) {
  if (
    typeof document === "undefined"
  ) {
    return;
  }

  const root =
    document.documentElement;

  root.dataset.designDensity =
    preferences.density;
  root.dataset.surfaceDepth =
    preferences.surfaceDepth;
  root.dataset.glassLevel =
    preferences.glassLevel;
  root.dataset.cornerTreatment =
    preferences.cornerTreatment;
  root.dataset.designContrast =
    preferences.contrast;

  root.toggleAttribute(
    "data-reduce-motion",
    preferences.reduceMotion,
  );

  root.style.setProperty(
    "--eds-texture-intensity",
    String(
      preferences.textureIntensity,
    ),
  );

  const densityVariables = {
    compact: {
      control: "2.25rem",
      card: "0.65rem",
      gap: "0.55rem",
    },
    comfortable: {
      control: "2.625rem",
      card: "0.875rem",
      gap: "0.75rem",
    },
    spacious: {
      control: "3rem",
      card: "1.125rem",
      gap: "1rem",
    },
  }[preferences.density];

  root.style.setProperty(
    "--eds-control-height",
    densityVariables.control,
  );
  root.style.setProperty(
    "--eds-card-padding",
    densityVariables.card,
  );
  root.style.setProperty(
    "--eds-section-gap",
    densityVariables.gap,
  );

  const radiusVariables = {
    soft: {
      control: "0.625rem",
      card: "0.875rem",
      panel: "1.25rem",
    },
    rounded: {
      control: "0.875rem",
      card: "1.125rem",
      panel: "1.75rem",
    },
    expressive: {
      control: "1.1rem",
      card: "1.5rem",
      panel: "2.1rem",
    },
  }[
    preferences.cornerTreatment
  ];

  root.style.setProperty(
    "--eds-radius-control",
    radiusVariables.control,
  );
  root.style.setProperty(
    "--eds-radius-card",
    radiusVariables.card,
  );
  root.style.setProperty(
    "--eds-radius-panel",
    radiusVariables.panel,
  );

  root.style.setProperty(
    "--eds-personal-motion-duration",
    preferences.reduceMotion
      ? "0.001ms"
      : "var(--eds-duration-standard)",
  );

  root.dispatchEvent(
    new CustomEvent(
      "eleeveon:design-preferences-applied",
      {
        detail: {
          preferences,
          at: Date.now(),
        },
      },
    ),
  );
}

export function DesignProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    storedPreferences,
    setStoredPreferences,
  ] =
    useState<DesignPreferences>(
      DEFAULT_DESIGN_PREFERENCES,
    );

  const [
    runtimeOverrides,
    setRuntimeOverrides,
  ] =
    useState<
      RuntimeDesignOverrides
    >({});

  const [
    ready,
    setReady,
  ] =
    useState(false);

  const preferences =
    useMemo(
      () =>
        normalize({
          ...storedPreferences,
          ...runtimeOverrides,
        }),
      [
        runtimeOverrides,
        storedPreferences,
      ],
    );

  useEffect(() => {
    const stored =
      readStoredPreferences();

    setStoredPreferences(stored);
    setRuntimeOverrides(
      readRuntimeOverrides(),
    );
    setReady(true);
  }, []);

  /*
   * Persist only the true design preferences. Role-local density and motion
   * are runtime overrides and must remain scoped to their local settings key.
   */
  useEffect(() => {
    if (!ready) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          storedPreferences,
        ),
      );
    } catch {
      // Storage restrictions must not break appearance.
    }
  }, [
    ready,
    storedPreferences,
  ]);

  useEffect(() => {
    if (!ready) return;

    applyToDocument(
      preferences,
    );
  }, [
    preferences,
    ready,
  ]);

  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const handleBridge = (
      event: Event,
    ) => {
      const detail =
        (
          event as CustomEvent<
            AppearanceBridgeDetail
          >
        ).detail || {};

      setRuntimeOverrides(
        (current) => ({
          ...current,
          ...(normalizeRuntimeDensity(
            detail.density,
          )
            ? {
                density:
                  normalizeRuntimeDensity(
                    detail.density,
                  ),
              }
            : {}),
          ...(typeof detail
            .reduceMotion ===
          "boolean"
            ? {
                reduceMotion:
                  detail.reduceMotion,
              }
            : {}),
        }),
      );
    };

    window.addEventListener(
      "eleeveon:appearance-design-bridge",
      handleBridge,
    );

    return () => {
      window.removeEventListener(
        "eleeveon:appearance-design-bridge",
        handleBridge,
      );
    };
  }, []);

  const updatePreferences =
    useCallback(
      (
        patch:
          Partial<DesignPreferences>,
      ) => {
        setStoredPreferences(
          (current) =>
            normalize({
              ...current,
              ...patch,
            }),
        );
      },
      [],
    );

  const resetPreferences =
    useCallback(() => {
      setStoredPreferences({
        ...DEFAULT_DESIGN_PREFERENCES,
      });
    }, []);

  const value =
    useMemo<DesignContextValue>(
      () => ({
        preferences,
        ready,
        updatePreferences,
        resetPreferences,
      }),
      [
        preferences,
        ready,
        resetPreferences,
        updatePreferences,
      ],
    );

  return (
    <DesignContext.Provider
      value={value}
    >
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context =
    useContext(
      DesignContext,
    );

  if (!context) {
    throw new Error(
      "useDesign must be used inside DesignProvider.",
    );
  }

  return context;
}
