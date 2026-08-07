"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";


export interface EleeveonSectionProps
  extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  divided?: boolean;
  compact?: boolean;
}

export default function EleeveonSection({
  title,
  description,
  actions,
  children,
  divided = false,
  compact = false,
  className,
  ...props
}: EleeveonSectionProps) {
  return (
    <section
      className={[
        "eds-stack",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        "--eds-stack-gap": compact
          ? "var(--eds-space-2)"
          : "var(--eds-section-gap)",
        paddingTop: divided
          ? "var(--eds-space-4)"
          : undefined,
        borderTop: divided
          ? "1px solid var(--eds-divider)"
          : undefined,
      } as React.CSSProperties}
      {...props}
    >
      {title ||
      description ||
      actions ? (
        <header className="eds-cluster">
          <div className="eds-grow">
            {title ? (
              <div className="eds-type-section-title">
                {title}
              </div>
            ) : null}

            {description ? (
              <div
                className="eds-type-caption"
                style={{
                  marginTop: "0.25rem",
                }}
              >
                {description}
              </div>
            ) : null}
          </div>

          {actions ? (
            <div className="eds-shrink-0">
              {actions}
            </div>
          ) : null}
        </header>
      ) : null}

      {children}
    </section>
  );
}
