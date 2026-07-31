"use client";

import React from "react";
import type { WebsiteTemplateDefinition, WebsiteTemplateRenderProps } from "../../types";

export function ClassicSchoolTemplate({ draft, data, schoolName, branchName, primaryColor, compact = false }: WebsiteTemplateRenderProps) {
  const name = draft.siteName || data?.school.name || schoolName || "Your School";
  const resolvedBranch = data?.branch?.name || branchName;
  return (
    <div className={`actual-website-template classic-school ${compact ? "compact" : ""}`} style={{ "--template-primary": primaryColor || "#1e3a5f" } as React.CSSProperties}>
      <div className="classic-topline">{resolvedBranch || "Main Campus"} · Excellence, Character and Service</div>
      <header><strong>{name}</strong><nav><span>School</span><span>Academics</span><span>Admissions</span><span>News</span></nav></header>
      <section className="classic-banner"><small>WELCOME TO</small><h3>{name}</h3><p>{draft.description || "An established learning institution committed to disciplined scholarship and service."}</p><button>Read Our Story</button></section>
      <section className="classic-columns"><article><b>Headteacher's Welcome</b><p>{draft.tagline || "Building knowledge, integrity and purpose."}</p></article><article><b>Admissions</b><p>Requirements, process and important dates.</p></article></section>
    </div>
  );
}

export const websiteTemplate: WebsiteTemplateDefinition = {
  key: "classic_school", name: "Classic School", version: "1.0.0", category: "institutional", tone: "Formal · trusted · structured",
  description: "A formal institutional layout suited to established schools and mission schools.",
  defaultSections: ["Welcome", "School Profile", "Leadership", "Academics", "Admissions", "Announcements", "Contact"],
  component: ClassicSchoolTemplate,
};

export default websiteTemplate;
