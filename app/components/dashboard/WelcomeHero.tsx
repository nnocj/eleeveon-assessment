"use client";

import type { ReactNode } from "react";
import DashboardHeroImage from "./DashboardHeroImage";

export interface WelcomeHeroSlide {
  id: string;
  type: "image" | "video";
  src: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
}

export interface WelcomeHeroStat {
  label: string;
  value: ReactNode;
}

export interface WelcomeHeroProps {
  greeting: string;
  name: string;
  schoolName: string;
  branchName: string;
  motto: string;
  slide?: WelcomeHeroSlide | null;
  slides?: WelcomeHeroSlide[];
  slideIndex?: number;
  stats?: WelcomeHeroStat[];
  onAdvance?(): void;
  onSlideChange?(index: number): void;
  onSlideAction?(): void;
}

export default function WelcomeHero({
  greeting,
  name,
  schoolName,
  branchName,
  motto,
  slide,
  slides = [],
  slideIndex = 0,
  stats = [],
  onAdvance,
  onSlideChange,
  onSlideAction,
}: WelcomeHeroProps) {
  return (
    <section className="eds-welcome-hero">
      {slide ? (
        <DashboardHeroImage
          type={slide.type}
          src={slide.src}
          poster={slide.poster}
          onEnded={onAdvance}
          onError={onAdvance}
        />
      ) : null}

      <div className="eds-dashboard-hero-copy">
        <span>{greeting}</span>
        <h2>{name}</h2>
        <p>
          Welcome to <strong>{schoolName}</strong>
          <small className="eds-dashboard-hero-branch">
            {branchName}
          </small>
        </p>
        <blockquote>“{motto}”</blockquote>
      </div>

      {slide?.title ? (
        <div className="eds-dashboard-highlight">
          <strong>{slide.title}</strong>
          {slide.subtitle ? (
            <small>{slide.subtitle}</small>
          ) : null}
          {slide.actionLabel ? (
            <button
              type="button"
              onClick={onSlideAction}
            >
              {slide.actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="eds-dashboard-hero-footer">
        {stats.map((stat) => (
          <span
            key={stat.label}
            className="eds-dashboard-hero-stat"
          >
            <b>{stat.value}</b>
            {stat.label}
          </span>
        ))}
      </div>

      {slides.length > 1 ? (
        <div
          className="eds-dashboard-hero-dots"
          aria-label="Dashboard highlights"
        >
          {slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={
                index === slideIndex
                  ? "active"
                  : ""
              }
              onClick={() =>
                onSlideChange?.(index)
              }
              aria-label={`Show highlight ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
