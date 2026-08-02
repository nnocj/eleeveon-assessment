/**
 * app/lib/websites/shared/websiteDefaults.ts
 * --------------------------------------------------------------------------
 * Default identity, publishing and template settings for school websites.
 */

import type {
  WebsiteSettingsDraft,
  WebsiteTemplateDefinition,
  WebsiteTemplateSettings,
} from "../types";
import {
  createWebsiteTemplateSettings,
  DEFAULT_WEBSITE_TEMPLATE_SETTINGS,
} from "./websiteTemplateSettings";

export function normalizeWebsiteSlug(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export function websiteSettingsDraft(
  args?: Partial<WebsiteSettingsDraft> & {
    schoolName?: string;
    branchName?: string;
    defaultTemplateKey?: string;
  },
): WebsiteSettingsDraft {
  const suggestedName =
    args?.siteName ||
    args?.schoolName ||
    args?.branchName ||
    "School Website";

  return {
    id: args?.id,
    siteName: suggestedName,
    tagline: args?.tagline ?? "",
    description: args?.description ?? "",
    templateKey:
      args?.templateKey ||
      args?.defaultTemplateKey ||
      DEFAULT_WEBSITE_TEMPLATE_SETTINGS.templateKey,
    eleeveonSlug:
      args?.eleeveonSlug ||
      normalizeWebsiteSlug(args?.schoolName || args?.branchName || "school"),
    status: args?.status || "draft",
    defaultLanguage: args?.defaultLanguage || "en",
    searchEngineIndexing: args?.searchEngineIndexing ?? true,
    seoTitle: args?.seoTitle || suggestedName,
    seoDescription: args?.seoDescription ?? "",
    seoKeywordsText: args?.seoKeywordsText ?? "",
    analyticsProvider: args?.analyticsProvider ?? "",
    analyticsTrackingId: args?.analyticsTrackingId ?? "",
  };
}

export function websiteTemplateSettingsDraft(
  args?: Partial<WebsiteTemplateSettings>,
  template?: WebsiteTemplateDefinition | null,
): WebsiteTemplateSettings {
  return createWebsiteTemplateSettings(args, template);
}

export function splitKeywords(value: string) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function normalizeCustomDomain(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "")
    .trim();
}

export function websitePublicAddress(slug: string, rootDomain = "eleeveon.com") {
  const normalized = normalizeWebsiteSlug(slug);
  return normalized ? `${normalized}.${rootDomain}` : `your-school.${rootDomain}`;
}