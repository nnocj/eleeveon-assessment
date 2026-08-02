/**
 * app/lib/websites/shared/websiteDataset.ts
 * --------------------------------------------------------------------------
 * Helpers for creating and normalizing the one shared dataset received by all
 * website templates. No template should query Dexie or the backend directly.
 */

import type {
  WebsiteBranch,
  WebsiteDataset,
  WebsiteItem,
  WebsiteNavigationLink,
  WebsitePerson,
  WebsiteSchool,
  WebsiteStatistics,
} from "../types";

const EMPTY_STATISTICS: WebsiteStatistics = {
  students: 0,
  teachers: 0,
  classes: 0,
  subjects: 0,
  programs: 0,
  organizations: 0,
  academicStructures: 0,
  galleryImages: 0,
  announcements: 0,
  events: 0,
};

export function emptyWebsiteStatistics(): WebsiteStatistics {
  return { ...EMPTY_STATISTICS };
}

export function createEmptyWebsiteDataset(args?: {
  accountId?: string;
  schoolId?: string;
  branchId?: string;
  websiteSettingId?: string;
  school?: Partial<WebsiteSchool>;
  branch?: Partial<WebsiteBranch>;
}): WebsiteDataset {
  const school: WebsiteSchool = {
    id: args?.school?.id || args?.schoolId,
    name: args?.school?.name || "School",
    ...args?.school,
  };

  const branch = args?.branch
    ? ({
        name: args.branch.name || "Main Campus",
        ...args.branch,
      } as WebsiteBranch)
    : undefined;

  return {
    accountId: args?.accountId,
    schoolId: args?.schoolId || school.id,
    branchId: args?.branchId || branch?.id,
    websiteSettingId: args?.websiteSettingId,
    school,
    branch,
    branches: branch ? [branch] : [],
    principal: undefined,
    teachers: [],
    academicStructures: [],
    classes: [],
    programs: [],
    subjects: [],
    organizations: [],
    highlights: [],
    announcements: [],
    events: [],
    gallery: [],
    statistics: emptyWebsiteStatistics(),
    navigation: [],
    headerNavigation: [],
    footerNavigation: [],
    sections: [],
    generatedAt: Date.now(),
  };
}

function cleanItems(items?: WebsiteItem[]): WebsiteItem[] {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function cleanPeople(people?: WebsitePerson[]): WebsitePerson[] {
  return Array.isArray(people) ? people.filter(Boolean) : [];
}

function cleanNavigation(
  links?: WebsiteNavigationLink[],
): WebsiteNavigationLink[] {
  return Array.isArray(links)
    ? links.filter(Boolean).map((link) => ({
        ...link,
        children: cleanNavigation(link.children),
      }))
    : [];
}

export function deriveWebsiteStatistics(
  dataset: Partial<WebsiteDataset>,
): WebsiteStatistics {
  const supplied = dataset.statistics || ({} as Partial<WebsiteStatistics>);

  return {
    students: Number(supplied.students || 0),
    teachers: Number(supplied.teachers ?? dataset.teachers?.length ?? 0),
    classes: Number(supplied.classes ?? dataset.classes?.length ?? 0),
    subjects: Number(supplied.subjects ?? dataset.subjects?.length ?? 0),
    programs: Number(supplied.programs ?? dataset.programs?.length ?? 0),
    organizations: Number(
      supplied.organizations ?? dataset.organizations?.length ?? 0,
    ),
    academicStructures: Number(
      supplied.academicStructures ?? dataset.academicStructures?.length ?? 0,
    ),
    galleryImages: Number(
      supplied.galleryImages ?? dataset.gallery?.length ?? 0,
    ),
    announcements: Number(
      supplied.announcements ?? dataset.announcements?.length ?? 0,
    ),
    events: Number(supplied.events ?? dataset.events?.length ?? 0),
  };
}

/**
 * Normalizes local preview data and public API data into the same safe shape.
 */
export function normalizeWebsiteDataset(
  input: Partial<WebsiteDataset> & Pick<WebsiteDataset, "school">,
): WebsiteDataset {
  const headerNavigation = cleanNavigation(
    input.headerNavigation?.length
      ? input.headerNavigation
      : input.navigation,
  );
  const footerNavigation = cleanNavigation(input.footerNavigation);

  const normalized: WebsiteDataset = {
    accountId: input.accountId,
    schoolId: input.schoolId || input.school.id,
    branchId: input.branchId || input.branch?.id,
    websiteSettingId: input.websiteSettingId,
    school: {
      ...input.school,
      name: input.school.name || "School",
    },
    branch: input.branch,
    branches: Array.isArray(input.branches) ? input.branches.filter(Boolean) : [],
    principal: input.principal,
    teachers: cleanPeople(input.teachers),
    academicStructures: cleanItems(input.academicStructures),
    classes: cleanItems(input.classes),
    programs: cleanItems(input.programs),
    subjects: cleanItems(input.subjects),
    organizations: cleanItems(input.organizations),
    highlights: cleanItems(input.highlights),
    announcements: cleanItems(input.announcements),
    events: cleanItems(input.events),
    gallery: Array.isArray(input.gallery) ? input.gallery.filter(Boolean) : [],
    statistics: emptyWebsiteStatistics(),
    navigation: headerNavigation,
    headerNavigation,
    footerNavigation,
    sections: Array.isArray(input.sections) ? input.sections.filter(Boolean) : [],
    generatedAt: Number(input.generatedAt || Date.now()),
  };

  normalized.statistics = deriveWebsiteStatistics({
    ...normalized,
    statistics: input.statistics,
  });

  return normalized;
}

export function websiteDatasetHasMeaningfulContent(
  dataset?: WebsiteDataset | null,
): boolean {
  if (!dataset) return false;

  return Boolean(
    dataset.school.name ||
      dataset.school.logo?.url ||
      dataset.school.banner?.url ||
      dataset.teachers.length ||
      dataset.programs.length ||
      dataset.subjects.length ||
      dataset.announcements.length ||
      dataset.events.length ||
      dataset.gallery.length,
  );
}
