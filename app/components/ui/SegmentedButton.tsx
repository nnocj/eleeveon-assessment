"use client";

import type {
  ReactNode,
} from "react";

export interface SegmentedButtonOption<
  TValue extends string,
> {
  value: TValue;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedButtonProps<
  TValue extends string,
> {
  value: TValue;
  options:
    readonly SegmentedButtonOption<TValue>[];
  onChange(
    value: TValue,
  ): void;
  ariaLabel: string;
  fullWidth?: boolean;
  className?: string;
}

export default function SegmentedButton<
  TValue extends string,
>({
  value,
  options,
  onChange,
  ariaLabel,
  fullWidth = false,
  className,
}: SegmentedButtonProps<TValue>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[
        "eds-segmented",
        fullWidth &&
          "eds-segmented-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {options.map(
        (option) => {
          const active =
            option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={
                option.disabled
              }
              className={
                active
                  ? "active"
                  : ""
              }
              onClick={() =>
                onChange(
                  option.value,
                )
              }
            >
              {option.icon ? (
                <span
                  aria-hidden="true"
                >
                  {option.icon}
                </span>
              ) : null}

              <strong>
                {option.label}
              </strong>
            </button>
          );
        },
      )}
    </div>
  );
}
