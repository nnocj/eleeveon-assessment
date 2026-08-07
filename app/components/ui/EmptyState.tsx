"use client";

import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export interface EmptyStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={[
        "eds-empty-state",
        compact && "eds-empty-state-compact",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon ? (
        <div className="eds-empty-icon">
          {icon}
        </div>
      ) : null}

      <h3>{title}</h3>

      {description ? (
        <p>{description}</p>
      ) : null}

      {action ? (
        <div className="eds-empty-action">
          {action}
        </div>
      ) : null}
    </div>
  );
}