"use client";

/**
 * app/lib/websites/WebsiteTemplateRouter.tsx
 * --------------------------------------------------------------------------
 * Resolves the selected visual template and passes the same normalized dataset
 * and template-independent settings contract to it.
 */

import React from "react";

import type {
  WebsiteDataset,
  WebsiteTemplateComponentProps,
  WebsiteTemplateSettings,
} from "./types";

import { getWebsiteTemplate } from "./templates/registry";

export type WebsiteTemplateRouterProps = {
  dataset: WebsiteDataset;
  settings: WebsiteTemplateSettings;
  compact?: boolean;
  previewMode?: boolean;
};

export default function WebsiteTemplateRouter({
  dataset,
  settings,
  compact = false,
  previewMode = false,
}: WebsiteTemplateRouterProps) {
  const template = getWebsiteTemplate(
    settings.templateKey,
  );

  if (!template?.component) {
    return (
      <div
        role="status"
        className="website-template-unavailable"
      >
        Website template unavailable.
      </div>
    );
  }

  const TemplateComponent =
    template.component as React.ComponentType<WebsiteTemplateComponentProps>;

  return (
    <TemplateComponent
      dataset={dataset}
      settings={{
        ...settings,
        templateKey: template.key,
        templateVersion:
          settings.templateVersion ||
          template.version,
      }}
      compact={compact}
      previewMode={previewMode}
    />
  );
}
