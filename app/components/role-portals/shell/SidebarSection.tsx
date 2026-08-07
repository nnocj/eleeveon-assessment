"use client";

import type { ReactNode } from "react";

export interface SidebarSectionProps {
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function SidebarSection({
  title,
  meta,
  children,
  className,
}: SidebarSectionProps) {
  return (
    <section
      className={[
        "shell-control-section",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {title || meta ? (
        <header className="shell-control-section-head">
          {title ? <span>{title}</span> : <span />}
          {meta ? <small>{meta}</small> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
