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

export function ClassicSchoolTemplate({
  dataset,
  settings,
  compact = false,
  previewMode = false,
}: WebsiteTemplateComponentProps) {
  const name =
    dataset.website?.siteName ||
    dataset.school.name ||
    "Your School";

  const motto =
    settings.heroHeading ||
    dataset.website?.tagline ||
    dataset.school.motto ||
    "Excellence, Character and Service";

  const description =
    settings.heroBody ||
    dataset.website?.description ||
    dataset.school.description ||
    "An established learning institution committed to disciplined scholarship, character and service.";

  const logo = dataset.branch?.logo || dataset.school.logo;
  const sections = getVisibleWebsiteSections(settings);

  return (
    <div
      className={`website-template classic-school ${
        compact ? "compact" : ""
      } ${previewMode ? "preview" : ""}`}
      style={
        {
          "--website-primary": "#1e3a5f",
          "--website-radius": "8px",
          fontFamily: "Georgia, 'Times New Roman', serif",
        } as React.CSSProperties
      }
    >
      <div
        style={{
          background: "var(--website-primary)",
          color: "#fff",
          textAlign: "center",
          padding: "8px 16px",
          fontSize: 13,
        }}
      >
        {dataset.branch?.name || "Main Campus"} · {motto}
      </div>

      <header style={{ ...container(settings.contentWidth), padding: "20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {settings.showLogo && logo?.url ? (
            <img
              src={logo.url}
              alt={logo.alt || `${name} logo`}
              style={{
                width: 52,
                height: 52,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          ) : (
            <span
              style={{
                width: 52,
                height: 52,
                display: "grid",
                placeItems: "center",
                border: "2px solid var(--website-primary)",
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
            borderTop: "4px double var(--website-primary)",
            borderBottom: "1px solid #d7dde5",
            textAlign: "center",
          }}
        >
          <div style={container(settings.contentWidth)}>
            <small style={{ letterSpacing: ".16em", fontWeight: 700 }}>
              {settings.heroEyebrow || "WELCOME TO"}
            </small>

            <h1
              style={{
                margin: "14px auto",
                maxWidth: 900,
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 1.05,
              }}
            >
              {name}
            </h1>

            <p
              style={{
                maxWidth: 760,
                margin: "0 auto",
                fontSize: 18,
                lineHeight: 1.8,
              }}
            >
              {description}
            </p>
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
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <div style={container(settings.contentWidth)}>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 46px)" }}>
                {getWebsiteSectionLabel(section.key, settings)}
              </h2>
            </div>
          </section>
        ))}

      {settings.showFooter ? (
        <footer
          style={{
            background: "var(--website-primary)",
            color: "#fff",
            borderTop: "4px double #fff",
          }}
        >
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
  key: "classic_school",
  name: "Classic School",
  version: "2.0.0",
  category: "institutional",
  tone: "Formal · trusted · structured",
  description:
    "A formal institutional website for established schools, academies and mission schools.",
  defaults: {
    contentWidth: "standard",
    density: "comfortable",
    sectionSpacing: "standard",
    headerVariant: "institutional",
    heroVariant: "banner",
    statisticsVariant: "inline",
    teacherVariant: "compact_list",
    galleryVariant: "grid",
    footerVariant: "institutional",
  },
  component: ClassicSchoolTemplate,
};

export default websiteTemplate;
