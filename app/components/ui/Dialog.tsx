"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

export interface DialogProps {
  open: boolean;
  onClose(): void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  closeOnBackdrop?: boolean;
}

export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "34rem",
  closeOnBackdrop = true,
}: DialogProps) {
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
    <div className="eds-dialog-layer">
      <button
        type="button"
        className="eds-dialog-backdrop"
        aria-label="Close dialog"
        onClick={() => {
          if (closeOnBackdrop) {
            onClose();
          }
        }}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={
          description
            ? descriptionId
            : undefined
        }
        className="eds-dialog"
        style={{ maxWidth }}
      >
        <header>
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
            className="eds-dialog-close"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        {children ? (
          <div className="eds-dialog-content">
            {children}
          </div>
        ) : null}

        {footer ? (
          <footer>
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
