"use client";

import type { ReactNode } from "react";

export interface ActivityFeedItem {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  onClick?(): void;
}

export interface ActivityFeedProps {
  items: ActivityFeedItem[];
  emptyText?: string;
}

export default function ActivityFeed({
  items,
  emptyText = "Activity will appear here.",
}: ActivityFeedProps) {
  if (!items.length) {
    return (
      <div className="eds-dashboard-empty">
        <span>✨</span>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="eds-activity-list">
      {items.map((item) => {
        const content = (
          <>
            <span className="eds-activity-icon">
              {item.icon ?? "•"}
            </span>
            <span className="eds-activity-copy">
              <strong>{item.title}</strong>
              {item.meta ? (
                <small>{item.meta}</small>
              ) : null}
            </span>
          </>
        );

        return item.onClick ? (
          <button
            key={item.id}
            type="button"
            className="eds-activity-item"
            onClick={item.onClick}
          >
            {content}
          </button>
        ) : (
          <article
            key={item.id}
            className="eds-activity-item"
          >
            {content}
          </article>
        );
      })}
    </div>
  );
}
