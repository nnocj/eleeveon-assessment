"use client";

/**
 * app/lib/websites/builder/settings/WebsiteSettingsSheet.tsx
 * --------------------------------------------------------------------------
 * Local-first website controls opened from Branchsettings.tsx.
 *
 * Responsibilities:
 * - load/create the school's WebsiteSetting record;
 * - choose a template;
 * - configure the Eleeveon subdomain and optional custom domain;
 * - edit SEO, analytics and publishing controls;
 * - keep website persistence separate from the already-large Branchsettings file.
 */

import React, { useEffect, useMemo, useState } from "react";

import {
  db,
  type WebsiteSetting,
  type WebsiteDomain,
} from "../../../db/db";

import {
  createLocal,
  updateLocal,
} from "../../../sync/syncUtils";

import WebsitePreview from "../../components/WebsitePreview";
import { getWebsiteTemplates } from "../../templates/registry";
import {
  normalizeWebsiteSlug,
  splitKeywords,
  websiteSettingsDraft,
} from "../../shared/websiteDefaults";
import type {
  WebsiteEditorTab,
  WebsiteSettingsDraft,
} from "../../types";

type Props = {
  accountId?: string | null;
  schoolId?: string | null;
  branchId?: string | null;
  schoolName?: string;
  branchName?: string;
  primaryColor?: string;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
};

function cleanId(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function createdId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return cleanId((value as any)?.id);
}

function activeRecord(row: any) {
  return !row?.isDeleted;
}

function fieldLabel(tab: WebsiteEditorTab) {
  switch (tab) {
    case "identity":
      return "Website Identity";
    case "template":
      return "Template";
    case "domain":
      return "Domain";
    case "seo":
      return "SEO & Analytics";
    case "publishing":
      return "Publishing";
  }
}

export default function WebsiteSettingsSheet({
  accountId,
  schoolId,
  branchId,
  schoolName,
  branchName,
  primaryColor,
  onClose,
  onSaved,
}: Props) {
  const [tab, setTab] = useState<WebsiteEditorTab>("identity");
  const [draft, setDraft] = useState<WebsiteSettingsDraft>(
    websiteSettingsDraft({ schoolName, branchName }),
  );
  const [customDomain, setCustomDomain] = useState("");
  const [customDomainId, setCustomDomainId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();

  const canSave = Boolean(accountId && schoolId && draft.eleeveonSlug);

  const publicAddress = useMemo(
    () =>
      draft.eleeveonSlug
        ? `${draft.eleeveonSlug}.eleeveon.com`
        : "your-school.eleeveon.com",
    [draft.eleeveonSlug],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!accountId || !schoolId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const settingsRows = (
          await (db as any).websiteSettings.toArray()
        ).filter(
          (row: WebsiteSetting) =>
            row.accountId === accountId &&
            row.schoolId === schoolId &&
            activeRecord(row),
        );

        const row = [...settingsRows].sort(
          (a: any, b: any) =>
            Number(b.updatedAt || 0) - Number(a.updatedAt || 0),
        )[0] as WebsiteSetting | undefined;

        if (row && !cancelled) {
          setDraft(
            websiteSettingsDraft({
              id: row.id,
              schoolName,
              branchName,
              siteName: row.siteName || "",
              tagline: row.tagline || "",
              description: row.description || "",
              templateKey:
                row.templateKey || getWebsiteTemplates()[0]?.key || "",
              eleeveonSlug: row.eleeveonSlug || "",
              status: row.status,
              defaultLanguage: row.defaultLanguage || "en",
              searchEngineIndexing: row.searchEngineIndexing !== false,
              seoTitle: row.seoTitle || "",
              seoDescription: row.seoDescription || "",
              seoKeywordsText: Array.isArray(row.seoKeywords)
                ? row.seoKeywords.join(", ")
                : "",
              analyticsProvider: row.analyticsProvider || "",
              analyticsTrackingId: row.analyticsTrackingId || "",
            }),
          );

          const domains = (
            await (db as any).websiteDomains.toArray()
          ).filter(
            (domain: WebsiteDomain) =>
              domain.accountId === accountId &&
              domain.schoolId === schoolId &&
              domain.websiteSettingId === row.id &&
              domain.domainType === "custom" &&
              activeRecord(domain),
          );

          const domain = domains.find((item: any) => item.isPrimary) || domains[0];

          if (domain && !cancelled) {
            setCustomDomain(domain.hostname || "");
            setCustomDomainId(domain.id);
          }
        }
      } catch (error) {
        console.error("[WebsiteSettingsSheet] load failed", error);
        if (!cancelled) setMessage("Website settings could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [accountId, schoolId, branchId, schoolName, branchName]);

  function update<K extends keyof WebsiteSettingsDraft>(
    key: K,
    value: WebsiteSettingsDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(undefined);
  }

  async function save() {
    if (!accountId || !schoolId) {
      setMessage("The active account and school are required.");
      return;
    }

    const slug = normalizeWebsiteSlug(draft.eleeveonSlug);

    if (!slug) {
      setMessage("Enter a valid Eleeveon website address.");
      setTab("domain");
      return;
    }

    setSaving(true);
    setMessage(undefined);

    try {
      const now = Date.now();
      const payload = {
        accountId,
        schoolId,
        branchId: cleanId(branchId) || null,
        siteName: draft.siteName.trim() || schoolName || "School Website",
        tagline: draft.tagline.trim() || null,
        description: draft.description.trim() || null,
        templateKey: draft.templateKey,
        templateVersion: "1",
        theme: {
          inheritBranchPrimaryColor: true,
          primaryColor: primaryColor || null,
        },
        templateSettings: {},
        eleeveonSlug: slug,
        status: draft.status,
        defaultLanguage: draft.defaultLanguage || "en",
        supportedLanguages: [draft.defaultLanguage || "en"],
        seoTitle: draft.seoTitle.trim() || null,
        seoDescription: draft.seoDescription.trim() || null,
        seoKeywords: splitKeywords(draft.seoKeywordsText),
        searchEngineIndexing: draft.searchEngineIndexing,
        analyticsProvider: draft.analyticsProvider.trim() || null,
        analyticsTrackingId: draft.analyticsTrackingId.trim() || null,
        publishedAt:
          draft.status === "published" ? now : null,
        unpublishedAt:
          draft.status === "unpublished" ? now : null,
        metadata: {
          settingsSource: "branch_settings",
          branchThemeControlled: true,
        },
      };

      let websiteSettingId = draft.id;

      if (websiteSettingId) {
        await updateLocal(
          "websiteSettings" as any,
          websiteSettingId,
          payload as any,
        );
      } else {
        const created = await createLocal(
          "websiteSettings" as any,
          payload as any,
        );
        websiteSettingId = createdId(created);
      }

      if (!websiteSettingId) {
        throw new Error("The website settings record could not be created.");
      }

      update("id", websiteSettingId);
      update("eleeveonSlug", slug);

      const normalizedCustomDomain = customDomain
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "");

      if (normalizedCustomDomain) {
        const domainPayload = {
          accountId,
          schoolId,
          branchId: cleanId(branchId) || null,
          websiteSettingId,
          hostname: normalizedCustomDomain,
          domainType: "custom",
          status: "pending",
          sslStatus: "pending",
          isPrimary: true,
          redirectToPrimary: true,
          active: true,
          metadata: {
            addedFrom: "branch_settings",
          },
        };

        if (customDomainId) {
          await updateLocal(
            "websiteDomains" as any,
            customDomainId,
            domainPayload as any,
          );
        } else {
          const createdDomain = await createLocal(
            "websiteDomains" as any,
            domainPayload as any,
          );
          setCustomDomainId(createdId(createdDomain));
        }
      }

      setMessage(
        draft.status === "published"
          ? "Website settings saved and marked for publishing."
          : "Website settings saved.",
      );

      window.dispatchEvent(new Event("website-settings-updated"));
      await onSaved?.();
    } catch (error: any) {
      console.error("[WebsiteSettingsSheet] save failed", error);
      setMessage(error?.message || "Website settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="website-settings-backdrop" role="dialog" aria-modal="true">
      <section
        className="website-settings-sheet"
        style={
          {
            "--website-primary":
              primaryColor || "var(--primary-color, #2563eb)",
          } as React.CSSProperties
        }
      >
        <style>{css}</style>

        <header className="website-settings-head">
          <div>
            <small>PUBLIC SCHOOL WEBSITE</small>
            <h2>{fieldLabel(tab)}</h2>
            <p>
              Configure the school website without mixing website content into
              branch operational settings.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close website settings">
            ✕
          </button>
        </header>

        <nav className="website-settings-tabs" aria-label="Website settings">
          {(
            [
              "identity",
              "template",
              "domain",
              "seo",
              "publishing",
            ] as WebsiteEditorTab[]
          ).map((item) => (
            <button
              key={item}
              type="button"
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {fieldLabel(item)}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="website-settings-state">Loading website settings…</div>
        ) : (
          <div className="website-settings-body">
            <div className="website-settings-fields">
              {tab === "identity" && (
                <>
                  <Field label="Website name">
                    <input
                      value={draft.siteName}
                      onChange={(event) => update("siteName", event.target.value)}
                      placeholder={schoolName || "School name"}
                    />
                  </Field>

                  <Field label="Tagline">
                    <input
                      value={draft.tagline}
                      onChange={(event) => update("tagline", event.target.value)}
                      placeholder="Learning today. Leading tomorrow."
                    />
                  </Field>

                  <Field label="Short website description">
                    <textarea
                      rows={5}
                      value={draft.description}
                      onChange={(event) =>
                        update("description", event.target.value)
                      }
                      placeholder="Introduce the school to parents, students and visitors."
                    />
                  </Field>

                  <Field label="Default language">
                    <select
                      value={draft.defaultLanguage}
                      onChange={(event) =>
                        update("defaultLanguage", event.target.value)
                      }
                    >
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </Field>
                </>
              )}

              {tab === "template" && (
                <div className="website-template-grid">
                  {getWebsiteTemplates().map((template) => (
                    <button
                      key={template.key}
                      type="button"
                      className={
                        draft.templateKey === template.key ? "selected" : ""
                      }
                      onClick={() => update("templateKey", template.key)}
                    >
                      <span>{template.name}</span>
                      <small>{template.tone}</small>
                      <p>{template.description}</p>
                      <em>
                        {template.defaultSections.slice(0, 4).join(" · ")}
                      </em>
                    </button>
                  ))}
                </div>
              )}

              {tab === "domain" && (
                <>
                  <Field label="Eleeveon address">
                    <div className="website-slug-control">
                      <input
                        value={draft.eleeveonSlug}
                        onChange={(event) =>
                          update(
                            "eleeveonSlug",
                            normalizeWebsiteSlug(event.target.value),
                          )
                        }
                        placeholder="school-name"
                      />
                      <span>.eleeveon.com</span>
                    </div>
                  </Field>

                  <div className="website-address-preview">
                    <small>PUBLIC ADDRESS</small>
                    <strong>{publicAddress}</strong>
                  </div>

                  <Field
                    label="Custom domain"
                    hint="Optional. Verification and SSL activation are completed by the backend domain workflow."
                  >
                    <input
                      value={customDomain}
                      onChange={(event) => setCustomDomain(event.target.value)}
                      placeholder="www.school.edu.gh"
                    />
                  </Field>
                </>
              )}

              {tab === "seo" && (
                <>
                  <Field label="Search result title">
                    <input
                      value={draft.seoTitle}
                      onChange={(event) => update("seoTitle", event.target.value)}
                      placeholder="School name | Admissions and programmes"
                    />
                  </Field>

                  <Field label="Search result description">
                    <textarea
                      rows={4}
                      value={draft.seoDescription}
                      onChange={(event) =>
                        update("seoDescription", event.target.value)
                      }
                      placeholder="A concise description for search engines and shared links."
                    />
                  </Field>

                  <Field label="Keywords" hint="Separate phrases with commas.">
                    <input
                      value={draft.seoKeywordsText}
                      onChange={(event) =>
                        update("seoKeywordsText", event.target.value)
                      }
                      placeholder="school in Accra, admissions, primary school"
                    />
                  </Field>

                  <label className="website-toggle-row">
                    <input
                      type="checkbox"
                      checked={draft.searchEngineIndexing}
                      onChange={(event) =>
                        update("searchEngineIndexing", event.target.checked)
                      }
                    />
                    <span>
                      <b>Allow search-engine indexing</b>
                      <small>
                        Turn this off while the website is still being prepared.
                      </small>
                    </span>
                  </label>

                  <div className="website-two-columns">
                    <Field label="Analytics provider">
                      <select
                        value={draft.analyticsProvider}
                        onChange={(event) =>
                          update("analyticsProvider", event.target.value)
                        }
                      >
                        <option value="">None</option>
                        <option value="google_analytics">Google Analytics</option>
                        <option value="plausible">Plausible</option>
                        <option value="matomo">Matomo</option>
                      </select>
                    </Field>

                    <Field label="Tracking ID">
                      <input
                        value={draft.analyticsTrackingId}
                        onChange={(event) =>
                          update("analyticsTrackingId", event.target.value)
                        }
                        placeholder="G-XXXXXXXXXX"
                      />
                    </Field>
                  </div>
                </>
              )}

              {tab === "publishing" && (
                <>
                  <Field label="Website status">
                    <select
                      value={draft.status}
                      onChange={(event) =>
                        update(
                          "status",
                          event.target.value as WebsiteSettingsDraft["status"],
                        )
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="unpublished">Unpublished</option>
                      <option value="archived">Archived</option>
                    </select>
                  </Field>

                  <div className="website-publish-note">
                    <strong>
                      {draft.status === "published"
                        ? "Ready for the public website renderer"
                        : "Not publicly active"}
                    </strong>
                    <p>
                      Saving creates a pending local-first sync update. The
                      backend publishing service can later build the public
                      revision, domain and cache.
                    </p>
                  </div>
                </>
              )}
            </div>

            <aside>
              <WebsitePreview
                draft={draft}
                accountId={accountId}
                schoolId={schoolId}
                branchId={branchId}
                schoolName={schoolName}
                branchName={branchName}
                primaryColor={primaryColor}
              />
            </aside>
          </div>
        )}

        <footer className="website-settings-actions">
          <span>{message || "Changes remain local until saved and synced."}</span>
          <div>
            <button type="button" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="primary"
              disabled={!canSave || saving || loading}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : "Save Website"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="website-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

const css = `
.website-settings-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: color-mix(in srgb, #020617 58%, transparent);
  display: flex;
  justify-content: flex-end;
}
.website-settings-sheet {
  width: min(1120px, 100%);
  height: 100%;
  background: var(--surface, var(--card-bg, #fff));
  color: var(--text, #111827);
  display: flex;
  flex-direction: column;
  box-shadow: -18px 0 60px rgba(2, 6, 23, .25);
}
.website-settings-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border, rgba(0,0,0,.10));
}
.website-settings-head small {
  color: var(--website-primary);
  font-weight: 800;
  letter-spacing: .08em;
}
.website-settings-head h2 {
  margin: 4px 0;
  font-size: 1.2rem;
}
.website-settings-head p {
  margin: 0;
  color: var(--muted, #64748b);
  max-width: 680px;
  font-size: .88rem;
}
.website-settings-head > button {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--border, rgba(0,0,0,.1));
  background: var(--surface-2, transparent);
  color: inherit;
}
.website-settings-tabs {
  display: flex;
  gap: 6px;
  padding: 10px 14px;
  overflow-x: auto;
  border-bottom: 1px solid var(--border, rgba(0,0,0,.10));
}
.website-settings-tabs button {
  white-space: nowrap;
  border: 0;
  border-radius: 999px;
  padding: 9px 12px;
  background: var(--surface-2, rgba(15,23,42,.05));
  color: var(--muted, #64748b);
  font-weight: 700;
}
.website-settings-tabs button.active {
  background: color-mix(in srgb, var(--website-primary) 14%, transparent);
  color: var(--website-primary);
}
.website-settings-state {
  padding: 40px;
  color: var(--muted, #64748b);
}
.website-settings-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
  gap: 18px;
  padding: 18px;
}
.website-settings-fields {
  min-width: 0;
}
.website-field {
  display: grid;
  gap: 7px;
  margin-bottom: 14px;
}
.website-field > span {
  font-size: .82rem;
  font-weight: 800;
}
.website-field > small {
  color: var(--muted, #64748b);
  font-size: .76rem;
}
.website-field input,
.website-field textarea,
.website-field select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border, rgba(0,0,0,.12));
  background: var(--input-bg, var(--surface, #fff));
  color: inherit;
  border-radius: 11px;
  padding: 11px 12px;
  outline: none;
}
.website-field input:focus,
.website-field textarea:focus,
.website-field select:focus {
  border-color: var(--website-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--website-primary) 12%, transparent);
}
.website-two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.website-slug-control {
  display: flex;
  align-items: stretch;
}
.website-slug-control input {
  border-radius: 11px 0 0 11px;
}
.website-slug-control span {
  display: grid;
  place-items: center;
  padding: 0 12px;
  border: 1px solid var(--border, rgba(0,0,0,.12));
  border-left: 0;
  border-radius: 0 11px 11px 0;
  background: var(--surface-2, rgba(15,23,42,.05));
  color: var(--muted, #64748b);
  font-size: .8rem;
  font-weight: 700;
}
.website-address-preview,
.website-publish-note {
  border: 1px solid color-mix(in srgb, var(--website-primary) 28%, var(--border, rgba(0,0,0,.1)));
  background: color-mix(in srgb, var(--website-primary) 7%, var(--surface, #fff));
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 16px;
}
.website-address-preview small {
  display: block;
  color: var(--muted, #64748b);
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .08em;
}
.website-address-preview strong {
  display: block;
  margin-top: 5px;
  overflow-wrap: anywhere;
}
.website-publish-note p {
  margin: 5px 0 0;
  color: var(--muted, #64748b);
  font-size: .83rem;
}
.website-template-grid {
  display: grid;
  gap: 10px;
}
.website-template-grid > button {
  text-align: left;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--border, rgba(0,0,0,.1));
  background: var(--surface, #fff);
  color: inherit;
}
.website-template-grid > button.selected {
  border-color: var(--website-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--website-primary) 10%, transparent);
}
.website-template-grid span,
.website-template-grid small,
.website-template-grid em {
  display: block;
}
.website-template-grid span {
  font-weight: 900;
}
.website-template-grid small,
.website-template-grid em {
  color: var(--muted, #64748b);
  font-size: .76rem;
}
.website-template-grid p {
  margin: 7px 0;
  font-size: .84rem;
}
.website-template-grid em {
  font-style: normal;
}
.website-toggle-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  border: 1px solid var(--border, rgba(0,0,0,.1));
  border-radius: 13px;
  padding: 12px;
  margin-bottom: 14px;
}
.website-toggle-row span {
  display: grid;
  gap: 3px;
}
.website-toggle-row small {
  color: var(--muted, #64748b);
}
.website-mini-preview {
  position: sticky;
  top: 0;
  min-height: 360px;
  border: 1px solid var(--border, rgba(0,0,0,.1));
  border-radius: 18px;
  overflow: hidden;
  background: var(--surface, #fff);
  box-shadow: 0 15px 40px rgba(2,6,23,.08);
}
.website-mini-preview header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 14px;
  border-bottom: 1px solid var(--border, rgba(0,0,0,.08));
}
.website-mini-preview nav {
  display: flex;
  gap: 8px;
  color: var(--muted, #64748b);
  font-size: .68rem;
}
.website-mini-hero {
  padding: 32px 20px;
  background:
    linear-gradient(135deg,
      color-mix(in srgb, var(--website-preview-primary) 16%, var(--surface, #fff)),
      var(--surface, #fff));
}
.website-mini-hero small {
  color: var(--website-preview-primary);
  font-weight: 800;
}
.website-mini-hero h3 {
  margin: 8px 0;
  font-size: 1.45rem;
  line-height: 1.1;
}
.website-mini-hero p {
  color: var(--muted, #64748b);
  font-size: .82rem;
}
.website-mini-hero button {
  border: 0;
  border-radius: 10px;
  padding: 9px 11px;
  background: var(--website-preview-primary);
  color: #fff;
  font-weight: 800;
}
.website-mini-hero button.ghost {
  margin-left: 7px;
  background: transparent;
  color: var(--website-preview-primary);
  border: 1px solid color-mix(in srgb, var(--website-preview-primary) 35%, transparent);
}
.website-mini-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 14px;
}
.website-mini-sections span {
  border-radius: 10px;
  padding: 13px;
  background: var(--surface-2, rgba(15,23,42,.04));
  font-size: .74rem;
  font-weight: 800;
}
.website-settings-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 12px 18px;
  border-top: 1px solid var(--border, rgba(0,0,0,.1));
}
.website-settings-actions > span {
  color: var(--muted, #64748b);
  font-size: .78rem;
}
.website-settings-actions button {
  border: 1px solid var(--border, rgba(0,0,0,.1));
  background: var(--surface, #fff);
  color: inherit;
  border-radius: 10px;
  padding: 10px 13px;
  font-weight: 800;
}
.website-settings-actions button.primary {
  margin-left: 8px;
  border-color: var(--website-primary);
  background: var(--website-primary);
  color: #fff;
}
.website-settings-actions button:disabled {
  opacity: .55;
}
@media (max-width: 820px) {
  .website-settings-body {
    grid-template-columns: 1fr;
  }
  .website-settings-body aside {
    order: -1;
  }
  .website-mini-preview {
    position: static;
    min-height: 300px;
  }
}

.actual-website-template { border: 1px solid var(--border, rgba(0,0,0,.1)); border-radius: 18px; overflow: hidden; background: var(--surface, #fff); box-shadow: 0 15px 40px rgba(2,6,23,.08); }
.actual-website-template header { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:14px 16px; }
.actual-website-template nav { display:flex; gap:10px; color:var(--muted,#64748b); font-size:.68rem; }
.actual-website-template button { border:0; border-radius:10px; padding:9px 11px; background:var(--template-primary); color:#fff; font-weight:800; }
.modern-academy .template-hero { display:grid; grid-template-columns:1.25fr .75fr; gap:14px; padding:28px 18px; background:linear-gradient(135deg,color-mix(in srgb,var(--template-primary) 14%,var(--surface,#fff)),var(--surface,#fff)); }
.template-hero h3,.classic-banner h3,.bold-hero h3 { margin:7px 0; font-size:1.4rem; line-height:1.08; }
.template-hero p,.classic-banner p,.bold-hero p { color:var(--muted,#64748b); font-size:.8rem; }
.template-image-placeholder { min-height:150px; border-radius:16px; display:grid; place-items:center; background:color-mix(in srgb,var(--template-primary) 16%,#e2e8f0); color:var(--template-primary); font-weight:800; }
.template-actions .ghost { margin-left:7px; background:transparent; color:var(--template-primary); border:1px solid color-mix(in srgb,var(--template-primary) 35%,transparent); }
.template-feature-grid,.classic-columns,.bold-links { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:12px; }
.template-feature-grid article,.classic-columns article,.bold-links article { padding:12px; border-radius:11px; background:var(--surface-2,rgba(15,23,42,.04)); font-size:.74rem; }
.template-feature-grid small { display:block; margin-top:4px; color:var(--muted,#64748b); }
.classic-topline { padding:6px 14px; background:var(--template-primary); color:#fff; font-size:.66rem; text-align:center; }
.classic-banner { padding:34px 20px; text-align:center; border-top:4px double var(--template-primary); border-bottom:1px solid var(--border,rgba(0,0,0,.1)); }
.classic-columns { grid-template-columns:1.4fr 1fr; }
.bold-campus { background:linear-gradient(160deg,color-mix(in srgb,var(--template-primary) 11%,var(--surface,#fff)),var(--surface,#fff)); }
.bold-hero { padding:34px 20px; }
.bold-hero span { display:inline-block; padding:5px 8px; border-radius:999px; background:var(--template-primary); color:#fff; font-size:.65rem; font-weight:800; }
.bold-links { grid-template-columns:1fr 1fr; }
.bold-links article { background:var(--template-primary); color:#fff; font-weight:800; }
.website-template-empty { padding:30px; border:1px dashed var(--border,rgba(0,0,0,.15)); border-radius:16px; color:var(--muted,#64748b); }
@media (max-width: 560px) {
  .website-settings-body {
    padding: 12px;
  }
  .website-two-columns {
    grid-template-columns: 1fr;
  }
  .website-settings-actions {
    align-items: stretch;
    flex-direction: column;
  }
  .website-settings-actions > div {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .website-settings-head p {
    display: none;
  }
}
`;
