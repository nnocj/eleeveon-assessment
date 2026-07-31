"use client";

/** Renders the actual selected template component, not a generic imitation. */
import React from "react";
import { getWebsiteTemplate } from "../templates/registry";
import type { WebsiteSettingsDraft } from "../types";

export default function WebsitePreview(props: { draft: WebsiteSettingsDraft; schoolName?: string; branchName?: string; primaryColor?: string }) {
  const template = getWebsiteTemplate(props.draft.templateKey);
  if (!template) return <div className="website-template-empty">No website templates are installed.</div>;
  const TemplateComponent = template.component;
  return <TemplateComponent {...props} compact />;
}
