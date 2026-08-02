/**
 * Runtime access to actual website template modules.
 *
 * Templates now define visual defaults only. The global section registry owns
 * the supported website data model and section inventory.
 */

import type React from "react";

import type {
  WebsiteTemplateComponentProps,
  WebsiteTemplateDefinition,
} from "../types";
import { WEBSITE_SECTION_KEYS } from "../sections/sectionRegistry";
import { GENERATED_WEBSITE_TEMPLATES } from "./registry.generated";

type WebsiteTemplateDefinitionV2 = Omit<
  WebsiteTemplateDefinition,
  "component" | "defaultSections"
> & {
  component: React.ComponentType<WebsiteTemplateComponentProps>;
};

function validateTemplates(
  input: readonly WebsiteTemplateDefinitionV2[],
) {
  const keys = new Set<string>();

  return input.filter((template) => {
    if (!template?.key || !template?.name || !template?.component) {
      return false;
    }

    if (keys.has(template.key)) {
      console.error(
        `[website/templates] Duplicate template key: ${template.key}`,
      );
      return false;
    }

    keys.add(template.key);
    return true;
  });
}

const validatedTemplates = validateTemplates(
  GENERATED_WEBSITE_TEMPLATES,
);

export const WEBSITE_TEMPLATE_REGISTRY: WebsiteTemplateDefinition[] =
  validatedTemplates.map((template) => ({
    ...template,

    /**
     * Temporary compatibility for older settings UI code.
     * Individual templates no longer own this list.
     */
    defaultSections: [...WEBSITE_SECTION_KEYS],
  }));

export function getWebsiteTemplates() {
  return WEBSITE_TEMPLATE_REGISTRY;
}

export function getDefaultWebsiteTemplate() {
  return WEBSITE_TEMPLATE_REGISTRY[0];
}

export function getWebsiteTemplate(key?: string | null) {
  return (
    WEBSITE_TEMPLATE_REGISTRY.find(
      (template) => template.key === key,
    ) || getDefaultWebsiteTemplate()
  );
}
