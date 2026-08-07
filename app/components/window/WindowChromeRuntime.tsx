"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useAccount,
} from "../../context/account-context";

import {
  useActiveMembership,
} from "../../context/active-membership-context";

import {
  useWindowChrome,
} from "../../context/window-chrome-context";

import {
  getPortalPathByRole,
} from "../../lib/auth/roleRedirect";

import {
  getWindowControlsOverlay,
  isInstalledDisplayMode,
  publishWindowMetrics,
  readWindowTitlebarMetrics,
  titlebarAppearanceCssVariables,
  updateThemeColorMeta,
  windowThemeFor,
} from "../../lib/window";

const OPEN_WORKSPACE_KEY =
  "eleeveon_open_workspace";

function storedWorkspaceRole():
  | string
  | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      window.localStorage.getItem(
        OPEN_WORKSPACE_KEY,
      ) ||
      window.sessionStorage.getItem(
        OPEN_WORKSPACE_KEY,
      );

    if (!raw) return null;

    const parsed =
      JSON.parse(raw) as {
        role?: string | null;
        membership?: {
          role?: string | null;
        } | null;
      };

    return (
      String(
        parsed.role ||
          parsed.membership?.role ||
          "",
      ).trim() || null
    );
  } catch {
    return null;
  }
}

function resolvedAppearanceMode() {
  if (
    typeof document === "undefined"
  ) {
    return "light" as const;
  }

  return document.documentElement
    .dataset.appearanceMode ===
    "dark"
    ? ("dark" as const)
    : ("light" as const);
}


function firstComputedColor(
  styles: CSSStyleDeclaration,
  ...names: string[]
): string | null {
  for (const name of names) {
    const value =
      styles
        .getPropertyValue(name)
        .trim();

    if (value) return value;
  }

  return null;
}

function resolveWindowChromeColor(
  mode: "light" | "dark",
): string {
  if (
    typeof document === "undefined"
  ) {
    return mode === "dark"
      ? "#0f172a"
      : "#f8fafc";
  }

  const root =
    document.documentElement;

  const styles =
    window.getComputedStyle(root);

  return (
    firstComputedColor(
      styles,
      "--shell-header-solid",
      "--eds-window-chrome-color",
      "--surface",
      "--eds-surface",
      "--card-bg",
      "--eds-card",
    ) ||
    (mode === "dark"
      ? "#0f172a"
      : "#f8fafc")
  );
}

export default function WindowChromeRuntime() {
  const router = useRouter();
  const pathname = usePathname();
  const account = useAccount();
  const membership =
    useActiveMembership();

  const {
    setOverlayState,
    appearance,
  } = useWindowChrome();

  const redirectedRef =
    useRef(false);

  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const overlay =
      getWindowControlsOverlay();

    const updateGeometry = () => {
      const rawMetrics =
        readWindowTitlebarMetrics(
          overlay,
        );

      /*
       * Some Chromium builds briefly report visible=true with an unusable
       * zero-height rectangle while the native show/hide control changes
       * state. Treat that transitional geometry as unavailable.
       */
      const visible = Boolean(
        rawMetrics.visible &&
          rawMetrics.height >= 24 &&
          rawMetrics.width >= 180,
      );

      const metrics = visible
        ? rawMetrics
        : {
            ...rawMetrics,
            visible: false,
            height: 0,
          };

      setOverlayState(
        visible,
        metrics.height,
        metrics,
      );

      publishWindowMetrics(
        document.documentElement,
        metrics,
      );

      const root =
        document.documentElement;

      root.toggleAttribute(
        "data-installed-app",
        isInstalledDisplayMode(),
      );

      root.toggleAttribute(
        "data-window-overlay-visible",
        visible,
      );

      root.style.setProperty(
        "--eds-shell-top-offset",
        visible
          ? `${metrics.height}px`
          : "0px",
      );
    };

    updateGeometry();

    overlay?.addEventListener(
      "geometrychange",
      updateGeometry,
    );

    const mediaQueries = [
      "standalone",
      "window-controls-overlay",
      "fullscreen",
    ].map((mode) =>
      window.matchMedia(
        `(display-mode: ${mode})`,
      ),
    );

    for (const query of mediaQueries) {
      query.addEventListener(
        "change",
        updateGeometry,
      );
    }

    return () => {
      overlay?.removeEventListener(
        "geometrychange",
        updateGeometry,
      );

      for (
        const query of mediaQueries
      ) {
        query.removeEventListener(
          "change",
          updateGeometry,
        );
      }
    };
  }, [setOverlayState]);

  useEffect(() => {
    if (
      typeof document === "undefined"
    ) {
      return;
    }

    const root =
      document.documentElement;

    const publishAppearance = () => {
      const mode =
        resolvedAppearanceMode();

      const recipe =
        windowThemeFor(mode);

      const chromeColor =
        resolveWindowChromeColor(
          mode,
        );

      /*
       * The browser-owned caption-button strip uses the page theme colour.
       * Publishing the exact same solid colour used by WindowTitleBar makes
       * minimise, maximise and close feel like part of the portal header.
       */
      root.style.setProperty(
        "--eds-window-chrome-color",
        chromeColor,
      );

      root.style.setProperty(
        "--eds-window-chrome-foreground",
        mode === "dark"
          ? "#f8fafc"
          : "#0f172a",
      );

      updateThemeColorMeta(
        chromeColor ||
          recipe.themeColor,
      );

      root.dataset.windowMode =
        mode;

      for (
        const [name, value] of
        Object.entries(
          titlebarAppearanceCssVariables(
            appearance,
          ),
        )
      ) {
        root.style.setProperty(
          name,
          value,
        );
      }
    };

    publishAppearance();

    const observer =
      new MutationObserver(
        publishAppearance,
      );

    observer.observe(root, {
      attributes: true,
      attributeFilter: [
        "data-appearance-mode",
        "data-theme",
        "style",
        "data-window-overlay-visible",
      ],
    });

    window.addEventListener(
      "eleeveon:local-appearance-applied",
      publishAppearance,
    );

    window.addEventListener(
      "eleeveon:appearance-design-bridge",
      publishAppearance,
    );

    window.addEventListener(
      "eleeveon:theme-refresh",
      publishAppearance,
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "eleeveon:local-appearance-applied",
        publishAppearance,
      );

      window.removeEventListener(
        "eleeveon:appearance-design-bridge",
        publishAppearance,
      );

      window.removeEventListener(
        "eleeveon:theme-refresh",
        publishAppearance,
      );
    };
  }, [appearance]);

  useEffect(() => {
    if (
      redirectedRef.current
    ) {
      return;
    }

    if (pathname !== "/") return;

    if (
      !account.authenticated ||
      !account.accountId
    ) {
      return;
    }

    if (
      account.restoring ||
      account.verifying
    ) {
      return;
    }

    if (!membership.restored) {
      return;
    }

    const role = String(
      membership.activeMembership
        ?.role ||
        membership.activeRole ||
        storedWorkspaceRole() ||
        "",
    ).trim();

    if (!role) return;

    redirectedRef.current = true;

    router.replace(
      getPortalPathByRole(role),
    );
  }, [
    account.accountId,
    account.authenticated,
    account.restoring,
    account.verifying,
    membership.activeMembership
      ?.role,
    membership.activeRole,
    membership.restored,
    pathname,
    router,
  ]);


  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const handleUpdateReady = () => {
      document.documentElement
        .setAttribute(
          "data-pwa-update-ready",
          "true",
        );
    };

    const handleReloading = () => {
      document.documentElement
        .setAttribute(
          "data-app-reloading",
          "true",
        );
    };

    window.addEventListener(
      "eleeveon:pwa-update-ready",
      handleUpdateReady,
    );
    window.addEventListener(
      "eleeveon:app-reloading",
      handleReloading,
    );

    return () => {
      window.removeEventListener(
        "eleeveon:pwa-update-ready",
        handleUpdateReady,
      );
      window.removeEventListener(
        "eleeveon:app-reloading",
        handleReloading,
      );
    };
  }, []);

  return null;
}
