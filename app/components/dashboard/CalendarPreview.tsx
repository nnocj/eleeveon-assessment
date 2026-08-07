"use client";

import type { ReactNode } from "react";

export interface CalendarPreviewItem {
  id: string;
  date: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  onClick?(): void;
}

export interface CalendarPreviewProps {
  items: CalendarPreviewItem[];
  emptyText?: string;
}

export default function CalendarPreview({
  items,
  emptyText = "No upcoming events yet.",
}: CalendarPreviewProps) {
  if (!items.length) {
    return (
      <div className="eds-dashboard-empty">
        <span>🗓️</span>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="eds-calendar-list">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="eds-calendar-item"
          onClick={item.onClick}
        >
          <time>{item.date}</time>
          <span className="eds-calendar-copy">
            <strong>{item.title}</strong>
            {item.description ? (
              <small>{item.description}</small>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}
