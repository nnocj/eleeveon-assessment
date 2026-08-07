"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export interface ChipProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  selected?: boolean;
  removable?: boolean;
  onRemove?(): void;
}

export default function Chip({
  children,
  icon,
  selected = false,
  removable = false,
  onRemove,
  className,
  onClick,
  ...props
}: ChipProps) {
  return (
    <span
      className={[
        "eds-chip",
        selected &&
          "eds-chip-selected",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="eds-chip-main"
        aria-pressed={selected}
        onClick={onClick}
        {...props}
      >
        {icon ? (
          <span aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span>{children}</span>
      </button>

      {removable ? (
        <button
          type="button"
          className="eds-chip-remove"
          aria-label="Remove"
          onClick={onRemove}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
