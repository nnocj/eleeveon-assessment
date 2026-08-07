"use client";

import type {
  ReactNode,
} from "react";

export interface TabItem<
  TValue extends string,
> {
  value: TValue;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps<
  TValue extends string,
> {
  value: TValue;
  items:
    readonly TabItem<TValue>[];
  onChange(
    value: TValue,
  ): void;
  ariaLabel: string;
  variant?:
    | "underline"
    | "pill";
  fullWidth?: boolean;
}

export default function Tabs<
  TValue extends string,
>({
  value,
  items,
  onChange,
  ariaLabel,
  variant = "underline",
  fullWidth = false,
}: TabsProps<TValue>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={[
        "eds-tabs",
        `eds-tabs-${variant}`,
        fullWidth &&
          "eds-tabs-full",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => {
        const active =
          item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={
              item.disabled
            }
            className={
              active
                ? "active"
                : ""
            }
            onClick={() =>
              onChange(item.value)
            }
          >
            {item.icon ? (
              <span
                aria-hidden="true"
              >
                {item.icon}
              </span>
            ) : null}
            <strong>
              {item.label}
            </strong>
          </button>
        );
      })}
    </div>
  );
}
