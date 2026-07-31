/** Shared public-website contracts. Templates receive a resolved view model and never query Dexie. */
import type React from "react";

export type WebsiteEditorTab = "identity" | "template" | "domain" | "seo" | "publishing";
export type WebsiteSettingsDraft = {
  id?: string; siteName: string; tagline: string; description: string; templateKey: string;
  eleeveonSlug: string; status: "draft" | "published" | "unpublished" | "archived";
  defaultLanguage: string; searchEngineIndexing: boolean; seoTitle: string;
  seoDescription: string; seoKeywordsText: string; analyticsProvider: string; analyticsTrackingId: string;
};
export type WebsiteResolvedMedia = { id?: string; url?: string; alt?: string; width?: number; height?: number; metadata?: Record<string, unknown> };
export type WebsiteResolvedSchool = { id?: string; name: string; motto?: string; description?: string; email?: string; phone?: string; website?: string; address?: string; location?: string; logo?: WebsiteResolvedMedia; banner?: WebsiteResolvedMedia; raw?: Record<string, unknown> };
export type WebsiteResolvedBranch = { id?: string; name: string; code?: string; email?: string; phone?: string; address?: string; location?: string; city?: string; logo?: WebsiteResolvedMedia; banner?: WebsiteResolvedMedia; raw?: Record<string, unknown> };
export type WebsiteResolvedPerson = { id?: string; name: string; title?: string; role?: string; bio?: string; email?: string; phone?: string; photo?: WebsiteResolvedMedia; raw?: Record<string, unknown> };
export type WebsiteResolvedItem = { id?: string; title: string; subtitle?: string; body?: string; slug?: string; startsAt?: number; endsAt?: number; media?: WebsiteResolvedMedia; raw?: Record<string, unknown> };
export type WebsiteResolvedSection = { id?: string; sectionKey: string; sectionType: string; variant?: string; heading?: string; subheading?: string; body?: string; sourceType?: string; sourceFilters?: Record<string, unknown>; content?: Record<string, unknown>; settings?: Record<string, unknown>; items?: WebsiteResolvedItem[]; primaryMedia?: WebsiteResolvedMedia; backgroundMedia?: WebsiteResolvedMedia; media?: WebsiteResolvedMedia[] };
export type WebsiteNavigationLink = { id?: string; label: string; href: string; location?: string; openInNewTab?: boolean; children?: WebsiteNavigationLink[] };
export type WebsiteResolvedData = {
  accountId?: string; schoolId?: string; branchId?: string; websiteSettingId?: string;
  school: WebsiteResolvedSchool; branch?: WebsiteResolvedBranch; branches: WebsiteResolvedBranch[];
  principal?: WebsiteResolvedPerson; teachers: WebsiteResolvedPerson[];
  programs: WebsiteResolvedItem[]; subjects: WebsiteResolvedItem[]; announcements: WebsiteResolvedItem[];
  events: WebsiteResolvedItem[]; highlights: WebsiteResolvedItem[]; gallery: WebsiteResolvedMedia[];
  navigation: WebsiteNavigationLink[]; sections: WebsiteResolvedSection[];
  generatedAt: number;
};
export type WebsiteTemplateRenderProps = { draft: WebsiteSettingsDraft; data?: WebsiteResolvedData; schoolName?: string; branchName?: string; primaryColor?: string; compact?: boolean };
export type WebsiteTemplateDefinition = { key: string; name: string; description: string; tone: string; version: string; category?: string; thumbnailMediaId?: string; defaultSections: string[]; component: React.ComponentType<WebsiteTemplateRenderProps> };
export type ResolveWebsiteDataArgs = { accountId: string; schoolId: string; branchId?: string | null; websiteSettingId?: string | null; draft?: WebsiteSettingsDraft };
