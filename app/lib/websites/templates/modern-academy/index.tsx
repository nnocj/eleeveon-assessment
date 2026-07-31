"use client";

import React from "react";
import type { WebsiteTemplateDefinition, WebsiteTemplateRenderProps } from "../../types";

export function ModernAcademyTemplate({ draft, data, schoolName, branchName, primaryColor, compact = false }: WebsiteTemplateRenderProps) {
  const name = draft.siteName || data?.school.name || schoolName || "Your School";
  const resolvedBranch = data?.branch?.name || branchName;
  return (
    <div className={`actual-website-template modern-academy ${compact ? "compact" : ""}`} style={{ "--template-primary": primaryColor || "#2563eb" } as React.CSSProperties}>
      <header><strong>{name}</strong><nav><span>Home</span><span>About</span><span>Admissions</span><span>Contact</span></nav></header>
      <section className="template-hero">
        <div><small>{resolvedBranch || "Main Campus"}</small><h3>{draft.tagline || "Learning today. Leading tomorrow."}</h3><p>{draft.description || "A modern school community helping every learner grow with confidence."}</p><div className="template-actions"><button>Explore School</button><button className="ghost">Apply Now</button></div></div>
        <div className="template-image-placeholder"><span>Hero image</span></div>
      </section>
      <section className="template-feature-grid"><article><b>Academic Excellence</b><small>Strong learning pathways</small></article><article><b>Whole-child Growth</b><small>Character and confidence</small></article><article><b>Connected Community</b><small>Parents, teachers and learners</small></article></section>
    </div>
  );
}

export const websiteTemplate: WebsiteTemplateDefinition = {
  key: "modern_academy", name: "Modern Academy", version: "1.0.0", category: "modern", tone: "Modern · spacious · premium",
  description: "A clean, image-led school website with strong admissions and programme sections.",
  defaultSections: ["Hero", "About", "Programmes", "Why Choose Us", "Gallery", "News", "Contact"],
  component: ModernAcademyTemplate,
};

export default websiteTemplate;
