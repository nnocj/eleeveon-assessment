"use client";

import type {
  CSSProperties,
  HTMLAttributes,
} from "react";

export interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement> {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: CSSProperties["borderRadius"];
  circle?: boolean;
}

export default function Skeleton({
  width = "100%",
  height = "1rem",
  radius =
    "var(--eds-radius-sm)",
  circle = false,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className="eds-skeleton"
      style={{
        width,
        height,
        borderRadius: circle
          ? "50%"
          : radius,
        ...style,
      }}
      {...props}
    />
  );
}
