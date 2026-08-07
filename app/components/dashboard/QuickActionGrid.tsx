"use client";

import type { ReactNode } from "react";

export interface QuickAction {
  key: string;
  label: string;
  icon: ReactNode;
  onClick(): void;
}

export interface QuickActionGridProps {
  actions: QuickAction[];
}

export default function QuickActionGrid({
  actions,
}: QuickActionGridProps) {
  return (
    <section
      className="eds-quick-action-grid"
      aria-label="Quick actions"
    >
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          className="eds-quick-action"
          onClick={action.onClick}
        >
          <span className="eds-quick-action-icon">
            {action.icon}
          </span>
          <strong>{action.label}</strong>
        </button>
      ))}
    </section>
  );
}
