"use client";

import React from "react";

import type {
  WebsiteTemplateDefinition,
  WebsiteTemplateRenderProps,
} from "../../types";

export function ClassicSchoolTemplate({
  draft,
  data,
  schoolName,
  branchName,
  primaryColor,
  compact = false,
}: WebsiteTemplateRenderProps) {
  const name =
    draft.siteName ||
    data?.school.name ||
    schoolName ||
    "Your School";

  const resolvedBranch =
    data?.branch?.name ||
    branchName ||
    "Main Campus";

  const motto =
    draft.tagline ||
    data?.school.motto ||
    "Excellence, Character and Service";

  const description =
    draft.description ||
    data?.school.description ||
    "An established learning institution committed to disciplined scholarship, strong character and service.";

  const logo =
    data?.branch?.logo ||
    data?.school.logo;

  const principal =
    data?.principal;

  return (
    <div
      className={`actual-website-template classic-school ${
        compact ? "compact" : ""
      }`}
      style={
        {
          "--template-primary":
            primaryColor || "#1e3a5f",
        } as React.CSSProperties
      }
    >
      <div className="classic-topline">
        {resolvedBranch} · {motto}
      </div>

      <header>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          {logo?.url ? (
            <img
              src={logo.url}
              alt={logo.alt || `${name} logo`}
              style={{
                width: 40,
                height: 40,
                objectFit: "cover",
                borderRadius: 8,
                flexShrink: 0,
              }}
            />
          ) : (
            <span
              style={{
                width: 40,
                height: 40,
                display: "grid",
                placeItems: "center",
                borderRadius: 8,
                background:
                  "var(--template-primary)",
                color: "#fff",
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}

          <div style={{ minWidth: 0 }}>
            <strong
              style={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </strong>

            <small
              style={{
                display: "block",
                color: "var(--muted, #64748b)",
              }}
            >
              {resolvedBranch}
            </small>
          </div>
        </div>

        <nav>
          <span>School</span>
          <span>Academics</span>
          <span>Admissions</span>
          <span>News</span>
        </nav>
      </header>

      <section className="classic-banner">
        <small>WELCOME TO</small>

        <h3>{name}</h3>

        <p>{description}</p>

        <button type="button">
          Read Our Story
        </button>
      </section>

      <section className="classic-columns">
        <article>
          <b>Headteacher&apos;s Welcome</b>

          <p>
            {principal?.bio ||
              `Welcome to ${name}. We are committed to helping every learner grow in knowledge, integrity and purpose.`}
          </p>

          {principal?.name ? (
            <small
              style={{
                display: "block",
                marginTop: 8,
                color:
                  "var(--template-primary)",
                fontWeight: 800,
              }}
            >
              {principal.name}
            </small>
          ) : null}
        </article>

        <article>
          <b>Admissions</b>

          <p>
            Discover our programmes, requirements,
            application process and important dates.
          </p>
        </article>
      </section>
    </div>
  );
}

export const websiteTemplate: WebsiteTemplateDefinition = {
  key: "classic_school",
  name: "Classic School",
  version: "1.1.0",
  category: "institutional",
  tone: "Formal · trusted · structured",
  description:
    "A formal institutional single-page website suited to established schools, academies and mission schools.",

  defaultSections: [
    "hero",
    "statistics",
    "about",
    "principal",
    "academic_structures",
    "programmes",
    "subjects",
    "leadership",
    "teachers",
    "announcements",
    "events",
    "gallery",
    "contact",
  ],

  component: ClassicSchoolTemplate,
};

export default websiteTemplate;