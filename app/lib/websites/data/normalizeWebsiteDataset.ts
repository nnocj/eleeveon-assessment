/**
 * app/lib/websites/data/normalizeWebsiteDataset.ts
 * --------------------------------------------------------------------------
 * Normalizes local-preview and backend website payloads into the exact shared
 * WebsiteDataset contract consumed by every renderer and template.
 */

import type {
  WebsiteBranch,
  WebsiteDataset,
  WebsiteIdentity,
  WebsiteItem,
  WebsiteMedia,
  WebsiteNavigationLink,
  WebsitePerson,
  WebsiteSchool,
  WebsiteSection,
  WebsiteStatistics,
} from "../types";

type UnknownRecord = Record<string, unknown>;

const text = (value: unknown) =>
  String(value ?? "").trim();

const number = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const array = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

function media(value: unknown): WebsiteMedia | undefined {
  if (!value || typeof value !== "object") return undefined;

  const row = value as UnknownRecord;
  const url = text(
    row.url ||
      row.publicUrl ||
      row.remoteUrl ||
      row.localObjectUrl ||
      row.previewDataUrl ||
      row.thumbnailDataUrl,
  );

  if (!url) return undefined;

  return {
    id: text(row.id) || undefined,
    url,
    alt:
      text(
        row.alt ||
          row.altText ||
          row.fileName ||
          row.originalFileName,
      ) || undefined,
    width: number(row.width) || undefined,
    height: number(row.height) || undefined,
    metadata:
      row.metadata &&
      typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : undefined,
  };
}

function school(value: unknown): WebsiteSchool {
  const row =
    value && typeof value === "object"
      ? (value as UnknownRecord)
      : {};

  return {
    id: text(row.id) || undefined,
    name:
      text(row.name || row.siteName) ||
      "School",
    motto: text(row.motto) || undefined,
    description:
      text(row.description || row.about) ||
      undefined,
    email: text(row.email) || undefined,
    phone: text(row.phone) || undefined,
    website: text(row.website) || undefined,
    address:
      text(row.address || row.formattedAddress) ||
      undefined,
    location:
      text(row.location || row.locationLabel) ||
      undefined,
    logo: media(row.logo),
    banner: media(row.banner),
    raw: row,
  };
}

function branch(value: unknown): WebsiteBranch | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as UnknownRecord;

  return {
    id: text(row.id) || undefined,
    name: text(row.name) || "Branch",
    code: text(row.code) || undefined,
    email: text(row.email) || undefined,
    phone: text(row.phone) || undefined,
    website: text(row.website) || undefined,
    address:
      text(row.address || row.formattedAddress) ||
      undefined,
    location:
      text(row.location || row.locationLabel) ||
      undefined,
    city: text(row.city) || undefined,
    logo: media(row.logo),
    banner: media(row.banner),
    raw: row,
  };
}

function person(value: unknown): WebsitePerson | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as UnknownRecord;
  const name = text(
    row.name || row.fullName || row.displayName,
  );

  if (!name) return undefined;

  return {
    id: text(row.id) || undefined,
    name,
    title:
      text(
        row.title ||
          row.jobTitle ||
          row.designation ||
          row.position,
      ) || undefined,
    role: text(row.role || row.staffType) || undefined,
    bio:
      text(
        row.bio ||
          row.biography ||
          row.description,
      ) || undefined,
    email:
      text(row.email || row.publicEmail) ||
      undefined,
    phone:
      text(row.phone || row.publicPhone) ||
      undefined,
    photo: media(row.photo),
    raw: row,
  };
}

function item(value: unknown): WebsiteItem | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as UnknownRecord;
  const title = text(
    row.title ||
      row.name ||
      row.subjectName ||
      row.programName,
  );

  if (!title) return undefined;

  return {
    id: text(row.id) || undefined,
    title,
    subtitle:
      text(row.subtitle || row.code || row.category) ||
      undefined,
    body:
      text(
        row.body ||
          row.content ||
          row.description ||
          row.message ||
          row.summary,
      ) || undefined,
    slug: text(row.slug) || undefined,
    startsAt:
      number(
        row.startsAt ||
          row.startAt ||
          row.eventDate,
      ) || undefined,
    endsAt:
      number(row.endsAt || row.endAt) ||
      undefined,
    media: media(row.media),
    raw: row,
  };
}

function navigationLink(
  value: unknown,
): WebsiteNavigationLink | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as UnknownRecord;
  const label = text(row.label);
  const href = text(row.href || row.url);

  if (!label || !href) return undefined;

  return {
    id: text(row.id) || undefined,
    label,
    href,
    location: text(row.location) || undefined,
    openInNewTab: Boolean(row.openInNewTab),
    children: array(row.children)
      .map(navigationLink)
      .filter(
        (
          link,
        ): link is WebsiteNavigationLink =>
          Boolean(link),
      ),
  };
}

function section(value: unknown): WebsiteSection | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as UnknownRecord;
  const sectionKey = text(
    row.sectionKey || row.sectionType || row.id,
  );

  if (!sectionKey) return undefined;

  return {
    id: text(row.id) || undefined,
    sectionKey,
    sectionType:
      text(row.sectionType) || sectionKey,
    variant: text(row.variant) || undefined,
    heading: text(row.heading) || undefined,
    subheading: text(row.subheading) || undefined,
    body: text(row.body) || undefined,
    sourceType: text(row.sourceType) || undefined,
    sourceFilters:
      row.sourceFilters &&
      typeof row.sourceFilters === "object"
        ? (row.sourceFilters as Record<string, unknown>)
        : undefined,
    content:
      row.content &&
      typeof row.content === "object"
        ? (row.content as Record<string, unknown>)
        : undefined,
    settings:
      row.settings &&
      typeof row.settings === "object"
        ? (row.settings as Record<string, unknown>)
        : undefined,
    items: array(row.items)
      .map(item)
      .filter(
        (entry): entry is WebsiteItem =>
          Boolean(entry),
      ),
    primaryMedia: media(row.primaryMedia),
    backgroundMedia: media(row.backgroundMedia),
    media: array(row.media)
      .map(media)
      .filter(
        (entry): entry is WebsiteMedia =>
          Boolean(entry),
      ),
  };
}

function identity(
  value: unknown,
  fallbackSchool: WebsiteSchool,
): WebsiteIdentity {
  const row =
    value && typeof value === "object"
      ? (value as UnknownRecord)
      : {};

  return {
    id: text(row.id) || undefined,
    slug:
      text(row.slug || row.eleeveonSlug) ||
      "school",
    status:
      (text(row.status) || "draft") as WebsiteIdentity["status"],
    templateKey:
      text(row.templateKey) ||
      "modern_academy",
    templateVersion:
      text(row.templateVersion) ||
      undefined,
    siteName:
      text(row.siteName) ||
      fallbackSchool.name,
    tagline: text(row.tagline) || undefined,
    description:
      text(row.description) || undefined,
    seoTitle: text(row.seoTitle) || undefined,
    seoDescription:
      text(row.seoDescription) || undefined,
    publishedAt:
      (row.publishedAt as
        | number
        | string
        | null
        | undefined) ?? null,
  };
}

function statistics(
  value: unknown,
  derived: Omit<
    WebsiteStatistics,
    "students"
  > & { students: number },
): WebsiteStatistics {
  const row =
    value && typeof value === "object"
      ? (value as UnknownRecord)
      : {};

  return {
    students: number(row.students) || derived.students,
    teachers: number(row.teachers) || derived.teachers,
    classes: number(row.classes) || derived.classes,
    subjects: number(row.subjects) || derived.subjects,
    programs:
      number(row.programs) || derived.programs,
    organizations:
      number(row.organizations) ||
      derived.organizations,
    academicStructures:
      number(row.academicStructures) ||
      derived.academicStructures,
    galleryImages:
      number(row.galleryImages) ||
      derived.galleryImages,
    announcements:
      number(row.announcements) ||
      derived.announcements,
    events: number(row.events) || derived.events,
  };
}

export function normalizeWebsiteDataset(
  input: Partial<WebsiteDataset> &
    Record<string, unknown>,
): WebsiteDataset {
  const normalizedSchool = school(input.school);
  const normalizedBranch = branch(input.branch);

  const branches = array(input.branches)
    .map(branch)
    .filter(
      (entry): entry is WebsiteBranch =>
        Boolean(entry),
    );

  if (
    normalizedBranch &&
    !branches.some(
      (entry) => entry.id === normalizedBranch.id,
    )
  ) {
    branches.unshift(normalizedBranch);
  }

  const teachers = array(input.teachers)
    .map(person)
    .filter(
      (entry): entry is WebsitePerson =>
        Boolean(entry),
    );

  const programs = array(input.programs)
    .map(item)
    .filter(
      (entry): entry is WebsiteItem =>
        Boolean(entry),
    );

  const subjects = array(input.subjects)
    .map(item)
    .filter(
      (entry): entry is WebsiteItem =>
        Boolean(entry),
    );

  const organizations = array(input.organizations)
    .map(item)
    .filter(
      (entry): entry is WebsiteItem =>
        Boolean(entry),
    );

  const academicStructures = array(
    input.academicStructures,
  )
    .map(item)
    .filter(
      (entry): entry is WebsiteItem =>
        Boolean(entry),
    );

  const classes = array(input.classes)
    .map(item)
    .filter(
      (entry): entry is WebsiteItem =>
        Boolean(entry),
    );

  const highlights = array(input.highlights)
    .map(item)
    .filter(
      (entry): entry is WebsiteItem =>
        Boolean(entry),
    );

  const announcements = array(input.announcements)
    .map(item)
    .filter(
      (entry): entry is WebsiteItem =>
        Boolean(entry),
    );

  const events = array(input.events)
    .map(item)
    .filter(
      (entry): entry is WebsiteItem =>
        Boolean(entry),
    );

  const gallery = array(input.gallery)
    .map(media)
    .filter(
      (entry): entry is WebsiteMedia =>
        Boolean(entry),
    );

  const headerNavigation = array(
    input.headerNavigation ||
      input.navigation,
  )
    .map(navigationLink)
    .filter(
      (
        entry,
      ): entry is WebsiteNavigationLink =>
        Boolean(entry),
    );

  const footerNavigation = array(
    input.footerNavigation,
  )
    .map(navigationLink)
    .filter(
      (
        entry,
      ): entry is WebsiteNavigationLink =>
        Boolean(entry),
    );

  const sections = array(input.sections)
    .map(section)
    .filter(
      (entry): entry is WebsiteSection =>
        Boolean(entry),
    );

  const principal =
    person(input.principal) ||
    teachers.find((entry) =>
      /head|principal|director/i.test(
        `${entry.title || ""} ${entry.role || ""}`,
      ),
    );

  const suppliedStats =
    input.statistics || input.stats;

  return {
    accountId: text(input.accountId) || undefined,
    schoolId:
      text(input.schoolId || normalizedSchool.id) ||
      undefined,
    branchId:
      text(input.branchId || normalizedBranch?.id) ||
      undefined,
    websiteSettingId:
      text(
        input.websiteSettingId ||
          (input.website as UnknownRecord | undefined)?.id,
      ) || undefined,

    website: identity(
      input.website,
      normalizedSchool,
    ),

    school: normalizedSchool,
    branch: normalizedBranch,
    branches,

    principal,
    teachers,

    academicStructures,
    classes,
    programs,
    subjects,
    organizations,

    highlights,
    announcements,
    events,
    gallery,

    statistics: statistics(suppliedStats, {
      students: number(
        (suppliedStats as UnknownRecord | undefined)
          ?.students,
      ),
      teachers: teachers.length,
      classes: classes.length,
      subjects: subjects.length,
      programs: programs.length,
      organizations: organizations.length,
      academicStructures:
        academicStructures.length,
      galleryImages: gallery.length,
      announcements: announcements.length,
      events: events.length,
    }),

    navigation: headerNavigation,
    headerNavigation,
    footerNavigation,

    sections,
    generatedAt:
      number(input.generatedAt) || Date.now(),
  };
}
