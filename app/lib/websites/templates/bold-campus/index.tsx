"use client";

import React from "react";
import type { WebsiteTemplateDefinition, WebsiteTemplateRenderProps } from "../../types";

export function BoldCampusTemplate({ draft, data, schoolName, branchName, primaryColor, compact = false }: WebsiteTemplateRenderProps) {
  const name = draft.siteName || data?.school.name || schoolName || "Your School";
  const resolvedBranch = data?.branch?.name || branchName;
  return (
    <div className={`actual-website-template bold-campus ${compact ? "compact" : ""}`} style={{ "--template-primary": primaryColor || "#7c3aed" } as React.CSSProperties}>
      <header><strong>{name}</strong><button>Enquire</button></header>
      <section className="bold-hero"><span>{resolvedBranch || "Main Campus"}</span><h3>{draft.tagline || "Learn boldly. Grow fully."}</h3><p>{draft.description || "A vibrant campus where learning, creativity and community come alive."}</p></section>
      <section className="bold-links"><article>Explore Programmes</article><article>Campus Life</article><article>Upcoming Events</article><article>Admissions</article></section>
    </div>
  );
}

export const websiteTemplate: WebsiteTemplateDefinition = {
  key: "bold_campus", name: "Bold Campus", version: "1.0.0", category: "energetic", tone: "Bright · compact · active",
  description: "A lively, compact design for schools that want energetic colour and quick actions.",
  defaultSections: ["Hero", "Quick Links", "Campus Life", "Programmes", "Events", "Gallery", "Enquire"],
  component: BoldCampusTemplate,
};

export default websiteTemplate;
