"use client";

import type { ReactNode } from "react";

export interface DashboardWidgetProps {
  children: ReactNode;
  className?: string;
}

export function DashboardWidget({
  children,
  className,
}: DashboardWidgetProps) {
  return (
    <article
      className={[
        "eds-dashboard-widget",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </article>
  );
}

export interface DashboardWidgetsProps {
  children: ReactNode;
  className?: string;
}

export default function DashboardWidgets({
  children,
  className,
}: DashboardWidgetsProps) {
  return (
    <section
      className={[
        "eds-dashboard-widget-grid",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </section>
  );
}
