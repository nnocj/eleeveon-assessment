"use client";

import {
  forwardRef,
  useId,
} from "react";

import {
  ICON_PATHS,
} from "./icon-paths";

import {
  useIconDefaults,
} from "./IconProvider";

import type {
  EleeveonIconName,
  EleeveonIconSize,
  EleeveonIconTone,
  IconProps,
} from "./icon-types";

const SIZE_MAP:
  Record<
    Exclude<
      EleeveonIconSize,
      number
    >,
    number
  > = {
  xs: 12,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
};

const TONE_COLOR:
  Record<
    EleeveonIconTone,
    string
  > = {
  current: "currentColor",
  primary: "var(--eds-primary)",
  muted: "var(--eds-text-muted)",
  success: "var(--eds-success)",
  warning: "var(--eds-warning)",
  danger: "var(--eds-danger)",
  info: "var(--eds-info)",
};

function resolveSize(
  size: EleeveonIconSize,
): number {
  return typeof size === "number"
    ? size
    : SIZE_MAP[size];
}

export function isEleeveonIconName(
  value: unknown,
): value is EleeveonIconName {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(
      ICON_PATHS,
      value,
    )
  );
}

const Icon = forwardRef<
  SVGSVGElement,
  IconProps
>(function Icon(
  {
    name,
    size,
    tone,
    label,
    decorative,
    strokeWidth,
    title,
    className,
    style,
    ...props
  },
  ref,
) {
  const defaults =
    useIconDefaults();

  const titleId = useId();

  const resolvedSize =
    resolveSize(
      size ?? defaults.size,
    );

  const resolvedTone =
    tone ?? defaults.tone;

  const resolvedDecorative =
    decorative ??
    (!label && !title);

  const definition =
    ICON_PATHS[name];

  /*
   * Defensive runtime guard.
   *
   * Navigation data may still contain an old emoji or arbitrary string.
   * Never dereference an undefined icon definition. Rendering a small
   * neutral placeholder keeps the shell usable while the caller falls
   * back to its supplied legacy icon.
   */
  if (!definition) {
    return (
      <svg
        ref={ref}
        viewBox="0 0 24 24"
        width={resolvedSize}
        height={resolvedSize}
        fill="none"
        stroke={
          TONE_COLOR[
            resolvedTone
          ]
        }
        strokeWidth={
          strokeWidth ??
          defaults.strokeWidth
        }
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={
          resolvedDecorative
            ? true
            : undefined
        }
        aria-label={
          resolvedDecorative
            ? undefined
            : label ??
              "Unknown icon"
        }
        role={
          resolvedDecorative
            ? undefined
            : "img"
        }
        className={[
          "eds-icon",
          "eds-icon-fallback",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          display:
            "inline-block",
          flex: "0 0 auto",
          verticalAlign:
            "middle",
          ...style,
        }}
        {...props}
      >
        <circle
          cx="12"
          cy="12"
          r="8"
        />
        <path d="M9.5 9.5a2.7 2.7 0 0 1 5.2.9c0 2-2.7 2.2-2.7 4" />
        <circle
          cx="12"
          cy="17.5"
          r=".5"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={resolvedSize}
      height={resolvedSize}
      fill="none"
      stroke={
        TONE_COLOR[
          resolvedTone
        ]
      }
      strokeWidth={
        strokeWidth ??
        defaults.strokeWidth
      }
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={
        resolvedDecorative
          ? true
          : undefined
      }
      aria-label={
        resolvedDecorative
          ? undefined
          : label
      }
      role={
        resolvedDecorative
          ? undefined
          : "img"
      }
      aria-labelledby={
        !resolvedDecorative &&
        title
          ? titleId
          : undefined
      }
      className={[
        "eds-icon",
        `eds-icon-${name}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        display: "inline-block",
        flex: "0 0 auto",
        verticalAlign:
          "middle",
        ...style,
      }}
      {...props}
    >
      {title ? (
        <title id={titleId}>
          {title}
        </title>
      ) : null}

      {definition.paths?.map(
        (path, index) => (
          <path
            key={`p-${index}`}
            d={path}
          />
        ),
      )}

      {definition.circles?.map(
        (circle, index) => (
          <circle
            key={`c-${index}`}
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
          />
        ),
      )}

      {definition.rects?.map(
        (rect, index) => (
          <rect
            key={`r-${index}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx={rect.rx}
          />
        ),
      )}

      {definition.polylines?.map(
        (points, index) => (
          <polyline
            key={`pl-${index}`}
            points={points}
          />
        ),
      )}

      {definition.lines?.map(
        (line, index) => (
          <line
            key={`l-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
          />
        ),
      )}
    </svg>
  );
});

export default Icon;
