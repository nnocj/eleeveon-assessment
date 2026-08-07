"use client";

import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";

export type BrandGradientVariant =
  | "brand"
  | "soft"
  | "hero"
  | "window"
  | "sidebar"
  | "success"
  | "warning"
  | "danger";

export interface BrandGradientProps
  extends HTMLAttributes<HTMLDivElement> {
  variant?: BrandGradientVariant;
  children?: ReactNode;
  inset?: boolean;
  rounded?: boolean;
}

const GRADIENT_VARIABLES:
  Record<BrandGradientVariant, string> = {
  brand: "var(--eds-gradient-brand)",
  soft: "var(--eds-gradient-brand-soft)",
  hero: "var(--eds-gradient-hero, var(--eds-gradient-brand-soft))",
  window: "var(--eds-gradient-window)",
  sidebar: "var(--eds-gradient-sidebar)",
  success: "var(--eds-gradient-success)",
  warning: "var(--eds-gradient-warning)",
  danger: "var(--eds-gradient-danger)",
};

function join(
  ...values: Array<
    string | false | null | undefined
  >
) {
  return values.filter(Boolean).join(" ");
}

export default function BrandGradient({
  variant = "brand",
  children,
  inset = false,
  rounded = true,
  className,
  style,
  ...props
}: BrandGradientProps) {
  const mergedStyle = {
    background:
      GRADIENT_VARIABLES[variant],
    borderRadius: rounded
      ? "var(--eds-radius-panel)"
      : undefined,
    padding: inset
      ? "var(--eds-card-padding)"
      : undefined,
    ...style,
  } satisfies CSSProperties;

  return (
    <div
      className={join(
        "eds-brand-gradient",
        className,
      )}
      style={mergedStyle}
      {...props}
    >
      {children}
    </div>
  );
}
