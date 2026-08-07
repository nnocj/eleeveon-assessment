/**
 * app/lib/design/motion.ts
 * --------------------------------------------------------------------------
 * Motion timings and easing curves.
 */

export const ELEEVEON_DURATIONS = {
  instant: "80ms",
  fast: "140ms",
  standard: "220ms",
  slow: "320ms",
  deliberate: "480ms",
} as const;

export const ELEEVEON_EASINGS = {
  standard:
    "cubic-bezier(.2, .8, .2, 1)",
  enter:
    "cubic-bezier(.16, 1, .3, 1)",
  exit:
    "cubic-bezier(.4, 0, 1, 1)",
  emphasized:
    "cubic-bezier(.2, .9, .1, 1)",
  spring:
    "cubic-bezier(.16, 1.2, .3, 1)",
} as const;

export const ELEEVEON_TRANSITIONS = {
  color:
    `color ${ELEEVEON_DURATIONS.fast} ${ELEEVEON_EASINGS.standard}, background-color ${ELEEVEON_DURATIONS.fast} ${ELEEVEON_EASINGS.standard}, border-color ${ELEEVEON_DURATIONS.fast} ${ELEEVEON_EASINGS.standard}`,
  surface:
    `background ${ELEEVEON_DURATIONS.standard} ${ELEEVEON_EASINGS.standard}, box-shadow ${ELEEVEON_DURATIONS.standard} ${ELEEVEON_EASINGS.standard}, transform ${ELEEVEON_DURATIONS.standard} ${ELEEVEON_EASINGS.enter}`,
  transform:
    `transform ${ELEEVEON_DURATIONS.standard} ${ELEEVEON_EASINGS.enter}`,
  opacity:
    `opacity ${ELEEVEON_DURATIONS.fast} ${ELEEVEON_EASINGS.standard}`,
} as const;

export function motionCssVariables(
  reduceMotion = false,
): Record<string, string> {
  if (reduceMotion) {
    return {
      "--eds-duration-fast": "0ms",
      "--eds-duration-standard":
        "0ms",
      "--eds-duration-slow": "0ms",
      "--eds-ease-standard":
        "linear",
      "--eds-ease-enter": "linear",
      "--eds-transition-color":
        "none",
      "--eds-transition-surface":
        "none",
      "--eds-transition-transform":
        "none",
    };
  }

  return {
    "--eds-duration-fast":
      ELEEVEON_DURATIONS.fast,
    "--eds-duration-standard":
      ELEEVEON_DURATIONS.standard,
    "--eds-duration-slow":
      ELEEVEON_DURATIONS.slow,
    "--eds-ease-standard":
      ELEEVEON_EASINGS.standard,
    "--eds-ease-enter":
      ELEEVEON_EASINGS.enter,
    "--eds-transition-color":
      ELEEVEON_TRANSITIONS.color,
    "--eds-transition-surface":
      ELEEVEON_TRANSITIONS.surface,
    "--eds-transition-transform":
      ELEEVEON_TRANSITIONS.transform,
  };
}
