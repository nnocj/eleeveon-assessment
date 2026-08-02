/**
 * app/lib/websites/types.ts
 * --------------------------------------------------------------------------
 * Shared contracts for the Eleeveon school website system.
 *
 * Phase 1 architecture:
 * - every website template receives the same normalized WebsiteDataset;
 * - every template respects the same WebsiteTemplateSettings contract;
 * - templates control visual presentation, not which data model exists;
 * - legacy aliases remain available while the current builder is migrated.
 */

import type React from "react";

// ---------------------------------------------------------------------------
// Editor and publishing
// ---------------------------------------------------------------------------

export type WebsiteStatus =
  | "draft"
  | "published"
  | "unpublished"
  | "archived";

export type WebsiteEditorTab =
  | "identity"
  | "template"
  | "display"
  | "labels"
  | "content"
  | "order"
  | "domain"
  | "seo"
  | "publishing";

export type WebsiteSettingsDraft = {
  id?: string;
  siteName: string;
  tagline: string;
  description: string;
  templateKey: string;
  eleeveonSlug: string;
  status: WebsiteStatus;
  defaultLanguage: string;
  searchEngineIndexing: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywordsText: string;
  analyticsProvider: string;
  analyticsTrackingId: string;
};


export type WebsiteIdentity = {
  id?: string;
  slug: string;
  status: WebsiteStatus;
  templateKey: string;
  templateVersion?: string;

  siteName?: string;
  tagline?: string;
  description?: string;

  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: number | string | null;
};

// ---------------------------------------------------------------------------
// Shared website dataset
// ---------------------------------------------------------------------------

export type WebsiteMedia = {
  id?: string;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
};

export type WebsiteSchool = {
  id?: string;
  name: string;
  motto?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  location?: string;
  logo?: WebsiteMedia;
  banner?: WebsiteMedia;
  raw?: Record<string, unknown>;
};

export type WebsiteBranch = {
  id?: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  location?: string;
  city?: string;
  logo?: WebsiteMedia;
  banner?: WebsiteMedia;
  raw?: Record<string, unknown>;
};

export type WebsitePerson = {
  id?: string;
  name: string;
  title?: string;
  role?: string;
  bio?: string;
  email?: string;
  phone?: string;
  photo?: WebsiteMedia;
  raw?: Record<string, unknown>;
};

export type WebsiteItem = {
  id?: string;
  title: string;
  subtitle?: string;
  body?: string;
  slug?: string;
  startsAt?: number;
  endsAt?: number;
  media?: WebsiteMedia;
  raw?: Record<string, unknown>;
};

export type WebsiteNavigationLink = {
  id?: string;
  label: string;
  href: string;
  location?: string;
  openInNewTab?: boolean;
  children?: WebsiteNavigationLink[];
};

export type WebsiteStatistics = {
  students: number;
  teachers: number;
  classes: number;
  subjects: number;
  programs: number;
  organizations: number;
  academicStructures: number;
  galleryImages: number;
  announcements: number;
  events: number;
};

export type WebsiteSectionKey =
  | "hero"
  | "statistics"
  | "about"
  | "principal"
  | "academic_structures"
  | "programs"
  | "programmes"
  | "subjects"
  | "organizations"
  | "teachers"
  | "highlights"
  | "announcements"
  | "events"
  | "gallery"
  | "contact"
  | "footer";

export type WebsiteSectionSourceType =
  | "manual"
  | "school"
  | "branches"
  | "programs"
  | "subjects"
  | "organizations"
  | "teachers"
  | "announcements"
  | "calendar_events"
  | "portal_highlights"
  | "media_gallery"
  | "custom";

export type WebsiteSection = {
  id?: string;
  sectionKey: string;
  sectionType: string;
  variant?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  sourceType?: WebsiteSectionSourceType | string;
  sourceFilters?: Record<string, unknown>;
  content?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  items?: WebsiteItem[];
  primaryMedia?: WebsiteMedia;
  backgroundMedia?: WebsiteMedia;
  media?: WebsiteMedia[];
};

export type WebsiteDataset = {
  accountId?: string;
  schoolId?: string;
  branchId?: string;
  websiteSettingId?: string;

  /**
   * Published website identity. Optional during the migration so the existing
   * local dataset adapter remains drop-in compatible until Phase 6.
   */
  website?: WebsiteIdentity;

  school: WebsiteSchool;
  branch?: WebsiteBranch;
  branches: WebsiteBranch[];

  principal?: WebsitePerson;
  teachers: WebsitePerson[];

  academicStructures: WebsiteItem[];
  classes: WebsiteItem[];
  programs: WebsiteItem[];
  subjects: WebsiteItem[];
  organizations: WebsiteItem[];

  highlights: WebsiteItem[];
  announcements: WebsiteItem[];
  events: WebsiteItem[];
  gallery: WebsiteMedia[];

  statistics: WebsiteStatistics;
  navigation: WebsiteNavigationLink[];
  headerNavigation: WebsiteNavigationLink[];
  footerNavigation: WebsiteNavigationLink[];

  /** Advanced page-builder records. The default single-page renderer may ignore these. */
  sections: WebsiteSection[];
  generatedAt: number;
};

// ---------------------------------------------------------------------------
// Shared template settings
// ---------------------------------------------------------------------------

export type WebsiteContentWidth = "narrow" | "standard" | "wide" | "full";
export type WebsiteDensity = "compact" | "comfortable" | "spacious";
export type WebsiteSectionSpacing = "compact" | "standard" | "spacious";
export type WebsiteHeaderVariant = "minimal" | "standard" | "bold" | "institutional";
export type WebsiteHeroVariant = "split" | "centered" | "full_bleed" | "banner";
export type WebsiteStatisticsVariant = "cards" | "large_numbers" | "inline";
export type WebsiteTeacherVariant = "cards" | "portrait_cards" | "compact_list";
export type WebsiteGalleryVariant = "grid" | "masonry" | "carousel";
export type WebsiteFooterVariant = "simple" | "columns" | "dark" | "institutional";

export type WebsiteTemplateSettings = {
  templateKey: string;
  templateVersion: string;

  contentWidth: WebsiteContentWidth;
  density: WebsiteDensity;
  sectionSpacing: WebsiteSectionSpacing;
  headerVariant: WebsiteHeaderVariant;
  heroVariant: WebsiteHeroVariant;
  statisticsVariant: WebsiteStatisticsVariant;
  teacherVariant: WebsiteTeacherVariant;
  galleryVariant: WebsiteGalleryVariant;
  footerVariant: WebsiteFooterVariant;

  showLogo: boolean;
  showMotto: boolean;
  showBranchName: boolean;
  showHero: boolean;
  showStatistics: boolean;
  showAbout: boolean;
  showPrincipal: boolean;
  showAcademicStructures: boolean;
  showPrograms: boolean;
  showSubjects: boolean;
  showOrganizations: boolean;
  showTeachers: boolean;
  showHighlights: boolean;
  showAnnouncements: boolean;
  showEvents: boolean;
  showGallery: boolean;
  showContact: boolean;
  showFooter: boolean;

  showHeroImage: boolean;
  showPrincipalPhoto: boolean;
  showTeacherPhotos: boolean;
  showSubjectCodes: boolean;
  showProgramDescriptions: boolean;
  showStudentCount: boolean;
  showTeacherCount: boolean;
  showClassCount: boolean;
  showSubjectCount: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showAddress: boolean;
  showMap: boolean;
  showSocialLinks: boolean;
  showPoweredByEleeveon: boolean;

  homeLabel: string;
  aboutLabel: string;
  statisticsLabel: string;
  principalLabel: string;
  academicStructuresLabel: string;
  programsLabel: string;
  subjectsLabel: string;
  organizationsLabel: string;
  teachersLabel: string;
  highlightsLabel: string;
  announcementsLabel: string;
  eventsLabel: string;
  galleryLabel: string;
  contactLabel: string;
  phoneLabel: string;
  emailLabel: string;
  addressLabel: string;
  footerText: string;

  heroEyebrow: string;
  heroHeading: string;
  heroBody: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
  principalMessage: string;
  aboutText: string;

  sectionOrder: WebsiteSectionKey[];
};


export type WebsiteTemplateAssignmentScope =
  | "website"
  | "page";

export type WebsiteTemplateSettingsPayload = {
  templateKey: string;
  templateVersion: string;
  settings: WebsiteTemplateSettings;
};

export type WebsiteTemplateAssignmentPayload = {
  templateSettingId: string;
  scopeType: WebsiteTemplateAssignmentScope;
  scopeId?: string | null;
  isDefault: boolean;
  active: boolean;
};

// ---------------------------------------------------------------------------
// Template registry and rendering
// ---------------------------------------------------------------------------

export type WebsiteTemplateDesignDefaults = Pick<
  WebsiteTemplateSettings,
  | "contentWidth"
  | "density"
  | "sectionSpacing"
  | "headerVariant"
  | "heroVariant"
  | "statisticsVariant"
  | "teacherVariant"
  | "galleryVariant"
  | "footerVariant"
>;

export type WebsiteTemplateComponentProps = {
  dataset: WebsiteDataset;
  settings: WebsiteTemplateSettings;
  compact?: boolean;
  previewMode?: boolean;
};

export type WebsiteTemplateDefinition = {
  key: string;
  name: string;
  description: string;
  tone: string;
  version: string;
  category?: string;
  thumbnailMediaId?: string;
  defaults?: Partial<WebsiteTemplateDesignDefaults>;

  /**
   * Accepts both the new shared renderer props and the legacy preview props
   * during the phased migration. Phase 4 will remove the legacy branch.
   */
  component:
    | React.ComponentType<WebsiteTemplateComponentProps>
    | React.ComponentType<WebsiteTemplateRenderProps>;

  /**
   * Temporary migration field. It remains required so the current settings UI
   * can call `.slice(...)` safely. Phase 3/4 will replace it with the global
   * section registry as the source of truth.
   */
  defaultSections: string[];
};

export type ResolveWebsiteDataArgs = {
  accountId: string;
  schoolId: string;
  branchId?: string | null;
  websiteSettingId?: string | null;
  draft?: WebsiteSettingsDraft;
};

// ---------------------------------------------------------------------------
// Backward-compatible aliases used by the current Phase 0 implementation.
// ---------------------------------------------------------------------------

export type WebsiteResolvedMedia = WebsiteMedia;
export type WebsiteResolvedSchool = WebsiteSchool;
export type WebsiteResolvedBranch = WebsiteBranch;
export type WebsiteResolvedPerson = WebsitePerson;
export type WebsiteResolvedItem = WebsiteItem;
export type WebsiteResolvedSection = WebsiteSection;

/**
 * Legacy resolved-data shape used by the current local preview resolver.
 * It stays intact so Phase 1 can be dropped in before Phase 6 upgrades the
 * resolver to return the complete WebsiteDataset.
 */
export type WebsiteResolvedData = {
  accountId?: string;
  schoolId?: string;
  branchId?: string;
  websiteSettingId?: string;
  school: WebsiteSchool;
  branch?: WebsiteBranch;
  branches: WebsiteBranch[];
  principal?: WebsitePerson;
  teachers: WebsitePerson[];
  programs: WebsiteItem[];
  subjects: WebsiteItem[];
  announcements: WebsiteItem[];
  events: WebsiteItem[];
  highlights: WebsiteItem[];
  gallery: WebsiteMedia[];
  navigation: WebsiteNavigationLink[];
  sections: WebsiteSection[];
  generatedAt: number;
};

/**
 * Legacy render props. Keep temporarily while templates are migrated in Phase 4.
 */
export type WebsiteTemplateRenderProps = {
  draft: WebsiteSettingsDraft;
  data?: WebsiteResolvedData;
  schoolName?: string;
  branchName?: string;
  primaryColor?: string;
  compact?: boolean;
};