/**
 * app/lib/websites/shared/websiteTemplateSettings.ts
 * --------------------------------------------------------------------------
 * Shared website display, label and ordering settings.
 *
 * These settings are intentionally template-independent. Switching templates
 * must not remove content, labels, visibility choices or section order.
 */

import type {
  WebsiteSectionKey,
  WebsiteTemplateDefinition,
  WebsiteTemplateSettings,
} from "../types";

import {
  DEFAULT_WEBSITE_SECTION_ORDER,
  isWebsiteSectionVisible as isRegisteredWebsiteSectionVisible,
  resolveWebsiteSectionOrder,
} from "../sections/sectionRegistry";

export {
  DEFAULT_WEBSITE_SECTION_ORDER,
} from "../sections/sectionRegistry";

export const DEFAULT_WEBSITE_TEMPLATE_SETTINGS: WebsiteTemplateSettings = {
  templateKey: "modern_academy",
  templateVersion: "2.0.0",

  contentWidth: "standard",
  density: "comfortable",
  sectionSpacing: "standard",
  headerVariant: "standard",
  heroVariant: "split",
  statisticsVariant: "cards",
  teacherVariant: "cards",
  galleryVariant: "grid",
  footerVariant: "columns",

  showLogo: true,
  showMotto: true,
  showBranchName: true,

  showHero: true,
  showStatistics: true,
  showAbout: true,
  showPrincipal: true,
  showAcademicStructures: true,
  showPrograms: true,
  showSubjects: true,
  showOrganizations: true,
  showTeachers: true,
  showHighlights: true,
  showAnnouncements: true,
  showEvents: true,
  showGallery: true,
  showContact: true,
  showFooter: true,

  showHeroImage: true,
  showPrincipalPhoto: true,
  showTeacherPhotos: true,
  showSubjectCodes: true,
  showProgramDescriptions: true,

  showStudentCount: true,
  showTeacherCount: true,
  showClassCount: true,
  showSubjectCount: true,

  showPhone: true,
  showEmail: true,
  showAddress: true,
  showMap: false,
  showSocialLinks: true,
  showPoweredByEleeveon: true,

  homeLabel: "Home",
  aboutLabel: "About Our School",
  statisticsLabel: "Our School at a Glance",
  principalLabel: "Headteacher's Welcome",
  academicStructuresLabel: "Academic Levels",
  programsLabel: "Programmes",
  subjectsLabel: "Subjects We Offer",
  organizationsLabel: "School Life",
  teachersLabel: "Meet Our Teachers",
  highlightsLabel: "School Highlights",
  announcementsLabel: "Latest News",
  eventsLabel: "Upcoming Events",
  galleryLabel: "School Gallery",
  contactLabel: "Contact Us",
  phoneLabel: "Phone",
  emailLabel: "Email",
  addressLabel: "Address",
  footerText: "Powered by Eleeveon Schools",

  heroEyebrow: "",
  heroHeading: "",
  heroBody: "",
  primaryActionLabel: "Explore Our School",
  primaryActionHref: "#about",
  secondaryActionLabel: "Contact Us",
  secondaryActionHref: "#contact",
  principalMessage: "",
  aboutText: "",

  sectionOrder: [...DEFAULT_WEBSITE_SECTION_ORDER],
};

function normalizedSectionOrder(
  value?: WebsiteSectionKey[],
): WebsiteSectionKey[] {
  return resolveWebsiteSectionOrder({
    sectionOrder: value,
  });
}

export function createWebsiteTemplateSettings(
  input?: Partial<WebsiteTemplateSettings>,
  template?: WebsiteTemplateDefinition | null,
): WebsiteTemplateSettings {
  const designDefaults = template?.defaults || {};

  return {
    ...DEFAULT_WEBSITE_TEMPLATE_SETTINGS,
    ...designDefaults,
    ...input,

    templateKey:
      input?.templateKey ||
      template?.key ||
      DEFAULT_WEBSITE_TEMPLATE_SETTINGS.templateKey,

    templateVersion:
      input?.templateVersion ||
      template?.version ||
      DEFAULT_WEBSITE_TEMPLATE_SETTINGS.templateVersion,

    sectionOrder: normalizedSectionOrder(
      input?.sectionOrder,
    ),
  };
}

/**
 * Keeps school-controlled content, labels, visibility and order while applying
 * only the selected template's visual defaults.
 */
export function applyWebsiteTemplateDesign(
  settings: WebsiteTemplateSettings,
  template: WebsiteTemplateDefinition,
): WebsiteTemplateSettings {
  return createWebsiteTemplateSettings(
    {
      ...settings,
      ...(template.defaults || {}),
      templateKey: template.key,
      templateVersion: template.version,
      sectionOrder: settings.sectionOrder,
    },
    template,
  );
}

/**
 * Backward-compatible helper retained for existing imports.
 * The Phase 3 registry is now the single source of truth.
 */
export function isWebsiteSectionVisible(
  key: WebsiteSectionKey,
  settings: WebsiteTemplateSettings,
): boolean {
  return isRegisteredWebsiteSectionVisible(
    key,
    settings,
  );
}

export function visibleWebsiteSectionOrder(
  settings: WebsiteTemplateSettings,
): WebsiteSectionKey[] {
  return resolveWebsiteSectionOrder(settings).filter(
    (key) =>
      isRegisteredWebsiteSectionVisible(
        key,
        settings,
      ),
  );
}