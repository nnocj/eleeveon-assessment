"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
}

export default function Badge({
  tone = "neutral",
  children,
  dot = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "eds-badge",
        `eds-badge-${tone}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {dot ? (
        <span
          className="eds-badge-dot"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}
