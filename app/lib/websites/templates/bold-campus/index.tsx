"use client";

import React from "react";

import type {
  WebsiteTemplateDefinition,
  WebsiteTemplateRenderProps,
} from "../../types";

export function BoldCampusTemplate({
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

  const tagline =
    draft.tagline ||
    data?.school.motto ||
    "Learn boldly. Grow fully.";

  const description =
    draft.description ||
    data?.school.description ||
    "A vibrant learning community where knowledge, creativity, character and opportunity come alive.";

  const logo =
    data?.branch?.logo ||
    data?.school.logo;

  const subjectsCount =
    data?.subjects?.length || 0;

  const teachersCount =
    data?.teachers?.length || 0;

  return (
    <div
      className={`actual-website-template bold-campus ${
        compact ? "compact" : ""
      }`}
      style={
        {
          "--template-primary":
            primaryColor || "#7c3aed",
        } as React.CSSProperties
      }
    >
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
                width: 38,
                height: 38,
                borderRadius: 10,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
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

        <button type="button">
          Enquire
        </button>
      </header>

      <section className="bold-hero">
        <span>{resolvedBranch}</span>

        <h3>{tagline}</h3>

        <p>{description}</p>

        <div className="template-actions">
          <button type="button">
            Explore School
          </button>

          <button
            type="button"
            className="ghost"
          >
            Contact Us
          </button>
        </div>
      </section>

      {(subjectsCount > 0 ||
        teachersCount > 0) && (
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: 8,
            padding: "0 12px 12px",
          }}
        >
          {subjectsCount > 0 ? (
            <article
              style={{
                padding: 12,
                borderRadius: 12,
                background:
                  "var(--surface-2, rgba(15,23,42,.04))",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color:
                    "var(--template-primary)",
                  fontSize: "1.1rem",
                }}
              >
                {subjectsCount}
              </strong>

              <small>Subjects</small>
            </article>
          ) : null}

          {teachersCount > 0 ? (
            <article
              style={{
                padding: 12,
                borderRadius: 12,
                background:
                  "var(--surface-2, rgba(15,23,42,.04))",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color:
                    "var(--template-primary)",
                  fontSize: "1.1rem",
                }}
              >
                {teachersCount}
              </strong>

              <small>Teachers</small>
            </article>
          ) : null}
        </section>
      )}

      <section className="bold-links">
        <article>Explore Programmes</article>
        <article>Campus Life</article>
        <article>Upcoming Events</article>
        <article>Admissions</article>
      </section>
    </div>
  );
}

export const websiteTemplate: WebsiteTemplateDefinition = {
  key: "bold_campus",
  name: "Bold Campus",
  version: "1.1.0",
  category: "energetic",
  tone: "Bright · bold · active",
  description:
    "A lively single-page school website with strong branding, quick navigation and dynamic school content.",

  defaultSections: [
    "hero",
    "statistics",
    "about",
    "principal",
    "programmes",
    "subjects",
    "school_life",
    "teachers",
    "announcements",
    "events",
    "gallery",
    "contact",
  ],

  component: BoldCampusTemplate,
};

export default websiteTemplate;