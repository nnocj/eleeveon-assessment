"use client";

import type { ReactNode } from "react";
import {
  BrandGlow,
  BrandPattern,
  BrandTexture,
} from "../branding";

export interface DashboardBackgroundProps {
  children: ReactNode;
  primaryColor?: string;
  className?: string;
}

export default function DashboardBackground({
  children,
  primaryColor,
  className,
}: DashboardBackgroundProps) {
  return (
    <main
      className={[
        "eds-dashboard",
        className,
      ].filter(Boolean).join(" ")}
      style={{
        "--dashboard-accent":
          primaryColor ||
          "var(--eds-primary)",
      } as React.CSSProperties}
    >
      <style>{dashboardCss}</style>

      <BrandGlow
        placement="top-left"
        size="34rem"
        opacity={0.08}
      />
      <BrandGlow
        placement="bottom-right"
        size="28rem"
        opacity={0.055}
      />
      <BrandPattern
        variant="network"
        opacity={0.022}
      />
      <BrandTexture
        texture="grain"
        intensity={0.45}
        decorative
        className="eds-dashboard-texture"
      />

      <div className="eds-dashboard-inner">
        {children}
      </div>
    </main>
  );
}

const dashboardCss = `
.eds-dashboard {
  position: relative;
  isolation: isolate;
  min-height: 100%;
  padding: 8px;
  padding-bottom:
    max(36px, env(safe-area-inset-bottom));
  overflow-x: hidden;
  background:
    var(--eds-gradient-page-glow),
    var(--eds-bg);
  color: var(--eds-text);
}

.eds-dashboard *,
.eds-dashboard *::before,
.eds-dashboard *::after {
  box-sizing: border-box;
}

.eds-dashboard button,
.eds-dashboard input {
  font: inherit;
}

.eds-dashboard button {
  cursor: pointer;
}

.eds-dashboard-texture {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.eds-dashboard-inner {
  position: relative;
  z-index: 2;
  width: min(100%, 1180px);
  margin-inline: auto;
  display: grid;
  gap: 10px;
}

.eds-dashboard-header {
  position: sticky;
  top: 6px;
  z-index: 30;
  display: grid;
  grid-template-columns:
    auto minmax(0, 1fr) minmax(240px, 420px) auto auto;
  align-items: center;
  gap: 7px;
  padding: 7px;
  border: 1px solid var(--eds-border);
  border-radius: var(--eds-radius-xl);
  background:
    color-mix(
      in srgb,
      var(--eds-glass-medium-bg) 94%,
      transparent
    );
  box-shadow: var(--eds-shadow-card);
  backdrop-filter: var(--eds-glass-medium-filter);
}

.eds-dashboard-header > .eds-search-bar {
  grid-column: 3;
  width: 100%;
  max-width: 420px;
  justify-self: end;
}

.eds-dashboard-status {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--eds-text-subtle);
}

.eds-dashboard-status.active {
  background: var(--eds-success);
  box-shadow:
    0 0 0 4px
    color-mix(
      in srgb,
      var(--eds-success) 14%,
      transparent
    );
}

.eds-dashboard-greeting {
  min-width: 0;
}

.eds-dashboard-greeting > span {
  display: block;
  color: var(--eds-text-muted);
  font-size: var(--eds-font-xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.eds-dashboard-greeting h1 {
  margin: 4px 0 0;
  color: var(--eds-text-strong);
  font-size: clamp(1.35rem, 4vw, 2rem);
  line-height: 1.05;
  letter-spacing: -.045em;
}

.eds-dashboard-greeting p {
  margin: 5px 0 0;
  color: var(--eds-text-muted);
  font-size: var(--eds-font-sm);
}

.eds-welcome-hero {
  position: relative;
  isolation: isolate;
  min-height: 280px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(18px, 3vw, 30px);
  border-radius: var(--eds-radius-panel);
  color: #fff;
  background:
    linear-gradient(
      135deg,
      color-mix(
        in srgb,
        var(--dashboard-accent) 94%,
        #111827
      ),
      color-mix(
        in srgb,
        var(--dashboard-accent) 56%,
        #0f172a
      )
    );
  box-shadow:
    0 24px 62px
    color-mix(
      in srgb,
      var(--dashboard-accent) 20%,
      transparent
    );
}

.eds-welcome-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 86% 12%,
      rgba(255,255,255,.20),
      transparent 28%
    );
}

.eds-dashboard-hero-image,
.eds-dashboard-hero-image img,
.eds-dashboard-hero-image video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.eds-dashboard-hero-image {
  z-index: 0;
}

.eds-dashboard-hero-image img,
.eds-dashboard-hero-image video {
  display: block;
  object-fit: cover;
}

.eds-dashboard-hero-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      rgba(7,15,32,.9),
      rgba(7,15,32,.34)
    );
}

.eds-dashboard-hero-copy,
.eds-dashboard-hero-footer,
.eds-dashboard-highlight,
.eds-dashboard-hero-dots {
  position: relative;
  z-index: 2;
}

.eds-dashboard-hero-copy > span {
  display: block;
  font-size: var(--eds-font-xs);
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: .11em;
  opacity: .88;
}

.eds-dashboard-hero-copy h2 {
  margin: 7px 0 4px;
  font-size: clamp(2rem, 7vw, 3.1rem);
  line-height: .98;
  letter-spacing: -.065em;
}

.eds-dashboard-hero-copy p {
  margin: 0;
  font-size: var(--eds-font-base);
}

.eds-dashboard-hero-branch {
  display: block;
  width: max-content;
  max-width: 100%;
  margin-top: 7px;
  padding: 5px 9px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: var(--eds-radius-sm);
  background: rgba(255,255,255,.12);
  backdrop-filter: blur(8px);
  font-size: var(--eds-font-xs);
  font-weight: 800;
}

.eds-dashboard-hero-copy blockquote {
  max-width: 38rem;
  margin: 18px 0 0;
  font-size: var(--eds-font-sm);
  line-height: 1.55;
  font-weight: 650;
  opacity: .9;
}

.eds-dashboard-highlight {
  display: grid;
  gap: 3px;
  align-self: flex-start;
  max-width: min(520px, 92%);
  margin-top: auto;
  margin-bottom: 10px;
}

.eds-dashboard-highlight strong {
  font-size: var(--eds-font-lg);
}

.eds-dashboard-highlight small {
  font-size: var(--eds-font-xs);
  line-height: 1.45;
  opacity: .88;
}

.eds-dashboard-highlight button {
  width: max-content;
  margin-top: 5px;
  padding: 7px 11px;
  border: 1px solid rgba(255,255,255,.25);
  border-radius: var(--eds-radius-pill);
  background: rgba(255,255,255,.14);
  color: #fff;
  font-size: var(--eds-font-xs);
  font-weight: 850;
  backdrop-filter: blur(8px);
}

.eds-dashboard-hero-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}

.eds-dashboard-hero-stat {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: 8px 11px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: var(--eds-radius-pill);
  background: rgba(255,255,255,.12);
  backdrop-filter: blur(10px);
  font-size: var(--eds-font-xs);
  font-weight: 800;
}

.eds-dashboard-hero-stat b {
  font-size: var(--eds-font-lg);
}

.eds-dashboard-hero-dots {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  gap: 5px;
}

.eds-dashboard-hero-dots button {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(255,255,255,.42);
}

.eds-dashboard-hero-dots button.active {
  width: 20px;
  border-radius: var(--eds-radius-pill);
  background: #fff;
}

.eds-stat-grid,
.eds-quick-action-grid,
.eds-dashboard-widget-grid {
  display: grid;
  gap: 8px;
}

.eds-stat-grid {
  grid-template-columns:
    repeat(
      auto-fit,
      minmax(130px, 1fr)
    );
}

.eds-stat-card {
  position: relative;
  overflow: hidden;
  min-height: 116px;
  padding: 13px;
  border: 1px solid var(--eds-border);
  border-radius: var(--eds-radius-card);
  background: var(--eds-card);
  box-shadow: var(--eds-shadow-card);
  transition: var(--eds-transition-surface);
}

.eds-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--eds-shadow-raised);
}

.eds-stat-card-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--eds-radius-control);
  background: var(--eds-primary-soft);
  color: var(--eds-primary);
}

.eds-stat-card strong {
  display: block;
  margin-top: 15px;
  color: var(--eds-text-strong);
  font-size: 1.65rem;
  line-height: 1;
  letter-spacing: -.05em;
}

.eds-stat-card small {
  display: block;
  margin-top: 5px;
  color: var(--eds-text-muted);
  font-size: var(--eds-font-xs);
  font-weight: 750;
}

.eds-stat-card p {
  margin: 5px 0 0;
  color: var(--eds-text-muted);
  font-size: 10px;
  line-height: 1.35;
}

.eds-quick-action-grid {
  grid-template-columns:
    repeat(
      auto-fit,
      minmax(82px, 1fr)
    );
  overflow-x: auto;
  scrollbar-width: none;
}

.eds-quick-action-grid::-webkit-scrollbar {
  display: none;
}

.eds-quick-action {
  min-height: 78px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 7px;
  border: 1px solid var(--eds-border);
  border-radius: var(--eds-radius-xl);
  background: var(--eds-card);
  color: var(--eds-text);
  box-shadow: var(--eds-shadow-soft);
  transition: var(--eds-transition-surface);
}

.eds-quick-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--eds-shadow-raised);
}

.eds-quick-action-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: var(--eds-radius-control);
  background: var(--eds-primary-soft);
  color: var(--eds-primary);
}

.eds-quick-action strong {
  font-size: var(--eds-font-xs);
  font-weight: 850;
  white-space: nowrap;
}

.eds-dashboard-section {
  display: grid;
  gap: 10px;
}

.eds-dashboard-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.eds-dashboard-section-header span {
  display: block;
  color: var(--eds-text-muted);
  font-size: 10px;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: .09em;
}

.eds-dashboard-section-header h2 {
  margin: 3px 0 0;
  color: var(--eds-text-strong);
  font-size: 1.05rem;
  letter-spacing: -.03em;
}

.eds-dashboard-section-header button,
.eds-dashboard-section-header > b {
  border: 0;
  border-radius: var(--eds-radius-pill);
  padding: 7px 10px;
  background: var(--eds-primary-soft);
  color: var(--eds-primary);
  font-size: 10px;
  font-weight: 850;
}

.eds-dashboard-widget-grid {
  grid-template-columns: 1fr;
}

.eds-dashboard-widget {
  padding: 14px;
  border: 1px solid var(--eds-border);
  border-radius: var(--eds-radius-xl);
  background: var(--eds-card);
  box-shadow: var(--eds-shadow-card);
}

.eds-activity-list,
.eds-calendar-list {
  display: grid;
  gap: 7px;
}

.eds-activity-item,
.eds-calendar-item {
  width: 100%;
  display: grid;
  align-items: center;
  gap: 9px;
  padding: 9px;
  border: 0;
  border-radius: var(--eds-radius-control);
  background: var(--eds-surface-sunken);
  color: inherit;
  text-align: left;
}

.eds-activity-item {
  grid-template-columns:
    auto minmax(0,1fr);
}

.eds-calendar-item {
  grid-template-columns:
    76px minmax(0,1fr);
}

.eds-activity-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: var(--eds-radius-control);
  background: var(--eds-primary-soft);
  color: var(--eds-primary);
}

.eds-activity-copy,
.eds-calendar-copy {
  min-width: 0;
}

.eds-activity-copy strong,
.eds-activity-copy small,
.eds-calendar-copy strong,
.eds-calendar-copy small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eds-activity-copy strong,
.eds-calendar-copy strong {
  font-size: var(--eds-font-sm);
}

.eds-activity-copy small,
.eds-calendar-copy small {
  margin-top: 3px;
  color: var(--eds-text-muted);
  font-size: 10px;
}

.eds-calendar-item time {
  color: var(--eds-primary);
  font-size: 10px;
  font-weight: 850;
}

.eds-dashboard-empty {
  min-height: 110px;
  display: grid;
  place-items: center;
  align-content: center;
  color: var(--eds-text-muted);
  text-align: center;
}

.eds-dashboard-empty > span {
  font-size: 1.7rem;
}

.eds-dashboard-empty p {
  margin: 6px 0 0;
  font-size: var(--eds-font-xs);
}

.eds-dashboard-state {
  min-height: min(420px, calc(100dvh - 20px));
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  border: 1px solid var(--eds-border);
  border-radius: var(--eds-radius-panel);
  background: var(--eds-card);
  box-shadow: var(--eds-shadow-card);
  text-align: center;
}

.eds-dashboard-state-spinner {
  width: 38px;
  height: 38px;
  border: 4px solid var(--eds-primary-soft);
  border-top-color: var(--eds-primary);
  border-radius: 50%;
  animation: eds-spin .8s linear infinite;
}

.eds-dashboard-state h2 {
  margin: 0;
}

.eds-dashboard-state p {
  max-width: 32rem;
  margin: 0;
  color: var(--eds-text-muted);
  font-size: var(--eds-font-sm);
}

.eds-dashboard-search-results {
  padding: 12px;
  border: 1px solid var(--eds-border);
  border-radius: var(--eds-radius-xl);
  background: var(--eds-card);
  box-shadow: var(--eds-shadow-card);
}

.eds-dashboard-search-row {
  width: 100%;
  display: grid;
  grid-template-columns:
    auto minmax(0,1fr) auto;
  align-items: center;
  gap: 10px;
  margin-top: 7px;
  padding: 10px;
  border: 1px solid var(--eds-border);
  border-radius: var(--eds-radius-card);
  background: var(--eds-surface);
  color: inherit;
  text-align: left;
}

.eds-dashboard-search-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: var(--eds-radius-control);
  background: var(--eds-primary-soft);
  color: var(--eds-primary);
}

.eds-dashboard-search-copy {
  min-width: 0;
}

.eds-dashboard-search-copy strong,
.eds-dashboard-search-copy small,
.eds-dashboard-search-copy em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eds-dashboard-search-copy strong {
  font-size: var(--eds-font-sm);
}

.eds-dashboard-search-copy small {
  margin-top: 3px;
  color: var(--eds-text-muted);
  font-size: 10px;
}

.eds-dashboard-search-copy em {
  margin-top: 3px;
  color: var(--eds-primary);
  font-size: 9px;
  font-style: normal;
  font-weight: 800;
}

.eds-dashboard-more-layer {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: end center;
  padding: 10px;
  background: var(--eds-overlay);
  backdrop-filter: blur(10px);
}

.eds-dashboard-more {
  width: min(520px, 100%);
  padding: 14px;
  border: 1px solid var(--eds-border);
  border-radius: var(--eds-radius-panel);
  background: var(--eds-surface);
  box-shadow: var(--eds-shadow-overlay);
}

.eds-dashboard-more-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

@media (min-width: 700px) {
  .eds-dashboard {
    padding: 12px;
  }

  .eds-dashboard-widget-grid {
    grid-template-columns:
      repeat(2, minmax(0,1fr));
  }

  .eds-welcome-hero {
    min-height: 320px;
  }

  .eds-dashboard-more-layer {
    place-items: center;
  }
}

@media (min-width: 1080px) {
  .eds-dashboard {
    padding: 16px;
  }
}

@media (max-width: 700px) {
  .eds-dashboard-header {
    grid-template-columns:
      auto minmax(0,1fr) auto auto;
  }

  .eds-dashboard-header > .eds-search-bar {
    grid-column: auto;
    max-width: none;
    justify-self: stretch;
  }

  .eds-quick-action-grid {
    grid-template-columns:
      repeat(5, 82px);
  }
}
`;
