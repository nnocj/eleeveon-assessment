"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export interface SearchBarProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
  > {
  icon?: ReactNode;
  clearable?: boolean;
  onClear?(): void;
  trailing?: ReactNode;
}

const SearchBar = forwardRef<
  HTMLInputElement,
  SearchBarProps
>(function SearchBar(
  {
    icon = "⌕",
    clearable = true,
    onClear,
    trailing,
    value,
    className,
    ...props
  },
  ref,
) {
  const hasValue =
    String(value ?? "").length > 0;

  return (
    <label
      className={[
        "eds-search-bar",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className="eds-search-icon"
        aria-hidden="true"
      >
        {icon}
      </span>

      <input
        ref={ref}
        type="search"
        value={value}
        {...props}
      />

      {clearable &&
      hasValue ? (
        <button
          type="button"
          className="eds-search-clear"
          aria-label="Clear search"
          onClick={onClear}
        >
          ×
        </button>
      ) : null}

      {trailing ? (
        <span className="eds-search-trailing">
          {trailing}
        </span>
      ) : null}
    </label>
  );
});

export default SearchBar;
