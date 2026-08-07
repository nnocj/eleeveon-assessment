"use client";

import type {
  HTMLAttributes,
} from "react";

export default function WindowDivider(
  props: HTMLAttributes<HTMLDivElement>,
) {
  return (
    <div
      aria-hidden="true"
      className="window-titlebar-divider"
      {...props}
    />
  );
}
