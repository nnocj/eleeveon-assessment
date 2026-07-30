"use client";

import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

export interface EntityDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  side?: "right" | "left" | "bottom";
  width?: number | string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  panelStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
}

export function EntityDetailsSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  description,
  icon,
  actions,
  footer,
  children,
  side = "right",
  width = 480,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
  panelStyle,
  bodyStyle,
}: EntityDetailsSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeOnEscape, onOpenChange, open]);

  if (!open) return null;

  const isBottom = side === "bottom";

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent:
          side === "left"
            ? "flex-start"
            : side === "right"
              ? "flex-end"
              : "stretch",
        alignItems: isBottom ? "flex-end" : "stretch",
        background: "rgba(2, 6, 23, 0.42)",
      }}
      onMouseDown={(event) => {
        if (
          closeOnBackdrop &&
          event.target === event.currentTarget
        ) {
          onOpenChange(false);
        }
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={className}
        style={{
          width: isBottom ? "100%" : width,
          maxWidth: isBottom ? "100%" : "min(92vw, 640px)",
          maxHeight: isBottom ? "88vh" : "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--background, #fff)",
          color: "var(--foreground, #0f172a)",
          borderTopLeftRadius: isBottom || side === "right" ? 18 : 0,
          borderTopRightRadius: isBottom || side === "left" ? 18 : 0,
          borderBottomLeftRadius: side === "right" ? 18 : 0,
          borderBottomRightRadius: side === "left" ? 18 : 0,
          boxShadow: "0 20px 60px rgba(2, 6, 23, 0.24)",
          outline: "none",
          overflow: "hidden",
          ...panelStyle,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "16px 18px",
            borderBottom: "1px solid var(--border, rgba(15, 23, 42, 0.10))",
          }}
        >
          {icon ? (
            <div style={{ display: "flex", marginTop: 2 }}>
              {icon}
            </div>
          ) : null}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id={titleId}
              style={{
                margin: 0,
                fontSize: 17,
                lineHeight: 1.25,
                fontWeight: 800,
              }}
            >
              {title}
            </h2>

            {subtitle ? (
              <div
                style={{
                  marginTop: 3,
                  fontSize: 13,
                  color: "var(--muted-foreground, #64748b)",
                }}
              >
                {subtitle}
              </div>
            ) : null}

            {description ? (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "var(--muted-foreground, #64748b)",
                }}
              >
                {description}
              </div>
            ) : null}
          </div>

          {actions ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {actions}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close details"
            title="Close"
            style={{
              width: 34,
              height: 34,
              border: 0,
              borderRadius: 9,
              background: "var(--muted, rgba(148, 163, 184, 0.14))",
              color: "inherit",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </header>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: 18,
            ...bodyStyle,
          }}
        >
          {children}
        </div>

        {footer ? (
          <footer
            style={{
              padding: "12px 18px",
              borderTop: "1px solid var(--border, rgba(15, 23, 42, 0.10))",
            }}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export default EntityDetailsSheet;
