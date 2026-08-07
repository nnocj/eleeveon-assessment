"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

export type SheetSide =
  | "right"
  | "left"
  | "bottom";

export interface SheetProps {
  open: boolean;
  onClose(): void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  side?: SheetSide;
  width?: string;
  footer?: ReactNode;
  closeLabel?: string;
}

export default function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  side = "right",
  width = "min(92vw, 430px)",
  footer,
  closeLabel = "Close",
}: SheetProps) {
  const titleId = useId();
  const descriptionId =
    useId();
  const closeRef =
    useRef<HTMLButtonElement>(
      null,
    );

  useEffect(() => {
    if (!open) return;

    const previous =
      document.activeElement as
        | HTMLElement
        | null;

    closeRef.current?.focus();

    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        onKeyDown,
      );
      previous?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="eds-sheet-layer"
      role="presentation"
    >
      <button
        type="button"
        className="eds-sheet-backdrop"
        aria-label="Close sheet"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={
          description
            ? descriptionId
            : undefined
        }
        className={`eds-sheet eds-sheet-${side}`}
        style={{
          width:
            side === "bottom"
              ? "100%"
              : width,
        }}
      >
        <header className="eds-sheet-header">
          <div className="eds-grow">
            <h2 id={titleId}>
              {title}
            </h2>

            {description ? (
              <p id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>

          <button
            ref={closeRef}
            type="button"
            className="eds-sheet-close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className="eds-sheet-content">
          {children}
        </div>

        {footer ? (
          <footer className="eds-sheet-footer">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
