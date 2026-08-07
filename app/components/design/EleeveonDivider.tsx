"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export interface EleeveonDividerProps
  extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  inset?: string;
  decorative?: boolean;
}

export default function EleeveonDivider({
  label,
  inset = "0",
  decorative = true,
  style,
  ...props
}: EleeveonDividerProps) {
  if (!label) {
    return (
      <div
        role={
          decorative
            ? "presentation"
            : "separator"
        }
        className="eds-divider"
        style={{
          marginInline: inset,
          width:
            inset === "0"
              ? "100%"
              : `calc(100% - (${inset} * 2))`,
          ...style,
        }}
        {...props}
      />
    );
  }

  return (
    <div
      role={
        decorative
          ? "presentation"
          : "separator"
      }
      className="eds-row"
      style={{
        marginInline: inset,
        color:
          "var(--eds-text-muted)",
        ...style,
      }}
      {...props}
    >
      <span
        className="eds-divider"
        style={{ flex: 1 }}
      />
      <span className="eds-type-overline">
        {label}
      </span>
      <span
        className="eds-divider"
        style={{ flex: 1 }}
      />
    </div>
  );
}
