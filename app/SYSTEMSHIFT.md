Phase 1 — Define the shared website contracts

Build the common data and settings model first. Do not touch the individual templates until this is stable.

Goal

Every template receives the same:

WebsiteDataset
WebsiteTemplateSettings
WebsiteTemplateDefinition
Files to create or update
app/lib/websites/types.ts
app/lib/websites/shared/websiteDataset.ts
app/lib/websites/shared/websiteTemplateSettings.ts
app/lib/websites/shared/websiteDefaults.ts
Main work

Create a normalized dataset:

export type WebsiteDataset = {
  website: WebsiteIdentity;
  school: WebsiteSchool;
  branch?: WebsiteBranch;

  principal?: WebsitePerson;
  teachers: WebsitePerson[];

  academicStructures: WebsiteItem[];
  programs: WebsiteItem[];
  subjects: WebsiteItem[];
  organizations: WebsiteItem[];

  highlights: WebsiteItem[];
  announcements: WebsiteItem[];
  events: WebsiteItem[];
  gallery: WebsiteMedia[];

  statistics: WebsiteStatistics;
  navigation: WebsiteNavigationLink[];
  footerNavigation: WebsiteNavigationLink[];
};

Create one shared settings contract:

export type WebsiteTemplateSettings = {
  templateKey: string;
  templateVersion: string;

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

  showPrincipalPhoto: boolean;
  showTeacherPhotos: boolean;
  showSubjectCodes: boolean;

  showStudentCount: boolean;
  showTeacherCount: boolean;
  showClassCount: boolean;
  showSubjectCount: boolean;

  showPhone: boolean;
  showEmail: boolean;
  showAddress: boolean;
  showPoweredByEleeveon: boolean;

  homeLabel: string;
  aboutLabel: string;
  statisticsLabel: string;
  principalLabel: string;
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

  heroEyebrow?: string;
  heroHeading?: string;
  heroBody?: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  principalMessage?: string;
  aboutText?: string;

  sectionOrder: WebsiteSectionKey[];
};

This mirrors how report settings contain common visibility controls and configurable labels.

Phase 2 — Add website template settings persistence
Goal

Separate:

website identity and publishing;
selected template;
template display settings;
template assignment.

This follows the reports system, which stores template definitions, settings, and assignments separately.

Recommended tables

Create:

websiteTemplateSettings
websiteTemplateAssignments

You may keep the template registry in code instead of creating a websiteTemplates Dexie table.

Files to update
app/lib/db/db.ts
app/lib/sync/syncTables.ts
app/lib/websites/types.ts
app/lib/websites/shared/websiteDefaults.ts
Suggested interfaces
export interface WebsiteTemplateSetting extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  websiteSettingId: string;

  templateKey: string;
  templateVersion: string;

  settings: WebsiteTemplateSettings;

  active: boolean;
}
export interface WebsiteTemplateAssignment extends BaseSync {
  schoolId: string;
  branchId?: string | null;
  websiteSettingId: string;
  templateSettingId: string;

  scopeType: "website" | "page";
  scopeId?: string | null;

  isDefault: boolean;
  active: boolean;
}
Sync changes

Add both tables to:

ALL_KNOWN_DEXIE_TABLES
LOCAL_FIRST_SYNC_TABLES

They will then automatically enter push and pull sync.

Phase 3 — Create the global section registry
Goal

Stop allowing individual templates to define different data models.

Create one common list of supported sections.

Files to create
app/lib/websites/sections/sectionRegistry.ts
app/lib/websites/sections/sectionDefaults.ts
app/lib/websites/sections/sectionTypes.ts
Example registry
export const WEBSITE_SECTION_REGISTRY = [
  "hero",
  "statistics",
  "about",
  "principal",
  "academic_structures",
  "programmes",
  "subjects",
  "organizations",
  "teachers",
  "highlights",
  "announcements",
  "events",
  "gallery",
  "contact",
  "footer",
] as const;

Each entry should define:

{
  key: "teachers",
  defaultLabel: "Meet Our Teachers",
  sourceType: "teachers",
  visibilitySetting: "showTeachers",
  supportsMedia: true,
  supportsCustomHeading: true,
}

This becomes the single source of truth for:

settings controls;
preview;
public renderer;
navigation;
section ordering;
labels.
Phase 4 — Rebuild template definitions
Goal

Templates should describe design defaults only.

They should no longer decide what information the website supports.

Files to update
app/lib/websites/templates/bold-campus/index.tsx
app/lib/websites/templates/classic-school/index.tsx
app/lib/websites/templates/modern-academy/index.tsx
app/lib/websites/templates/registry.ts
app/lib/websites/templates/registry.generated.ts
New template definition

Replace:

defaultSections: [...]

with design options such as:

export const websiteTemplate: WebsiteTemplateDefinition = {
  key: "bold_campus",
  name: "Bold Campus",
  version: "2.0.0",
  category: "energetic",
  tone: "Bright · bold · active",

  defaults: {
    contentWidth: "wide",
    density: "compact",
    headerVariant: "bold",
    heroVariant: "full_bleed",
    statisticsVariant: "large_numbers",
    teacherVariant: "portrait_cards",
    galleryVariant: "masonry",
    footerVariant: "dark",
  },

  component: BoldCampusTemplate,
};

All templates must accept:

type WebsiteTemplateComponentProps = {
  dataset: WebsiteDataset;
  settings: WebsiteTemplateSettings;
  compact?: boolean;
  previewMode?: boolean;
};
Phase 5 — Build one shared website renderer
Goal

Use the same renderer in:

Branch Settings preview;
public website;
future website builder;
possible exported previews.
Files to create or rebuild
app/lib/websites/WebsiteRenderer.tsx
app/lib/websites/WebsiteTemplateRouter.tsx
app/lib/websites/sections/WebsiteSectionRenderer.tsx
app/lib/websites/components.tsx
Rendering flow
<WebsiteTemplateRouter
  dataset={dataset}
  settings={settings}
/>

The router resolves:

const template = getWebsiteTemplate(settings.templateKey);

Then renders:

<template.component
  dataset={dataset}
  settings={settings}
/>

The section renderer should:

follow settings.sectionOrder;
skip sections whose show... setting is false;
use shared labels;
pass normalized data;
never query Dexie or the backend itself.
Phase 6 — Build the shared dataset adapter
Goal

Make Branch Settings preview and the public website use the same data shape.

Frontend files
app/lib/websites/data/buildLocalWebsiteDataset.ts
app/lib/websites/data/normalizeWebsiteDataset.ts
app/lib/websites/components/WebsitePreview.tsx
Backend files
backend/src/public-websites/public-websites.service.ts
backend/src/public-websites/public-websites.types.ts
Local preview adapter

The preview adapter should read from Dexie:

schools
branches
teachers
students
classes
academicStructures
programs
subjects
organizations
portalHighlights
announcements
calendarEvents
mediaAssets

and produce the same WebsiteDataset returned by the backend.

The public service already assembles most of this data. It should be adjusted to return the exact shared contract.

Phase 7 — Rebuild Website Settings like Report Settings
Goal

Give Website Settings the same interaction model as report templates:

select a template;
see the exact real preview;
control visibility;
edit labels;
change ordering;
save settings;
switch templates without losing content.
Main file
app/lib/websites/builder/settings/WebsiteSettingsSheet.tsx
Recommended supporting components
app/lib/websites/builder/settings/WebsiteTemplateSelector.tsx
app/lib/websites/builder/settings/WebsiteDisplayControls.tsx
app/lib/websites/builder/settings/WebsiteLabelControls.tsx
app/lib/websites/builder/settings/WebsiteContentOverrides.tsx
app/lib/websites/builder/settings/WebsiteSectionOrder.tsx
app/lib/websites/builder/settings/WebsitePublishingControls.tsx
app/lib/websites/builder/settings/WebsiteDomainControls.tsx
Suggested tabs
Template
Display
Labels
Content
Order
Domain
SEO
Publishing
Display controls

Use report-style switches:

Show school logo
Show branch name
Show hero section
Show statistics
Show student count
Show teacher count
Show principal
Show principal photo
Show teachers
Show teacher photos
Show programmes
Show subjects
Show announcements
Show events
Show gallery
Show contact information
Show powered by Eleeveon
Label controls

Use compact input controls like report labels:

About section label
Principal section label
Programmes label
Subjects label
Teachers label
Gallery label
Contact label
Phone label
Email label
Address label
Footer text
Phase 8 — Make the preview exact
Goal

The preview inside Branch Settings must use the real public rendering path.

Files to update
app/lib/websites/components/WebsitePreview.tsx
app/lib/websites/WebsiteTemplateRouter.tsx
app/lib/websites/templates/*

Remove separate miniature preview markup from each template.

Do not maintain:

<div className="actual-website-template">
  preview-only content
</div>

Instead render:

<WebsiteTemplateRouter
  dataset={localDataset}
  settings={draftSettings}
  previewMode
/>

Use CSS scale or a responsive preview frame to fit it inside the settings sheet.

The template markup used in preview and public view must be identical.

Phase 9 — Rework saving
Goal

Save the same way reports save template settings and assignments.

File to update
app/lib/websites/builder/settings/WebsiteSettingsSheet.tsx
Save sequence
1. Save websiteSettings
2. Save websiteTemplateSettings
3. Save websiteTemplateAssignment
4. Save domain settings
5. Save optional page metadata
6. Publish sync event
7. Reload exact preview

Do not recreate sections whenever the template changes.

The section order and visibility should live inside WebsiteTemplateSettings.

websitePages and websiteSections should remain for future advanced content editing and multi-page websites.

Phase 10 — Update public backend resolution
Goal

The backend should resolve:

website identity
+ assigned template
+ template settings
+ normalized dataset
Files to update
backend/src/public-websites/public-websites.service.ts
backend/src/public-websites/public-websites.types.ts
backend/src/public-websites/public-websites.controller.ts
Tables to read
websiteSettings
websiteTemplateSettings
websiteTemplateAssignments

The response should include:

{
  dataset,
  settings,
  website,
  generatedAt,
}

Or retain the current flattened snapshot while adding:

templateSettings: WebsiteTemplateSettings

The frontend and backend contracts must match exactly.

Phase 11 — Update the public website app
Files to update
app/lib/websites/types.ts
app/lib/websites/api.ts
app/lib/websites/WebsiteRenderer.tsx
app/lib/websites/WebsiteTemplateRouter.tsx
app/lib/websites/components.tsx
app/sites/[slug]/[[...path]]/page.tsx
Public flow
hostname or slug
→ fetch public dataset and template settings
→ resolve selected template
→ render shared dataset
→ apply labels, visibility and order

The current automatic default page can remain as emergency fallback, but it should not be the normal rendering path once template settings exist.

Phase 12 — Migration and backward compatibility
Goal

Existing published schools must keep working.

Files to create
app/lib/websites/migrations/migrateLegacyWebsiteSettings.ts
app/lib/websites/migrations/websiteSettingsVersion.ts
Migration logic

For a website that has:

websiteSettings
but no websiteTemplateSettings

create defaults based on:

websiteSettings.templateKey

Do not delete existing:

websitePages
websiteSections
websiteNavigationItems

Those records may later be used by the advanced builder.

Recommended implementation order
Phase 1  Shared types
Phase 2  Dexie settings tables
Phase 3  Global section registry
Phase 4  Template contracts
Phase 5  Shared renderer
Phase 6  Local/backend dataset adapters
Phase 7  Website Settings UI
Phase 8  Exact preview
Phase 9  Persistence flow
Phase 10 Backend response
Phase 11 Public website app
Phase 12 Migration
Most important files

Start with these first:

app/lib/websites/types.ts
app/lib/websites/shared/websiteTemplateSettings.ts
app/lib/websites/shared/websiteDefaults.ts
app/lib/websites/sections/sectionRegistry.ts
app/lib/db/db.ts
app/lib/sync/syncTables.ts
app/lib/websites/WebsiteTemplateRouter.tsx
app/lib/websites/builder/settings/WebsiteSettingsSheet.tsx
backend/src/public-websites/public-websites.service.ts

The database already provides flexible page, section, and navigation structures, so this shift can be built on top of the existing system rather than replacing it.