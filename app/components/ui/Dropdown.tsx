"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  width?: string;
  disabled?: boolean;
  className?: string;
}

export default function Dropdown({
  trigger,
  children,
  align = "end",
  width = "15rem",
  disabled = false,
  className,
}: DropdownProps) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const ref =
    useRef<HTMLDivElement>(
      null,
    );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (
      event: PointerEvent,
    ) => {
      if (
        !ref.current?.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    };

    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      onPointerDown,
    );
    document.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        onPointerDown,
      );
      document.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className={[
        "eds-dropdown",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="eds-dropdown-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
      >
        {trigger}
      </button>

      {open ? (
        <div
          role="menu"
          className={`eds-dropdown-panel eds-dropdown-${align}`}
          style={{ width }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
