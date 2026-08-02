/**
 * app/lib/websites/sections/sectionRegistry.ts
 * --------------------------------------------------------------------------
 * Global source of truth for website sections.
 */

import type {
  WebsiteSectionDefinition,
  WebsiteSectionDefinitionMap,
} from "./sectionTypes";
import type {
  WebsiteSectionKey,
  WebsiteTemplateSettings,
} from "../types";
import {
  DEFAULT_WEBSITE_SECTION_ORDER,
  WEBSITE_SECTION_DEFAULTS,
} from "./sectionDefaults";

function validateRegistry(
  definitions: readonly WebsiteSectionDefinition[],
) {
  const keys = new Set<string>();
  const aliases = new Set<string>();

  for (const definition of definitions) {
    if (keys.has(definition.key)) {
      throw new Error(
        `[website/sections] Duplicate section key: ${definition.key}`,
      );
    }

    keys.add(definition.key);

    for (const alias of definition.aliases ?? []) {
      if (keys.has(alias) || aliases.has(alias)) {
        throw new Error(
          `[website/sections] Duplicate section alias: ${alias}`,
        );
      }

      aliases.add(alias);
    }
  }

  const missing = DEFAULT_WEBSITE_SECTION_ORDER.filter(
    (key) => !keys.has(key),
  );

  if (missing.length) {
    throw new Error(
      `[website/sections] Missing definitions: ${missing.join(", ")}`,
    );
  }

  return definitions;
}

export const WEBSITE_SECTION_REGISTRY = validateRegistry(
  [...WEBSITE_SECTION_DEFAULTS].sort(
    (a, b) => a.defaultOrder - b.defaultOrder,
  ),
);

export const WEBSITE_SECTION_KEYS =
  WEBSITE_SECTION_REGISTRY.map(
    (definition) => definition.key,
  ) as WebsiteSectionKey[];

export const WEBSITE_SECTION_DEFINITION_MAP =
  Object.freeze(
    Object.fromEntries(
      WEBSITE_SECTION_REGISTRY.map((definition) => [
        definition.key,
        definition,
      ]),
    ),
  ) as WebsiteSectionDefinitionMap;

const WEBSITE_SECTION_ALIAS_MAP = new Map<string, WebsiteSectionKey>();

for (const definition of WEBSITE_SECTION_REGISTRY) {
  WEBSITE_SECTION_ALIAS_MAP.set(
    definition.key.toLowerCase(),
    definition.key,
  );

  for (const alias of definition.aliases ?? []) {
    WEBSITE_SECTION_ALIAS_MAP.set(
      alias.toLowerCase(),
      definition.key,
    );
  }
}

export function normalizeWebsiteSectionKey(
  value: unknown,
): WebsiteSectionKey | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  return WEBSITE_SECTION_ALIAS_MAP.get(normalized) ?? null;
}

export function getWebsiteSectionDefinition(
  value: WebsiteSectionKey | string,
) {
  const key = normalizeWebsiteSectionKey(value);

  return key
    ? WEBSITE_SECTION_DEFINITION_MAP[key]
    : undefined;
}

export function isWebsiteSectionKey(
  value: unknown,
): value is WebsiteSectionKey {
  return normalizeWebsiteSectionKey(value) !== null;
}

export function getWebsiteSectionLabel(
  key: WebsiteSectionKey,
  settings: WebsiteTemplateSettings,
) {
  const definition = WEBSITE_SECTION_DEFINITION_MAP[key];

  if (!definition.labelSetting) {
    return definition.defaultLabel;
  }

  const value = settings[definition.labelSetting];

  return typeof value === "string" && value.trim()
    ? value.trim()
    : definition.defaultLabel;
}

export function isWebsiteSectionVisible(
  key: WebsiteSectionKey,
  settings: WebsiteTemplateSettings,
) {
  const definition = WEBSITE_SECTION_DEFINITION_MAP[key];
  return settings[definition.visibilitySetting] !== false;
}

export function resolveWebsiteSectionOrder(
  settings?: Partial<WebsiteTemplateSettings> | null,
): WebsiteSectionKey[] {
  const requested = Array.isArray(settings?.sectionOrder)
    ? settings.sectionOrder
    : [];

  const normalized = requested
    .map(normalizeWebsiteSectionKey)
    .filter(
      (key): key is WebsiteSectionKey => Boolean(key),
    );

  const unique = [...new Set(normalized)];

  for (const key of DEFAULT_WEBSITE_SECTION_ORDER) {
    if (!unique.includes(key)) {
      unique.push(key);
    }
  }

  return unique;
}

export function getVisibleWebsiteSections(
  settings: WebsiteTemplateSettings,
) {
  return resolveWebsiteSectionOrder(settings)
    .filter((key) => isWebsiteSectionVisible(key, settings))
    .map((key) => WEBSITE_SECTION_DEFINITION_MAP[key]);
}

export function getWebsiteNavigationSections(
  settings: WebsiteTemplateSettings,
) {
  return getVisibleWebsiteSections(settings).filter(
    (definition) =>
      definition.navigationMode === "always" ||
      (
        definition.navigationMode === "when_visible" &&
        definition.capability.supportsNavigation
      ),
  );
}

export {
  DEFAULT_WEBSITE_SECTION_ORDER,
  WEBSITE_SECTION_DEFAULTS,
} from "./sectionDefaults";

export type {
  WebsiteSectionCapability,
  WebsiteSectionDataKey,
  WebsiteSectionDefinition,
  WebsiteSectionDefinitionMap,
  WebsiteSectionLabelSetting,
  WebsiteSectionNavigationMode,
  WebsiteSectionRegistry,
  WebsiteSectionVisibilitySetting,
} from "./sectionTypes";
