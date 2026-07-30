"use client";

import type {
  CSSProperties,
  ReactNode,
} from "react";

export interface MapContainerProps {
  children: ReactNode;
  toolbar?: ReactNode;
  floatingControls?: ReactNode;
  footer?: ReactNode;
  height?: number | string;
  minHeight?: number | string;
  rounded?: boolean;
  bordered?: boolean;
  className?: string;
  style?: CSSProperties;
  canvasStyle?: CSSProperties;
}

export function MapContainer({
  children,
  toolbar,
  floatingControls,
  footer,
  height = 520,
  minHeight = 320,
  rounded = true,
  bordered = true,
  className,
  style,
  canvasStyle,
}: MapContainerProps) {
  return (
    <section
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height,
        minHeight,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: rounded ? 16 : 0,
        border: bordered
          ? "1px solid var(--border, rgba(15,23,42,.12))"
          : undefined,
        background: "var(--background, #fff)",
        ...style,
      }}
    >
      {toolbar ? (
        <div
          style={{
            position: "relative",
            zIndex: 20,
            flex: "0 0 auto",
            padding: 8,
            borderBottom:
              "1px solid var(--border, rgba(15,23,42,.08))",
            background: "var(--background, #fff)",
          }}
        >
          {toolbar}
        </div>
      ) : null}

      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          ...canvasStyle,
        }}
      >
        {children}

        {floatingControls ? (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            <div style={{ pointerEvents: "auto" }}>
              {floatingControls}
            </div>
          </div>
        ) : null}
      </div>

      {footer ? (
        <div
          style={{
            position: "relative",
            zIndex: 20,
            flex: "0 0 auto",
            padding: 8,
            borderTop:
              "1px solid var(--border, rgba(15,23,42,.08))",
            background: "var(--background, #fff)",
          }}
        >
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export default MapContainer;
