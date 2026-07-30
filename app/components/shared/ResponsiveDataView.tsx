"use client";

import type { CSSProperties, ReactNode } from "react";

export type DataViewMode = "cards" | "table" | "analytics" | "map";

export interface ResponsiveDataViewProps {
  mode: DataViewMode;
  cards?: ReactNode;
  table?: ReactNode;
  analytics?: ReactNode;
  map?: ReactNode;
  loading?: boolean;
  loadingView?: ReactNode;
  empty?: boolean;
  emptyView?: ReactNode;
  error?: ReactNode;
  className?: string;
  style?: CSSProperties;
  keepMounted?: boolean;
}

const hiddenStyle: CSSProperties = {
  display: "none",
};

export function ResponsiveDataView({
  mode,
  cards,
  table,
  analytics,
  map,
  loading = false,
  loadingView,
  empty = false,
  emptyView,
  error,
  className,
  style,
  keepMounted = false,
}: ResponsiveDataViewProps) {
  if (error) {
    return (
      <section className={className} style={style}>
        {error}
      </section>
    );
  }

  if (loading) {
    return (
      <section className={className} style={style} aria-busy="true">
        {loadingView ?? (
          <div
            role="status"
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--muted-foreground, #64748b)",
            }}
          >
            Loading…
          </div>
        )}
      </section>
    );
  }

  if (empty) {
    return (
      <section className={className} style={style}>
        {emptyView ?? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--muted-foreground, #64748b)",
            }}
          >
            No records found.
          </div>
        )}
      </section>
    );
  }

  const views: Record<DataViewMode, ReactNode | undefined> = {
    cards,
    table,
    analytics,
    map,
  };

  if (!keepMounted) {
    return (
      <section
        className={className}
        style={{ minWidth: 0, width: "100%", ...style }}
        data-view-mode={mode}
      >
        {views[mode] ?? null}
      </section>
    );
  }

  return (
    <section
      className={className}
      style={{ minWidth: 0, width: "100%", ...style }}
      data-view-mode={mode}
    >
      {(Object.keys(views) as DataViewMode[]).map((viewMode) => (
        <div
          key={viewMode}
          hidden={viewMode !== mode}
          aria-hidden={viewMode !== mode}
          style={viewMode === mode ? undefined : hiddenStyle}
        >
          {views[viewMode] ?? null}
        </div>
      ))}
    </section>
  );
}

export default ResponsiveDataView;
