"use client";

import React from "react";

import type {
  WebsiteSectionKey,
  WebsiteTemplateSettings,
} from "../../types";

import {
  getWebsiteSectionLabel,
  resolveWebsiteSectionOrder,
} from "../../sections/sectionRegistry";

export type WebsiteSectionOrderProps = {
  settings: WebsiteTemplateSettings;
  disabled?: boolean;
  onChange: (
    order: WebsiteSectionKey[],
  ) => void;
};

export default function WebsiteSectionOrder({
  settings,
  disabled = false,
  onChange,
}: WebsiteSectionOrderProps) {
  const order =
    resolveWebsiteSectionOrder(settings);

  const move = (
    index: number,
    direction: -1 | 1,
  ) => {
    const target = index + direction;

    if (
      target < 0 ||
      target >= order.length
    ) {
      return;
    }

    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <div className="website-section-order">
      {order.map((key, index) => (
        <article
          key={key}
          className="website-section-order-item"
        >
          <span className="website-section-order-index">
            {index + 1}
          </span>

          <div>
            <strong>
              {getWebsiteSectionLabel(
                key,
                settings,
              )}
            </strong>
            <small>{key}</small>
          </div>

          <div className="website-section-order-actions">
            <button
              type="button"
              disabled={disabled || index === 0}
              onClick={() => move(index, -1)}
              aria-label="Move section up"
            >
              ↑
            </button>

            <button
              type="button"
              disabled={
                disabled ||
                index === order.length - 1
              }
              onClick={() => move(index, 1)}
              aria-label="Move section down"
            >
              ↓
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
