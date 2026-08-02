"use client";

/**
 * app/lib/websites/sections/WebsiteSectionRenderer.tsx
 * --------------------------------------------------------------------------
 * Shared data-only section renderer.
 *
 * It never queries Dexie, fetches the backend or resolves tenant context.
 * It receives normalized data and shared settings only.
 */

import React from "react";

import type {
  WebsiteDataset,
  WebsiteItem,
  WebsiteMedia,
  WebsitePerson,
  WebsiteSectionKey,
  WebsiteTemplateSettings,
} from "../types";

import {
  getWebsiteSectionLabel,
  isWebsiteSectionVisible,
  resolveWebsiteSectionOrder,
} from "./sectionRegistry";

import {
  ContactSection,
  ContentSection,
  FooterSection,
  GallerySection,
  HeroSection,
  ItemGridSection,
  PeopleSection,
  PrincipalSection,
  StatisticsSection,
} from "../components";

export type WebsiteSectionRendererProps = {
  dataset: WebsiteDataset;
  settings: WebsiteTemplateSettings;
  sectionKey?: WebsiteSectionKey;
  className?: string;
};

function itemsForSection(
  key: WebsiteSectionKey,
  dataset: WebsiteDataset,
): WebsiteItem[] {
  switch (key) {
    case "academic_structures":
      return dataset.academicStructures;
    case "programs":
    case "programmes":
      return dataset.programs;
    case "subjects":
      return dataset.subjects;
    case "organizations":
      return dataset.organizations;
    case "highlights":
      return dataset.highlights;
    case "announcements":
      return dataset.announcements;
    case "events":
      return dataset.events;
    default:
      return [];
  }
}

function renderSection(
  key: WebsiteSectionKey,
  dataset: WebsiteDataset,
  settings: WebsiteTemplateSettings,
) {
  const label = getWebsiteSectionLabel(
    key,
    settings,
  );

  switch (key) {
    case "hero":
      return (
        <HeroSection
          dataset={dataset}
          settings={settings}
        />
      );

    case "statistics":
      return (
        <StatisticsSection
          title={label}
          statistics={dataset.statistics}
          settings={settings}
        />
      );

    case "about":
      return (
        <ContentSection
          id="about"
          title={label}
          body={
            settings.aboutText ||
            dataset.website?.description ||
            dataset.school.description ||
            dataset.school.motto ||
            ""
          }
          media={
            dataset.school.banner ||
            dataset.branch?.banner
          }
        />
      );

    case "principal":
      return (
        <PrincipalSection
          title={label}
          principal={dataset.principal}
          message={settings.principalMessage}
          showPhoto={settings.showPrincipalPhoto}
        />
      );

    case "teachers":
      return (
        <PeopleSection
          id="teachers"
          title={label}
          people={dataset.teachers}
          showPhotos={settings.showTeacherPhotos}
          variant={settings.teacherVariant}
        />
      );

    case "gallery":
      return (
        <GallerySection
          title={label}
          media={dataset.gallery}
          variant={settings.galleryVariant}
        />
      );

    case "contact":
      return (
        <ContactSection
          title={label}
          dataset={dataset}
          settings={settings}
        />
      );

    case "footer":
      return (
        <FooterSection
          dataset={dataset}
          settings={settings}
        />
      );

    default:
      return (
        <ItemGridSection
          id={key}
          title={label}
          items={itemsForSection(key, dataset)}
          showCodes={
            key === "subjects"
              ? settings.showSubjectCodes
              : true
          }
          showDescriptions={
            key === "programs" ||
            key === "programmes"
              ? settings.showProgramDescriptions
              : true
          }
        />
      );
  }
}

export default function WebsiteSectionRenderer({
  dataset,
  settings,
  sectionKey,
  className,
}: WebsiteSectionRendererProps) {
  const keys = sectionKey
    ? [sectionKey]
    : resolveWebsiteSectionOrder(settings);

  return (
    <div
      className={[
        "website-section-renderer",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {keys
        .filter((key) =>
          isWebsiteSectionVisible(
            key,
            settings,
          ),
        )
        .map((key) => (
          <React.Fragment key={key}>
            {renderSection(
              key,
              dataset,
              settings,
            )}
          </React.Fragment>
        ))}
    </div>
  );
}
