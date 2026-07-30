"use client";

import type { CSSProperties, ReactNode } from "react";

export interface PageToolbarProps {
  search?: ReactNode;
  primaryAction?: ReactNode;
  filterAction?: ReactNode;
  moreAction?: ReactNode;
  viewToggle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  sticky?: boolean;
  compact?: boolean;
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

export function PageToolbar({
  search,
  primaryAction,
  filterAction,
  moreAction,
  viewToggle,
  leading,
  trailing,
  children,
  sticky = false,
  compact = true,
  wrap = true,
  className,
  style,
  ariaLabel = "Page actions",
}: PageToolbarProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={className}
      style={{
        position: sticky ? "sticky" : "relative",
        top: sticky ? 0 : undefined,
        zIndex: sticky ? 20 : undefined,
        display: "flex",
        alignItems: "center",
        gap: compact ? 8 : 12,
        flexWrap: wrap ? "wrap" : "nowrap",
        width: "100%",
        padding: compact ? "8px 0" : "12px 0",
        background: sticky ? "var(--background, #fff)" : undefined,
        ...style,
      }}
    >
      {leading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
          }}
        >
          {leading}
        </div>
      ) : null}

      {search ? (
        <div
          style={{
            flex: "1 1 220px",
            minWidth: 0,
          }}
        >
          {search}
        </div>
      ) : (
        <span style={{ flex: "1 1 auto" }} />
      )}

      {children ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
          }}
        >
          {children}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginLeft: search ? 0 : "auto",
        }}
      >
        {viewToggle}
        {filterAction}
        {primaryAction}
        {moreAction}
        {trailing}
      </div>
    </section>
  );
}

export default PageToolbar;
