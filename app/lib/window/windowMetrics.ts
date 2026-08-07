/**
 * app/lib/window/windowMetrics.ts
 * --------------------------------------------------------------------------
 * Window Controls Overlay geometry helpers.
 */

export interface WindowTitlebarMetrics {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rightInset: number;
}

export const DEFAULT_WINDOW_TITLEBAR_METRICS:
  WindowTitlebarMetrics = {
  visible: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  rightInset: 0,
};

export interface WindowControlsOverlayLike {
  visible: boolean;
  getTitlebarAreaRect(): DOMRect;
  addEventListener(
    type: "geometrychange",
    listener: EventListener,
  ): void;
  removeEventListener(
    type: "geometrychange",
    listener: EventListener,
  ): void;
}

export function getWindowControlsOverlay():
  | WindowControlsOverlayLike
  | null {
  if (
    typeof navigator === "undefined"
  ) {
    return null;
  }

  return (
    navigator as Navigator & {
      windowControlsOverlay?:
        WindowControlsOverlayLike;
    }
  ).windowControlsOverlay ?? null;
}

export function readWindowTitlebarMetrics(
  overlay:
    | WindowControlsOverlayLike
    | null = getWindowControlsOverlay(),
): WindowTitlebarMetrics {
  if (!overlay?.visible) {
    return {
      ...DEFAULT_WINDOW_TITLEBAR_METRICS,
    };
  }

  const rect =
    overlay.getTitlebarAreaRect();

  const viewportWidth =
    typeof window !== "undefined"
      ? window.innerWidth
      : rect.x + rect.width;

  return {
    visible: true,
    x: Math.max(0, rect.x),
    y: Math.max(0, rect.y),
    width: Math.max(0, rect.width),
    height: Math.max(0, rect.height),
    rightInset: Math.max(
      0,
      viewportWidth -
        (rect.x + rect.width),
    ),
  };
}

export function publishWindowMetrics(
  target: HTMLElement,
  metrics: WindowTitlebarMetrics,
): void {
  target.toggleAttribute(
    "data-window-controls-overlay",
    metrics.visible,
  );

  target.style.setProperty(
    "--window-titlebar-x",
    `${metrics.x}px`,
  );
  target.style.setProperty(
    "--window-titlebar-y",
    `${metrics.y}px`,
  );
  target.style.setProperty(
    "--window-titlebar-width",
    `${metrics.width}px`,
  );
  target.style.setProperty(
    "--window-titlebar-height",
    `${metrics.height}px`,
  );
  target.style.setProperty(
    "--window-controls-right-inset",
    `${metrics.rightInset}px`,
  );
}
