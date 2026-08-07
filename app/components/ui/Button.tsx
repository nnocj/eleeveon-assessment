"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success";

export type ButtonSize =
  | "sm"
  | "md"
  | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    disabled,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={[
        "eds-button",
        `eds-button-${variant}`,
        `eds-button-${size}`,
        fullWidth &&
          "eds-button-full",
        loading &&
          "eds-button-loading",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={
        disabled || loading
      }
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span
          className="eds-button-spinner"
          aria-hidden="true"
        />
      ) : leadingIcon ? (
        <span className="eds-button-icon">
          {leadingIcon}
        </span>
      ) : null}

      <span className="eds-button-label">
        {children}
      </span>

      {!loading &&
      trailingIcon ? (
        <span className="eds-button-icon">
          {trailingIcon}
        </span>
      ) : null}
    </button>
  );
});

export default Button;
