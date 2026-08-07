"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export interface FloatingButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  extended?: boolean;
  placement?:
    | "bottom-right"
    | "bottom-left"
    | "inline";
}

export default function FloatingButton({
  icon,
  label,
  extended = false,
  placement = "bottom-right",
  className,
  ...props
}: FloatingButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[
        "eds-floating-button",
        `eds-floating-button-${placement}`,
        extended &&
          "eds-floating-button-extended",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span aria-hidden="true">
        {icon}
      </span>

      {extended ? (
        <span>{label}</span>
      ) : null}
    </button>
  );
}
