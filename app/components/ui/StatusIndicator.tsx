"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export interface StatusIndicatorProps
  extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  label?: ReactNode;
  pulse?: boolean;
}

export default function StatusIndicator({
  tone = "neutral",
  label,
  pulse = false,
  className,
  ...props
}: StatusIndicatorProps) {
  return (
    <span
      className={[
        "eds-status-indicator",
        `eds-status-${tone}`,
        pulse &&
          "eds-status-pulse",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span
        className="eds-status-dot"
        aria-hidden="true"
      />
      {label ? (
        <span>{label}</span>
      ) : null}
    </span>
  );
}
