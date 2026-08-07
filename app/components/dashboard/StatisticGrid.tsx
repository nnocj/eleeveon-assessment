"use client";

import type { ReactNode } from "react";

export interface StatisticGridProps {
  children: ReactNode;
  className?: string;
}

export default function StatisticGrid({
  children,
  className,
}: StatisticGridProps) {
  return (
    <section
      className={[
        "eds-stat-grid",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </section>
  );
}
