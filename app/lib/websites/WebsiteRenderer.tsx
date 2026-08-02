"use client";

/**
 * app/lib/websites/WebsiteRenderer.tsx
 * --------------------------------------------------------------------------
 * Shared entry point used by previews, public pages and future builders.
 */

import React from "react";

import type {
  WebsiteDataset,
  WebsiteTemplateSettings,
} from "./types";

import WebsiteTemplateRouter from "./WebsiteTemplateRouter";

export type WebsiteRendererProps = {
  dataset: WebsiteDataset;
  settings: WebsiteTemplateSettings;
  compact?: boolean;
  previewMode?: boolean;
  className?: string;
};

export default function WebsiteRenderer({
  dataset,
  settings,
  compact = false,
  previewMode = false,
  className,
}: WebsiteRendererProps) {
  return (
    <div
      className={[
        "eleeveon-website-renderer",
        compact ? "is-compact" : "",
        previewMode ? "is-preview" : "",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <WebsiteTemplateRouter
        dataset={dataset}
        settings={settings}
        compact={compact}
        previewMode={previewMode}
      />
    </div>
  );
}
