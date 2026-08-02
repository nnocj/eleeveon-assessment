/**
 * app/lib/websites/sections/sectionTypes.ts
 * --------------------------------------------------------------------------
 * Shared contracts for the global website section registry.
 *
 * Every template uses the same section model. Templates may change layout,
 * spacing and visual variants, but they do not define a separate data model.
 */

import type {
  WebsiteSectionKey,
  WebsiteSectionSourceType,
  WebsiteTemplateSettings,
} from "../types";

export type WebsiteSectionVisibilitySetting = {
  [K in keyof WebsiteTemplateSettings]:
    WebsiteTemplateSettings[K] extends boolean ? K : never;
}[keyof WebsiteTemplateSettings];

export type WebsiteSectionLabelSetting = {
  [K in keyof WebsiteTemplateSettings]:
    WebsiteTemplateSettings[K] extends string ? K : never;
}[keyof WebsiteTemplateSettings];

export type WebsiteSectionNavigationMode =
  | "always"
  | "when_visible"
  | "never";

export type WebsiteSectionDataKey =
  | "website"
  | "school"
  | "branch"
  | "statistics"
  | "principal"
  | "academicStructures"
  | "programs"
  | "subjects"
  | "organizations"
  | "teachers"
  | "highlights"
  | "announcements"
  | "events"
  | "gallery"
  | "contact"
  | "footer";

export type WebsiteSectionCapability = {
  supportsMedia: boolean;
  supportsCustomHeading: boolean;
  supportsCustomBody: boolean;
  supportsVariant: boolean;
  supportsOrdering: boolean;
  supportsNavigation: boolean;
};

export type WebsiteSectionDefinition = {
  key: WebsiteSectionKey;
  aliases?: readonly string[];

  defaultLabel: string;
  defaultNavigationLabel?: string;
  description: string;

  sourceType: WebsiteSectionSourceType | "statistics" | "principal" | "contact" | "footer";
  dataKey: WebsiteSectionDataKey;

  visibilitySetting: WebsiteSectionVisibilitySetting;
  labelSetting?: WebsiteSectionLabelSetting;

  navigationMode: WebsiteSectionNavigationMode;
  defaultVisible: boolean;
  defaultOrder: number;

  capability: WebsiteSectionCapability;
};

export type WebsiteSectionRegistry = readonly WebsiteSectionDefinition[];

export type WebsiteSectionDefinitionMap = Readonly<
  Record<WebsiteSectionKey, WebsiteSectionDefinition>
>;
