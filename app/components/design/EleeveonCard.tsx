"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import EleeveonSurface, {
  type EleeveonSurfaceElevation,
  type EleeveonSurfaceTone,
} from "./EleeveonSurface";

export interface EleeveonCardProps
  extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  children?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  footer?: ReactNode;
  tone?: EleeveonSurfaceTone;
  elevation?: EleeveonSurfaceElevation;
  interactive?: boolean;
  compact?: boolean;
}

export default function EleeveonCard({
  children,
  title,
  subtitle,
  leading,
  trailing,
  footer,
  tone = "default",
  elevation = 2,
  interactive = false,
  compact = false,
  className,
  ...props
}: EleeveonCardProps) {
  return (
    <EleeveonSurface
      as="article"
      tone={tone}
      elevation={elevation}
      radius="card"
      padding={
        compact
          ? "0.625rem"
          : true
      }
      interactive={interactive}
      className={[
        "eds-card",
        interactive &&
          "eds-card-interactive",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {title ||
      subtitle ||
      leading ||
      trailing ? (
        <header
          className="eds-row"
          style={{
            alignItems: "flex-start",
          }}
        >
          {leading ? (
            <div
              className="eds-shrink-0"
            >
              {leading}
            </div>
          ) : null}

          <div className="eds-grow">
            {title ? (
              <div className="eds-type-card-title">
                {title}
              </div>
            ) : null}

            {subtitle ? (
              <div
                className="eds-type-caption"
                style={{
                  marginTop: "0.2rem",
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          {trailing ? (
            <div
              className="eds-shrink-0"
            >
              {trailing}
            </div>
          ) : null}
        </header>
      ) : null}

      {children ? (
        <div
          style={{
            marginTop:
              title ||
              subtitle ||
              leading ||
              trailing
                ? "var(--eds-space-3)"
                : undefined,
          }}
        >
          {children}
        </div>
      ) : null}

      {footer ? (
        <footer
          style={{
            marginTop:
              "var(--eds-space-3)",
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
