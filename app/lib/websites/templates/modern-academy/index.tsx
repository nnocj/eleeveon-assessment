"use client";

import React from "react";

import type {
  WebsiteTemplateDefinition,
  WebsiteTemplateRenderProps,
} from "../../types";

export function ModernAcademyTemplate({
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
    "Learning today. Leading tomorrow.";

  const description =
    draft.description ||
    data?.school.description ||
    "A modern school community helping every learner grow with knowledge, confidence and character.";

  const logo =
    data?.branch?.logo ||
    data?.school.logo;

  const heroImage =
    data?.branch?.banner ||
    data?.school.banner ||
    data?.gallery?.[0];

  return (
    <div
      className={`actual-website-template modern-academy ${
        compact ? "compact" : ""
      }`}
      style={
        {
          "--template-primary":
            primaryColor || "#2563eb",
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
                width: 40,
                height: 40,
                objectFit: "cover",
                borderRadius: 11,
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
                borderRadius: 11,
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
          <span>Home</span>
          <span>About</span>
          <span>Academics</span>
          <span>Contact</span>
        </nav>
      </header>

      <section className="template-hero">
        <div>
          <small>{resolvedBranch}</small>

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
              Apply Now
            </button>
          </div>
        </div>

        <div className="template-image-placeholder">
          {heroImage?.url ? (
            <img
              src={heroImage.url}
              alt={
                heroImage.alt ||
                `${name} campus`
              }
              style={{
                width: "100%",
                height: "100%",
                minHeight: 150,
                objectFit: "cover",
                borderRadius: 16,
              }}
            />
          ) : (
            <span>School hero image</span>
          )}
        </div>
      </section>

      <section className="template-feature-grid">
        <article>
          <b>Academic Excellence</b>
          <small>
            Strong subjects, programmes and learning pathways
          </small>
        </article>

        <article>
          <b>Whole-child Growth</b>
          <small>
            Character, creativity and confidence
          </small>
        </article>

        <article>
          <b>Connected Community</b>
          <small>
            Parents, teachers and learners working together
          </small>
        </article>
      </section>
    </div>
  );
}

export const websiteTemplate: WebsiteTemplateDefinition = {
  key: "modern_academy",
  name: "Modern Academy",
  version: "1.1.0",
  category: "modern",
  tone: "Modern · spacious · premium",
  description:
    "A clean, image-led single-page school website with strong academic, admissions and community sections.",

  defaultSections: [
    "hero",
    "statistics",
    "about",
    "principal",
    "programmes",
    "subjects",
    "why_choose_us",
    "teachers",
    "announcements",
    "events",
    "gallery",
    "contact",
  ],

  component: ModernAcademyTemplate,
};

export default websiteTemplate;