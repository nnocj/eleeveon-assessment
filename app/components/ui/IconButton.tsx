"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

export type IconButtonVariant =
  | "default"
  | "primary"
  | "ghost"
  | "danger";

export type IconButtonSize =
  | "sm"
  | "md"
  | "lg";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  pressed?: boolean;
}

const IconButton = forwardRef<
  HTMLButtonElement,
  IconButtonProps
>(function IconButton(
  {
    icon,
    label,
    variant = "default",
    size = "md",
    pressed,
    className,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={
        pressed === undefined
          ? undefined
          : pressed
      }
      title={label}
      className={[
        "eds-icon-button",
        `eds-icon-button-${variant}`,
        `eds-icon-button-${size}`,
        pressed &&
          "eds-icon-button-pressed",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {icon}
    </button>
  );
});

export default IconButton;
