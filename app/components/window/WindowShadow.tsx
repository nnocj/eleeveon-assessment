"use client";

import type {
  HTMLAttributes,
} from "react";

export default function WindowShadow(
  props: HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div
      aria-hidden="true"
      className="window-titlebar-shadow"
      {...props}
    />
  );
}
