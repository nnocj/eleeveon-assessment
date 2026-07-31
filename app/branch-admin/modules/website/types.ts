/**
 * app/branch-admin/website/types.ts
 * Shared contracts for real website template modules and website settings.
 */

import type React from "react";

export type WebsiteEditorTab =
  | "identity"
  | "template"
  | "domain"
  | "seo"
  | "publishing";

export type WebsiteSettingsDraft = {
  id?: string;
  siteName: string;
  tagline: string;
  description: string;
  /** Template codes are data-driven. Never restrict this to a hardcoded union. */
  templateKey: string;
  eleeveonSlug: string;
  status: "draft" | "published" | "unpublished" | "archived";
  defaultLanguage: string;
  searchEngineIndexing: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywordsText: string;
  analyticsProvider: string;
  analyticsTrackingId: string;
};

export type WebsiteTemplateRenderProps = {
  draft: WebsiteSettingsDraft;
  schoolName?: string;
  branchName?: string;
  primaryColor?: string;
  compact?: boolean;
};

export type WebsiteTemplateDefinition = {
  key: string;
  name: string;
  description: string;
  tone: string;
  version: string;
  category?: string;
  thumbnailMediaId?: string;
  defaultSections: string[];
  component: React.ComponentType<WebsiteTemplateRenderProps>;
};
