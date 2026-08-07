"use client";

import type {
  HTMLAttributes,
} from "react";

export interface WindowBrandGlowProps
  extends HTMLAttributes<HTMLDivElement> {
  opacity?: number;
}

export default function WindowBrandGlow({
  opacity = 0.18,
  style,
  ...props
}: WindowBrandGlowProps) {
  return (
    <div
      aria-hidden="true"
      className="window-titlebar-brand-glow"
      style={{
        opacity,
        ...style,
      }}
      {...props}
    />
  );
}
