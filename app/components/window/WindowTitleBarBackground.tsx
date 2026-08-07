"use client";

import type {
  HTMLAttributes,
} from "react";

export interface WindowTitleBarBackgroundProps
  extends HTMLAttributes<HTMLDivElement> {
  decorative?: boolean;
}

export default function WindowTitleBarBackground({
  decorative = true,
  className,
  ...props
}: WindowTitleBarBackgroundProps) {
  return (
    <div
      className={[
        "window-titlebar-background",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={
        decorative
          ? true
          : undefined
      }
      {...props}
    />
  );
}
