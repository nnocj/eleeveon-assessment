"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export interface EleeveonSectionHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
}
export default function EleeveonSectionHeader({
  eyebrow,
  title,
  description,
  actions,
  icon,
  compact = false,
  className,
  ...props
}: EleeveonSectionHeaderProps) {
  return (
    <div
      className={[
        "eds-cluster",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="eds-row eds-grow">
        {icon ? (
          <div
            className="eds-center eds-shrink-0"
            style={{
              width: compact
                ? "2rem"
                : "2.5rem",
              height: compact
                ? "2rem"
                : "2.5rem",
              borderRadius:
                "var(--eds-radius-control)",
              background:
                "var(--eds-primary-soft)",
              color:
                "var(--eds-primary)",
            }}
          >
            {icon}
          </div>
        ) : null}

        <div className="eds-grow">
          {eyebrow ? (
            <div className="eds-type-overline">
              {eyebrow}
            </div>
          ) : null}

          <div
            className={
              compact
                ? "eds-type-card-title"
                : "eds-type-section-title"
            }
            style={{
              marginTop: eyebrow
                ? "0.18rem"
                : undefined,
            }}
          >
            {title}
          </div>

          {description ? (
            <div
              className="eds-type-caption"
              style={{
                marginTop: "0.22rem",
              }}
            >
              {description}
            </div>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="eds-shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
