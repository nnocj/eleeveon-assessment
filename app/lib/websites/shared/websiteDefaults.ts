/**
 * app/lib/websites/shared/websiteDefaults.ts
 */

import type { WebsiteSettingsDraft } from "../types";
import { getDefaultWebsiteTemplate } from "../templates/registry";

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
    tagline: args?.tagline || "",
    description: args?.description || "",
    templateKey: args?.templateKey || getDefaultWebsiteTemplate()?.key || "",
    eleeveonSlug:
      args?.eleeveonSlug ||
      normalizeWebsiteSlug(args?.schoolName || args?.branchName || "school"),
    status: args?.status || "draft",
    defaultLanguage: args?.defaultLanguage || "en",
    searchEngineIndexing: args?.searchEngineIndexing ?? true,
    seoTitle: args?.seoTitle || suggestedName,
    seoDescription: args?.seoDescription || "",
    seoKeywordsText: args?.seoKeywordsText || "",
    analyticsProvider: args?.analyticsProvider || "",
    analyticsTrackingId: args?.analyticsTrackingId || "",
  };
}

export function splitKeywords(value: string) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}
