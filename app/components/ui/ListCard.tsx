"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export interface ListCardProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "title"
  > {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  meta?: ReactNode;
  selected?: boolean;
}

export default function ListCard({
  title,
  subtitle,
  leading,
  trailing,
  meta,
  selected = false,
  className,
  type = "button",
  ...props
}: ListCardProps) {
  return (
    <button
      type={type}
      className={[
        "eds-list-card",
        selected && "eds-list-card-selected",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={selected}
      {...props}
    >
      {leading ? (
        <span className="eds-list-card-leading">
          {leading}
        </span>
      ) : null}

      <span className="eds-list-card-copy">
        <strong>{title}</strong>

        {subtitle ? (
          <small>{subtitle}</small>
        ) : null}

        {meta ? (
          <span className="eds-list-card-meta">
            {meta}
          </span>
        ) : null}
      </span>

      {trailing ? (
        <span className="eds-list-card-trailing">
          {trailing}
        </span>
      ) : null}
    </button>
  );
}