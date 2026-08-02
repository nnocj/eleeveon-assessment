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

export function BoldCampusTemplate({
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
    "Learn boldly. Grow fully.";

  const description =
    settings.heroBody ||
    dataset.website?.description ||
    dataset.school.description ||
    "A vibrant learning community where knowledge, creativity and opportunity come alive.";

  const logo = dataset.branch?.logo || dataset.school.logo;
  const heroImage =
    dataset.branch?.banner ||
    dataset.school.banner ||
    dataset.gallery[0];

  const sections = getVisibleWebsiteSections(settings);

  return (
    <div
      className={`website-template bold-campus ${
        compact ? "compact" : ""
      } ${previewMode ? "preview" : ""}`}
      style={
        {
          "--website-primary": "#7c3aed",
          "--website-radius": "22px",
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
                width: 48,
                height: 48,
                objectFit: "cover",
                borderRadius: 14,
              }}
            />
          ) : (
            <span
              style={{
                width: 48,
                height: 48,
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

          <div>
            <strong style={{ display: "block" }}>{name}</strong>
            {settings.showBranchName && dataset.branch?.name ? (
              <small>{dataset.branch.name}</small>
            ) : null}
          </div>
        </div>
      </header>

      {settings.showHero ? (
        <section
          id="hero"
          style={{
            padding: sectionPadding(settings.sectionSpacing),
            background:
              "linear-gradient(145deg, color-mix(in srgb, var(--website-primary) 16%, #fff), #fff)",
          }}
        >
          <div
            style={{
              ...container(settings.contentWidth),
              display: "grid",
              gridTemplateColumns:
                settings.heroVariant === "centered"
                  ? "1fr"
                  : "1.15fr .85fr",
              gap: 28,
              alignItems: "center",
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-flex",
                  padding: "7px 11px",
                  borderRadius: 999,
                  background: "var(--website-primary)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                {settings.heroEyebrow ||
                  dataset.branch?.name ||
                  "School Community"}
              </span>

              <h1
                style={{
                  margin: "16px 0 12px",
                  fontSize: "clamp(42px, 7vw, 86px)",
                  lineHeight: 0.98,
                }}
              >
                {tagline}
              </h1>

              <p style={{ maxWidth: 700, fontSize: 19, lineHeight: 1.7 }}>
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
                  borderRadius: 28,
                }}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {sections
        .filter((section) => !["hero", "footer"].includes(section.key))
        .map((section) => (
          <section
            key={section.key}
            id={section.key}
            style={{
              padding: sectionPadding(settings.sectionSpacing),
            }}
          >
            <div style={container(settings.contentWidth)}>
              <h2 style={{ fontSize: "clamp(30px, 5vw, 52px)", margin: 0 }}>
                {getWebsiteSectionLabel(section.key, settings)}
              </h2>
            </div>
          </section>
        ))}

      {settings.showFooter ? (
        <footer style={{ background: "#111827", color: "#fff" }}>
          <div
            style={{
              ...container(settings.contentWidth),
              padding: "34px 0",
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
  key: "bold_campus",
  name: "Bold Campus",
  version: "2.0.0",
  category: "energetic",
  tone: "Bright · bold · active",
  description:
    "A lively, high-energy school website with bold typography, strong colour and immersive media.",
  defaults: {
    contentWidth: "wide",
    density: "compact",
    sectionSpacing: "standard",
    headerVariant: "bold",
    heroVariant: "full_bleed",
    statisticsVariant: "large_numbers",
    teacherVariant: "portrait_cards",
    galleryVariant: "masonry",
    footerVariant: "dark",
  },
  component: BoldCampusTemplate,
};

export default websiteTemplate;
