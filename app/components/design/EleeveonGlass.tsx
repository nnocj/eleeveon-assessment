"use client";

import type {
  ElementType,
  HTMLAttributes,
  ReactNode,
} from "react";

export type EleeveonGlassStrength =
  | "subtle"
  | "medium"
  | "strong";

export interface EleeveonGlassProps
  extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children?: ReactNode;
  strength?: EleeveonGlassStrength;
  radius?:
    | "control"
    | "card"
    | "panel"
    | "pill";
  padding?: boolean | string;
}

const STRENGTH_CLASS:
  Record<EleeveonGlassStrength, string> = {
  subtle: "eds-glass-subtle",
  medium: "eds-glass",
  strong:
    "eds-glass eds-glass-strong",
};

export default function EleeveonGlass({
  as: Component = "div",
  children,
  strength = "medium",
  radius = "card",
  padding = false,
  className,
  style,
  ...props
}: EleeveonGlassProps) {
  return (
    <Component
      className={[
        STRENGTH_CLASS[strength],
        `eds-radius-${radius}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        padding:
          typeof padding === "string"
            ? padding
            : padding
              ? "var(--eds-card-padding)"
              : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
