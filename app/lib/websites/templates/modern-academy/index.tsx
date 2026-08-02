"use client";

import React from "react";

import type {
  WebsiteTemplateComponentProps,
  WebsiteTemplateDefinition,
} from "../../types";
import {
  getVisibleWebsiteSections,
  getWebsiteSectionLabel,
} from "../../sections/sectionRegistry";

type WebsiteTemplateDefinitionV2 = Omit<
  WebsiteTemplateDefinition,
  "component" | "defaultSections"
> & {
  component: React.ComponentType<WebsiteTemplateComponentProps>;
};

function container(width: "narrow" | "standard" | "wide" | "full") {
  const pixels =
    width === "narrow"
      ? 840
      : width === "wide"
        ? 1240
        : width === "full"
          ? 1440
          : 1080;

  return {
    width: `min(${pixels}px, calc(100% - 32px))`,
    margin: "0 auto",
  } as React.CSSProperties;
}

function sectionPadding(
  value: "compact" | "standard" | "spacious",
) {
  return value === "compact"
    ? "36px 0"
    : value === "spacious"
      ? "76px 0"
      : "54px 0";
}

export function ModernAcademyTemplate({
  dataset,
  settings,
  compact = false,
  previewMode = false,
}: WebsiteTemplateComponentProps) {
  const name =
    dataset.website?.siteName ||
    dataset.school.name ||
    "Your School";

  const tagline =
    settings.heroHeading ||
    dataset.website?.tagline ||
    dataset.school.motto ||
    "Learning today. Leading tomorrow.";

  const description =
    settings.heroBody ||
    dataset.website?.description ||
    dataset.school.description ||
    "A modern school community helping every learner grow with knowledge, confidence and character.";

  const logo = dataset.branch?.logo || dataset.school.logo;
  const heroImage =
    dataset.branch?.banner ||
    dataset.school.banner ||
    dataset.gallery[0];

  const sections = getVisibleWebsiteSections(settings);

  return (
    <div
      className={`website-template modern-academy ${
        compact ? "compact" : ""
      } ${previewMode ? "preview" : ""}`}
      style={
        {
          "--website-primary": "#2563eb",
          "--website-radius": "18px",
          fontFamily: "Inter, system-ui, sans-serif",
        } as React.CSSProperties
      }
    >
      <header style={{ ...container(settings.contentWidth), padding: "18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {settings.showLogo && logo?.url ? (
            <img
              src={logo.url}
              alt={logo.alt || `${name} logo`}
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                objectFit: "cover",
              }}
            />
          ) : (
            <span
              style={{
                width: 46,
                height: 46,
                display: "grid",
                placeItems: "center",
                borderRadius: 14,
                background: "var(--website-primary)",
                color: "#fff",
                fontWeight: 900,
              }}
            >
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}

          <strong>{name}</strong>
        </div>
      </header>

      {settings.showHero ? (
        <section
          id="hero"
          style={{
            padding: sectionPadding(settings.sectionSpacing),
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--website-primary) 11%, #fff), #fff)",
          }}
        >
          <div
            style={{
              ...container(settings.contentWidth),
              display: "grid",
              gridTemplateColumns:
                settings.heroVariant === "centered"
                  ? "1fr"
                  : "1.1fr .9fr",
              gap: 30,
              alignItems: "center",
            }}
          >
            <div>
              <small
                style={{
                  color: "var(--website-primary)",
                  fontWeight: 800,
                }}
              >
                {settings.heroEyebrow ||
                  dataset.branch?.name ||
                  "MODERN LEARNING COMMUNITY"}
              </small>

              <h1
                style={{
                  margin: "14px 0",
                  fontSize: "clamp(42px, 6vw, 76px)",
                  lineHeight: 1.02,
                }}
              >
                {tagline}
              </h1>

              <p style={{ maxWidth: 680, fontSize: 18, lineHeight: 1.7 }}>
                {description}
              </p>
            </div>

            {settings.showHeroImage && heroImage?.url ? (
              <img
                src={heroImage.url}
                alt={heroImage.alt || name}
                style={{
                  width: "100%",
                  minHeight: 320,
                  maxHeight: 520,
                  objectFit: "cover",
                  borderRadius: 24,
                  boxShadow: "0 24px 70px rgba(15, 23, 42, .15)",
                }}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {sections
        .filter((section) => !["hero", "footer"].includes(section.key))
        .map((section, index) => (
          <section
            key={section.key}
            id={section.key}
            style={{
              padding: sectionPadding(settings.sectionSpacing),
              background: index % 2 ? "#f8fafc" : "#fff",
            }}
          >
            <div style={container(settings.contentWidth)}>
              <h2 style={{ fontSize: "clamp(30px, 4vw, 50px)", margin: 0 }}>
                {getWebsiteSectionLabel(section.key, settings)}
              </h2>
            </div>
          </section>
        ))}

      {settings.showFooter ? (
        <footer style={{ borderTop: "1px solid #e2e8f0" }}>
          <div
            style={{
              ...container(settings.contentWidth),
              padding: "38px 0",
            }}
          >
            <strong>{name}</strong>
            <p>{settings.footerText}</p>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

export const websiteTemplate: WebsiteTemplateDefinitionV2 = {
  key: "modern_academy",
  name: "Modern Academy",
  version: "2.0.0",
  category: "modern",
  tone: "Modern · spacious · premium",
  description:
    "A polished image-led school website with spacious sections and strong admissions presentation.",
  defaults: {
    contentWidth: "wide",
    density: "comfortable",
    sectionSpacing: "spacious",
    headerVariant: "standard",
    heroVariant: "split",
    statisticsVariant: "cards",
    teacherVariant: "cards",
    galleryVariant: "grid",
    footerVariant: "columns",
  },
  component: ModernAcademyTemplate,
};

export default websiteTemplate;
