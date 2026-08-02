/**
 * app/lib/websites/data/buildLocalWebsiteDataset.ts
 * --------------------------------------------------------------------------
 * Builds the exact shared WebsiteDataset from local-first Dexie records for
 * Branch Settings preview and offline website design.
 */

import { db } from "../../db/db";

import type {
  WebsiteDataset,
  WebsiteMedia,
  WebsiteSettingsDraft,
} from "../types";

import { normalizeWebsiteDataset } from "./normalizeWebsiteDataset";

type AnyRow = Record<string, any>;

export type BuildLocalWebsiteDatasetArgs = {
  accountId: string;
  schoolId: string;
  branchId?: string | null;
  websiteSettingId?: string | null;
  draft?: Partial<WebsiteSettingsDraft>;
};

const text = (value: unknown) =>
  String(value ?? "").trim();

const active = (row: AnyRow) =>
  row &&
  row.isDeleted !== true &&
  row.active !== false;

function scoped(
  rows: AnyRow[],
  args: BuildLocalWebsiteDatasetArgs,
  strictBranch = false,
) {
  return rows.filter((row) => {
    if (!active(row)) return false;

    const rowAccountId = text(row.accountId);
    const rowSchoolId = text(
      row.schoolId || row.id,
    );
    const rowBranchId = text(row.branchId);

    if (
      rowAccountId &&
      rowAccountId !== args.accountId
    ) {
      return false;
    }

    if (
      rowSchoolId &&
      rowSchoolId !== args.schoolId
    ) {
      return false;
    }

    if (
      strictBranch &&
      args.branchId &&
      rowBranchId &&
      rowBranchId !== args.branchId
    ) {
      return false;
    }

    return true;
  });
}

function mediaFromRow(
  row?: AnyRow,
): WebsiteMedia | undefined {
  if (!row) return undefined;

  const url = text(
    row.localObjectUrl ||
      row.previewDataUrl ||
      row.thumbnailDataUrl ||
      row.publicUrl ||
      row.remoteUrl,
  );

  if (!url) return undefined;

  return {
    id: text(row.id) || undefined,
    url,
    alt:
      text(
        row.altText ||
          row.fileName ||
          row.originalFileName,
      ) || undefined,
    width: Number(row.width) || undefined,
    height: Number(row.height) || undefined,
    metadata:
      row.metadata &&
      typeof row.metadata === "object"
        ? row.metadata
        : undefined,
  };
}

export async function buildLocalWebsiteDataset(
  args: BuildLocalWebsiteDatasetArgs,
): Promise<WebsiteDataset> {
  const [
    schools,
    branches,
    teachers,
    students,
    classes,
    academicStructures,
    programs,
    subjects,
    organizations,
    portalHighlights,
    announcements,
    calendarEvents,
    mediaAssets,
    websiteSettings,
    websitePages,
    websiteSections,
    websiteNavigationItems,
  ] = await Promise.all([
    db.schools.toArray(),
    db.branches.toArray(),
    db.teachers.toArray(),
    db.students.toArray(),
    db.classes.toArray(),
    db.academicStructures.toArray(),
    db.programs.toArray(),
    db.subjects.toArray(),
    db.organizations.toArray(),
    db.portalHighlights.toArray(),
    db.announcements.toArray(),
    db.calendarEvents.toArray(),
    db.mediaAssets.toArray(),
    db.websiteSettings.toArray(),
    db.websitePages.toArray(),
    db.websiteSections.toArray(),
    db.websiteNavigationItems.toArray(),
  ]);

  const school = scoped(
    schools as AnyRow[],
    args,
  ).find(
    (row) => text(row.id) === args.schoolId,
  );

  const branchRows = scoped(
    branches as AnyRow[],
    args,
    false,
  );

  const branch = branchRows.find(
    (row) =>
      !args.branchId ||
      text(row.id) === args.branchId,
  );

  const mediaRows = scoped(
    mediaAssets as AnyRow[],
    args,
    true,
  );

  const mediaById = (id: unknown) =>
    mediaFromRow(
      mediaRows.find(
        (row) => text(row.id) === text(id),
      ),
    );

  const item = (row: AnyRow) => ({
    id: text(row.id) || undefined,
    title:
      text(
        row.title ||
          row.name ||
          row.subjectName ||
          row.programName,
      ) || "Untitled",
    subtitle:
      text(
        row.subtitle ||
          row.code ||
          row.category,
      ) || undefined,
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
      Number(
        row.startsAt ||
          row.startAt ||
          row.eventDate,
      ) || undefined,
    endsAt:
      Number(row.endsAt || row.endAt) ||
      undefined,
    media: mediaById(
      row.mediaAssetId ||
        row.imageMediaId ||
        row.photoMediaId,
    ),
  });

  const person = (row: AnyRow) => ({
    id: text(row.id) || undefined,
    name:
      text(
        row.fullName ||
          row.name ||
          row.displayName,
      ) || "Staff member",
    title:
      text(
        row.jobTitle ||
          row.title ||
          row.designation ||
          row.position,
      ) || undefined,
    role:
      text(row.role || row.staffType) ||
      undefined,
    bio:
      text(
        row.bio ||
          row.biography ||
          row.description,
      ) || undefined,
    email:
      text(row.publicEmail || row.email) ||
      undefined,
    phone:
      text(row.publicPhone || row.phone) ||
      undefined,
    photo: mediaById(
      row.photoMediaId ||
        row.profilePhotoMediaId ||
        row.imageMediaId,
    ),
  });

  const teacherRows = scoped(
    teachers as AnyRow[],
    args,
    true,
  ).filter(
    (row) => row.websiteVisible !== false,
  );

  const normalizedTeachers =
    teacherRows.map(person);

  const principal =
    normalizedTeachers.find((entry) =>
      /head|principal|director/i.test(
        `${entry.title || ""} ${entry.role || ""}`,
      ),
    );

  const programItems = scoped(
    programs as AnyRow[],
    args,
    true,
  )
    .filter(
      (row) => row.websiteVisible !== false,
    )
    .map(item);

  const subjectItems = scoped(
    subjects as AnyRow[],
    args,
    true,
  )
    .filter(
      (row) => row.websiteVisible !== false,
    )
    .map(item);

  const organizationItems = scoped(
    organizations as AnyRow[],
    args,
    true,
  )
    .filter(
      (row) => row.websiteVisible !== false,
    )
    .map(item);

  const structureItems = scoped(
    academicStructures as AnyRow[],
    args,
    true,
  )
    .filter(
      (row) => row.websiteVisible !== false,
    )
    .map(item);

  const classItems = scoped(
    classes as AnyRow[],
    args,
    true,
  )
    .filter(
      (row) => row.websiteVisible !== false,
    )
    .map(item);

  const highlightItems = scoped(
    portalHighlights as AnyRow[],
    args,
    true,
  )
    .filter(
      (row) =>
        row.websiteVisible !== false &&
        !["draft", "archived", "expired"].includes(
          text(row.status).toLowerCase(),
        ),
    )
    .map(item);

  const announcementItems = scoped(
    announcements as AnyRow[],
    args,
    true,
  )
    .filter(
      (row) =>
        row.websiteVisible !== false &&
        row.published !== false &&
        text(row.status).toLowerCase() !==
          "draft",
    )
    .map(item);

  const eventItems = scoped(
    calendarEvents as AnyRow[],
    args,
    true,
  )
    .filter(
      (row) =>
        row.websiteVisible !== false &&
        row.public !== false,
    )
    .map(item);

  const explicitGallery = mediaRows.filter(
    (row) =>
      row.websiteVisible === true ||
      row.metadata?.websiteVisible === true ||
      /gallery/i.test(
        `${row.ownerTable || ""} ${row.fieldKey || ""}`,
      ),
  );

  const gallery = explicitGallery
    .map(mediaFromRow)
    .filter(
      (
        entry,
      ): entry is WebsiteMedia =>
        Boolean(entry),
    );

  const websiteSettingRows = scoped(
    websiteSettings as AnyRow[],
    args,
    true,
  );

  const savedWebsite =
    websiteSettingRows.find(
      (row) =>
        args.websiteSettingId &&
        text(row.id) ===
          args.websiteSettingId,
    ) ||
    websiteSettingRows.find(
      (row) =>
        !args.branchId ||
        !text(row.branchId) ||
        text(row.branchId) ===
          args.branchId,
    );

  const websiteId = text(
    args.websiteSettingId || savedWebsite?.id,
  );

  const pageRows = scoped(
    websitePages as AnyRow[],
    args,
    true,
  )
    .filter(
      (row) =>
        !websiteId ||
        text(row.websiteSettingId) === websiteId,
    )
    .sort(
      (a, b) =>
        Number(a.displayOrder || 0) -
        Number(b.displayOrder || 0),
    );

  const sectionRows = scoped(
    websiteSections as AnyRow[],
    args,
    true,
  )
    .filter(
      (row) =>
        !websiteId ||
        text(row.websiteSettingId) === websiteId,
    )
    .sort(
      (a, b) =>
        Number(a.displayOrder || 0) -
        Number(b.displayOrder || 0),
    );

  const navigationRows = scoped(
    websiteNavigationItems as AnyRow[],
    args,
    true,
  )
    .filter(
      (row) =>
        !websiteId ||
        text(row.websiteSettingId) === websiteId,
    )
    .sort(
      (a, b) =>
        Number(a.displayOrder || 0) -
        Number(b.displayOrder || 0),
    );

  const pageById = new Map(
    pageRows.map((row) => [
      text(row.id),
      row,
    ]),
  );

  const navigationHref = (row: AnyRow) => {
    if (row.targetType === "external_url") {
      return text(row.url) || "#";
    }

    if (row.targetType === "portal_login") {
      return (
        text(row.url) ||
        "https://schools.eleeveon.com"
      );
    }

    if (row.targetType === "section") {
      const target = sectionRows.find(
        (section) =>
          text(section.id) ===
          text(row.sectionId),
      );

      return `#${text(
        target?.sectionKey || row.sectionId,
      )}`;
    }

    const page = pageById.get(
      text(row.pageId),
    );

    if (
      page &&
      !["", "home", "index"].includes(
        text(page.slug).toLowerCase(),
      )
    ) {
      return `/${text(page.slug)}`;
    }

    return "/";
  };

  const navigation = navigationRows.map(
    (row) => ({
      id: text(row.id) || undefined,
      label: text(row.label) || "Link",
      href: navigationHref(row),
      location:
        text(row.location) || "header",
      openInNewTab: Boolean(
        row.openInNewTab,
      ),
    }),
  );

  const headerNavigation =
    navigation.filter(
      (row) => row.location !== "footer",
    );

  const footerNavigation =
    navigation.filter(
      (row) => row.location === "footer",
    );

  const sections = sectionRows.map(
    (row) => ({
      id: text(row.id) || undefined,
      sectionKey:
        text(row.sectionKey || row.id) ||
        "content",
      sectionType:
        text(row.sectionType) || "content",
      variant: text(row.variant) || undefined,
      heading: text(row.heading) || undefined,
      subheading:
        text(row.subheading) || undefined,
      body: text(row.body) || undefined,
      sourceType:
        text(row.sourceType) || undefined,
      sourceFilters:
        row.sourceFilters || undefined,
      content: row.content || undefined,
      settings: row.settings || undefined,
      primaryMedia: mediaById(
        row.primaryMediaAssetId,
      ),
      backgroundMedia: mediaById(
        row.backgroundMediaAssetId,
      ),
      media: Array.isArray(
        row.mediaAssetIds,
      )
        ? row.mediaAssetIds
            .map(mediaById)
            .filter(
              (
                entry,
              ): entry is WebsiteMedia =>
                Boolean(entry),
            )
        : [],
    }),
  );

  const activeStudents = scoped(
    students as AnyRow[],
    args,
    true,
  ).filter(
    (row) =>
      !["withdrawn", "transferred"].includes(
        text(row.status).toLowerCase(),
      ),
  );

  return normalizeWebsiteDataset({
    accountId: args.accountId,
    schoolId: args.schoolId,
    branchId: args.branchId || undefined,
    websiteSettingId:
      websiteId || undefined,

    website: {
      id: websiteId || undefined,
      slug:
        args.draft?.eleeveonSlug ||
        savedWebsite?.eleeveonSlug ||
        "school",
      status:
        args.draft?.status ||
        savedWebsite?.status ||
        "draft",
      templateKey:
        args.draft?.templateKey ||
        savedWebsite?.templateKey ||
        "modern_academy",
      templateVersion:
        savedWebsite?.templateVersion ||
        "2.0.0",
      siteName:
        args.draft?.siteName ||
        savedWebsite?.siteName ||
        school?.name,
      tagline:
        args.draft?.tagline ??
        savedWebsite?.tagline,
      description:
        args.draft?.description ??
        savedWebsite?.description,
      seoTitle:
        args.draft?.seoTitle ??
        savedWebsite?.seoTitle,
      seoDescription:
        args.draft?.seoDescription ??
        savedWebsite?.seoDescription,
      publishedAt:
        savedWebsite?.publishedAt ?? null,
    },

    school: {
      id: text(school?.id) || undefined,
      name:
        text(school?.name) ||
        args.draft?.siteName ||
        savedWebsite?.siteName ||
        "School",
      motto: text(school?.motto) || undefined,
      description:
        text(
          school?.description ||
            school?.about,
        ) || undefined,
      email: text(school?.email) || undefined,
      phone: text(school?.phone) || undefined,
      website: text(school?.website) || undefined,
      address:
        text(
          school?.address ||
            school?.formattedAddress,
        ) || undefined,
      location:
        text(
          school?.location ||
            school?.locationLabel,
        ) || undefined,
      logo: mediaById(
        school?.logoMediaId,
      ),
      banner: mediaById(
        school?.bannerImageMediaId,
      ),
      raw: school,
    },

    branch: branch
      ? {
          id: text(branch.id) || undefined,
          name: text(branch.name) || "Branch",
          code: text(branch.code) || undefined,
          email: text(branch.email) || undefined,
          phone: text(branch.phone) || undefined,
          website:
            text(branch.website) || undefined,
          address:
            text(
              branch.address ||
                branch.formattedAddress,
            ) || undefined,
          location:
            text(
              branch.location ||
                branch.locationLabel,
            ) || undefined,
          city: text(branch.city) || undefined,
          logo: mediaById(
            branch.logoMediaId,
          ),
          banner: mediaById(
            branch.bannerImageMediaId,
          ),
          raw: branch,
        }
      : undefined,

    branches: branchRows.map((row) => ({
      id: text(row.id) || undefined,
      name: text(row.name) || "Branch",
      code: text(row.code) || undefined,
      email: text(row.email) || undefined,
      phone: text(row.phone) || undefined,
      website: text(row.website) || undefined,
      address:
        text(
          row.address ||
            row.formattedAddress,
        ) || undefined,
      location:
        text(
          row.location ||
            row.locationLabel,
        ) || undefined,
      city: text(row.city) || undefined,
      logo: mediaById(row.logoMediaId),
      banner: mediaById(
        row.bannerImageMediaId,
      ),
      raw: row,
    })),

    principal,
    teachers: normalizedTeachers,
    academicStructures: structureItems,
    classes: classItems,
    programs: programItems,
    subjects: subjectItems,
    organizations: organizationItems,
    highlights: highlightItems,
    announcements: announcementItems,
    events: eventItems,
    gallery,

    statistics: {
      students: activeStudents.length,
      teachers: normalizedTeachers.length,
      classes: classItems.length,
      subjects: subjectItems.length,
      programs: programItems.length,
      organizations:
        organizationItems.length,
      academicStructures:
        structureItems.length,
      galleryImages: gallery.length,
      announcements:
        announcementItems.length,
      events: eventItems.length,
    },

    navigation: headerNavigation,
    headerNavigation,
    footerNavigation,
    sections,
    generatedAt: Date.now(),
  });
}

export default buildLocalWebsiteDataset;