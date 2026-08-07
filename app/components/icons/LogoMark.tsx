"use client";

import type {
  CSSProperties,
  HTMLAttributes,
} from "react";

export interface LogoMarkProps
  extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
  variant?:
    | "gradient"
    | "solid"
    | "outline";
  label?: string;
}

export default function LogoMark({
  size = 32,
  variant = "gradient",
  label = "Eleeveon",
  className,
  style,
  ...props
}: LogoMarkProps) {
  const variantStyle:
    Record<
      typeof variant,
      CSSProperties
    > = {
    gradient: {
      background:
        "var(--eds-gradient-brand)",
      color: "#ffffff",
      border:
        "1px solid transparent",
    },
    solid: {
      background:
        "var(--eds-primary)",
      color:
        "var(--eds-primary-text)",
      border:
        "1px solid transparent",
    },
    outline: {
      background:
        "var(--eds-primary-softer)",
      color:
        "var(--eds-primary)",
      border:
        "1px solid color-mix(in srgb, var(--eds-primary) 28%, var(--eds-border))",
    },
  };

  return (
    <span
      role="img"
      aria-label={label}
      className={[
        "eds-logo-mark",
        `eds-logo-mark-${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: size,
        height: size,
        display: "inline-grid",
        placeItems: "center",
        borderRadius:
          Math.max(
            8,
            Math.round(
              size * 0.3,
            ),
          ),
        fontFamily:
          "var(--eds-font-display)",
        fontSize:
          Math.round(size * 0.48),
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: "-0.08em",
        boxShadow:
          variant === "outline"
            ? undefined
            : "0 8px 18px color-mix(in srgb, var(--eds-primary) 22%, transparent)",
        ...variantStyle[variant],
        ...style,
      }}
      {...props}
    >
      E
    </span>
  );
}
