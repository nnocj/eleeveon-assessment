"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export interface ToggleProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  pressed: boolean;
  icon?: ReactNode;
  label: ReactNode;
}

export default function Toggle({
  pressed,
  icon,
  label,
  className,
  ...props
}: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={[
        "eds-toggle",
        pressed &&
          "eds-toggle-active",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <strong>{label}</strong>
    </button>
  );
}
