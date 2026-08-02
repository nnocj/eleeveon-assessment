"use client";

/**
 * app/lib/websites/components.tsx
 * --------------------------------------------------------------------------
 * Reusable presentational building blocks for website templates and the shared
 * section renderer. No component in this file performs data access.
 */

import React from "react";

import type {
  WebsiteDataset,
  WebsiteItem,
  WebsiteMedia,
  WebsitePerson,
  WebsiteStatistics,
  WebsiteTemplateSettings,
  WebsiteTeacherVariant,
  WebsiteGalleryVariant,
} from "./types";

function SectionShell({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="website-section"
    >
      <div className="website-section-inner">
        {eyebrow ? (
          <small className="website-section-eyebrow">
            {eyebrow}
          </small>
        ) : null}

        {title ? (
          <h2 className="website-section-title">
            {title}
          </h2>
        ) : null}

        {children}
      </div>
    </section>
  );
}

export function HeroSection({
  dataset,
  settings,
}: {
  dataset: WebsiteDataset;
  settings: WebsiteTemplateSettings;
}) {
  const schoolName =
    dataset.website?.siteName ||
    dataset.school.name;

  const heroImage =
    dataset.branch?.banner ||
    dataset.school.banner ||
    dataset.gallery[0];

  return (
    <section
      id="hero"
      className={`website-hero website-hero-${settings.heroVariant}`}
    >
      <div className="website-section-inner website-hero-inner">
        <div className="website-hero-copy">
          {settings.heroEyebrow ? (
            <small className="website-section-eyebrow">
              {settings.heroEyebrow}
            </small>
          ) : null}

          <h1>
            {settings.heroHeading ||
              dataset.website?.tagline ||
              dataset.school.motto ||
              schoolName}
          </h1>

          <p>
            {settings.heroBody ||
              dataset.website?.description ||
              dataset.school.description ||
              ""}
          </p>

          <div className="website-hero-actions">
            {settings.primaryActionLabel ? (
              <a
                href={settings.primaryActionHref || "#about"}
              >
                {settings.primaryActionLabel}
              </a>
            ) : null}

            {settings.secondaryActionLabel ? (
              <a
                href={settings.secondaryActionHref || "#contact"}
                className="secondary"
              >
                {settings.secondaryActionLabel}
              </a>
            ) : null}
          </div>
        </div>

        {settings.showHeroImage && heroImage?.url ? (
          <img
            src={heroImage.url}
            alt={heroImage.alt || schoolName}
            className="website-hero-image"
          />
        ) : null}
      </div>
    </section>
  );
}

export function StatisticsSection({
  title,
  statistics,
  settings,
}: {
  title: string;
  statistics: WebsiteStatistics;
  settings: WebsiteTemplateSettings;
}) {
  const values = [
    settings.showStudentCount
      ? ["Students", statistics.students]
      : null,
    settings.showTeacherCount
      ? ["Teachers", statistics.teachers]
      : null,
    settings.showClassCount
      ? ["Classes", statistics.classes]
      : null,
    settings.showSubjectCount
      ? ["Subjects", statistics.subjects]
      : null,
  ].filter(
    (
      item,
    ): item is [string, number] =>
      item !== null,
  );

  if (!values.length) return null;

  return (
    <SectionShell
      id="statistics"
      title={title}
    >
      <div
        className={`website-statistics website-statistics-${settings.statisticsVariant}`}
      >
        {values.map(([label, value]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function ContentSection({
  id,
  title,
  body,
  media,
}: {
  id: string;
  title: string;
  body?: string;
  media?: WebsiteMedia;
}) {
  if (!body && !media?.url) return null;

  return (
    <SectionShell
      id={id}
      title={title}
    >
      <div className="website-content-section">
        {body ? <p>{body}</p> : null}

        {media?.url ? (
          <img
            src={media.url}
            alt={media.alt || title}
          />
        ) : null}
      </div>
    </SectionShell>
  );
}

export function PrincipalSection({
  title,
  principal,
  message,
  showPhoto,
}: {
  title: string;
  principal?: WebsitePerson;
  message?: string;
  showPhoto: boolean;
}) {
  if (!principal && !message) return null;

  return (
    <SectionShell
      id="principal"
      title={title}
    >
      <article className="website-principal">
        {showPhoto && principal?.photo?.url ? (
          <img
            src={principal.photo.url}
            alt={principal.name}
          />
        ) : null}

        <div>
          <p>
            {message ||
              principal?.bio ||
              "Welcome to our school community."}
          </p>

          {principal?.name ? (
            <strong>{principal.name}</strong>
          ) : null}

          {principal?.title || principal?.role ? (
            <span>
              {principal.title || principal.role}
            </span>
          ) : null}
        </div>
      </article>
    </SectionShell>
  );
}

export function ItemGridSection({
  id,
  title,
  items,
  showCodes = true,
  showDescriptions = true,
}: {
  id: string;
  title: string;
  items: WebsiteItem[];
  showCodes?: boolean;
  showDescriptions?: boolean;
}) {
  if (!items.length) return null;

  return (
    <SectionShell
      id={id}
      title={title}
    >
      <div className="website-item-grid">
        {items.map((item, index) => (
          <article
            key={item.id || `${id}-${index}`}
          >
            {item.media?.url ? (
              <img
                src={item.media.url}
                alt={item.media.alt || item.title}
              />
            ) : null}

            {showCodes && item.subtitle ? (
              <small>{item.subtitle}</small>
            ) : null}

            <h3>{item.title}</h3>

            {showDescriptions && item.body ? (
              <p>{item.body}</p>
            ) : null}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function PeopleSection({
  id,
  title,
  people,
  showPhotos,
  variant,
}: {
  id: string;
  title: string;
  people: WebsitePerson[];
  showPhotos: boolean;
  variant: WebsiteTeacherVariant;
}) {
  if (!people.length) return null;

  return (
    <SectionShell
      id={id}
      title={title}
    >
      <div
        className={`website-people website-people-${variant}`}
      >
        {people.map((person, index) => (
          <article
            key={person.id || `${id}-${index}`}
          >
            {showPhotos && person.photo?.url ? (
              <img
                src={person.photo.url}
                alt={person.name}
              />
            ) : null}

            <h3>{person.name}</h3>

            {person.title || person.role ? (
              <p>{person.title || person.role}</p>
            ) : null}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function GallerySection({
  title,
  media,
  variant,
}: {
  title: string;
  media: WebsiteMedia[];
  variant: WebsiteGalleryVariant;
}) {
  if (!media.length) return null;

  return (
    <SectionShell
      id="gallery"
      title={title}
    >
      <div
        className={`website-gallery website-gallery-${variant}`}
      >
        {media.map((item, index) =>
          item.url ? (
            <img
              key={item.id || `gallery-${index}`}
              src={item.url}
              alt={item.alt || ""}
            />
          ) : null,
        )}
      </div>
    </SectionShell>
  );
}

export function ContactSection({
  title,
  dataset,
  settings,
}: {
  title: string;
  dataset: WebsiteDataset;
  settings: WebsiteTemplateSettings;
}) {
  const phone =
    dataset.branch?.phone ||
    dataset.school.phone;
  const email =
    dataset.branch?.email ||
    dataset.school.email;
  const address =
    dataset.branch?.address ||
    dataset.school.address;

  if (
    (!settings.showPhone || !phone) &&
    (!settings.showEmail || !email) &&
    (!settings.showAddress || !address)
  ) {
    return null;
  }

  return (
    <SectionShell
      id="contact"
      title={title}
    >
      <div className="website-contact-grid">
        {settings.showPhone && phone ? (
          <article>
            <small>{settings.phoneLabel}</small>
            <a href={`tel:${phone}`}>{phone}</a>
          </article>
        ) : null}

        {settings.showEmail && email ? (
          <article>
            <small>{settings.emailLabel}</small>
            <a href={`mailto:${email}`}>
              {email}
            </a>
          </article>
        ) : null}

        {settings.showAddress && address ? (
          <article>
            <small>{settings.addressLabel}</small>
            <span>{address}</span>
          </article>
        ) : null}
      </div>
    </SectionShell>
  );
}

export function FooterSection({
  dataset,
  settings,
}: {
  dataset: WebsiteDataset;
  settings: WebsiteTemplateSettings;
}) {
  const name =
    dataset.website?.siteName ||
    dataset.school.name;

  return (
    <footer
      id="footer"
      className={`website-footer website-footer-${settings.footerVariant}`}
    >
      <div className="website-section-inner">
        <strong>{name}</strong>

        {settings.footerText ? (
          <p>{settings.footerText}</p>
        ) : null}

        {settings.showPoweredByEleeveon ? (
          <small>
            Powered by Eleeveon Schools
          </small>
        ) : null}
      </div>
    </footer>
  );
}
