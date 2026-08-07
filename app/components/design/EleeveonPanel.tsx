"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import EleeveonSurface, {
  type EleeveonSurfaceElevation,
  type EleeveonSurfaceTone,
} from "./EleeveonSurface";

export interface EleeveonPanelProps
  extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  tone?: EleeveonSurfaceTone;
  elevation?: EleeveonSurfaceElevation;
  inset?: boolean;
}

export default function EleeveonPanel({
  children,
  header,
  footer,
  tone = "default",
  elevation = 3,
  inset = false,
  className,
  ...props
}: EleeveonPanelProps) {
  return (
    <EleeveonSurface
      as="section"
      tone={tone}
      elevation={elevation}
      radius="panel"
      padding={true}
      className={[
        "eds-panel",
        inset && "eds-panel-inset",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {header ? (
        <header
          style={{
            marginBottom:
              "var(--eds-space-4)",
          }}
        >
          {header}
        </header>
      ) : null}

      {children}

      {footer ? (
        <footer
          style={{
            marginTop:
              "var(--eds-space-4)",
            paddingTop:
              "var(--eds-space-3)",
            borderTop:
              "1px solid var(--eds-divider)",
          }}
        >
          {footer}
        </footer>
      ) : null}
    </EleeveonSurface>
  );
}
