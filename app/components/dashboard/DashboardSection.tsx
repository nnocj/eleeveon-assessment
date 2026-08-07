"use client";

import type { ReactNode } from "react";

export interface DashboardSectionProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function DashboardSection({
  eyebrow,
  title,
  action,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section
      className={[
        "eds-dashboard-section",
        className,
      ].filter(Boolean).join(" ")}
    >
      <header className="eds-dashboard-section-header">
        <div>
          {eyebrow ? <span>{eyebrow}</span> : null}
          <h2>{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
