"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export interface SwitchProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
  > {
  label: ReactNode;
  description?: ReactNode;
}

const Switch = forwardRef<
  HTMLInputElement,
  SwitchProps
>(function Switch(
  {
    label,
    description,
    id,
    className,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId =
    id || generatedId;

  return (
    <label
      htmlFor={inputId}
      className={[
        "eds-switch-row",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="eds-switch-copy">
        <strong>{label}</strong>
        {description ? (
          <small>
            {description}
          </small>
        ) : null}
      </span>

      <span className="eds-switch">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          {...props}
        />
        <span className="eds-switch-track">
          <span className="eds-switch-thumb" />
        </span>
      </span>
    </label>
  );
});

export default Switch;
