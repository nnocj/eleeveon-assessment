"use client";

/**
 * app/lib/websites/builder/settings/WebsiteSettingsSheet.tsx
 * --------------------------------------------------------------------------
 * Report-style website settings experience:
 * - template selection;
 * - exact shared preview;
 * - display, labels, content and ordering controls;
 * - domain, SEO and publishing;
 * - local-first persistence for identity, template settings and assignment.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  db,
  type WebsiteTemplateAssignment,
  type WebsiteTemplateSetting,
} from "../../../db/db";

import { SyncStatus } from "../../../constants/syncStatus";

import type {
  WebsiteEditorTab,
  WebsiteSettingsDraft,
  WebsiteTemplateSettings,
  WebsiteTemplateDefinition,
  WebsiteStatus,
} from "../../types";

import {
  applyWebsiteTemplateDesign,
  createWebsiteTemplateSettings,
} from "../../shared/websiteTemplateSettings";

import {
  normalizeCustomDomain,
  splitKeywords,
  websiteSettingsDraft,
} from "../../shared/websiteDefaults";

import {
  getDefaultWebsiteTemplate,
  getWebsiteTemplate,
  getWebsiteTemplates,
} from "../../templates/registry";

import WebsitePreview from "../../components/WebsitePreview";
import WebsiteTemplateSelector from "./WebsiteTemplateSelector";
import WebsiteDisplayControls from "./WebsiteDisplayControls";
import WebsiteLabelControls from "./WebsiteLabelControls";
import WebsiteContentOverrides from "./WebsiteContentOverrides";
import WebsiteSectionOrder from "./WebsiteSectionOrder";
import WebsitePublishingControls from "./WebsitePublishingControls";
import WebsiteDomainControls from "./WebsiteDomainControls";

type AnyRow = Record<string, any>;

const TABS: Array<{
  key: WebsiteEditorTab;
  label: string;
}> = [
  { key: "template", label: "Template" },
  { key: "display", label: "Display" },
  { key: "labels", label: "Labels" },
  { key: "content", label: "Content" },
  { key: "order", label: "Order" },
  { key: "domain", label: "Domain" },
  { key: "seo", label: "SEO" },
  { key: "publishing", label: "Publishing" },
];

const id = () =>
  typeof crypto !== "undefined" &&
  "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

export type WebsiteSettingsSheetProps = {
  open: boolean;
  accountId: string;
  schoolId: string;
  branchId?: string | null;
  schoolName?: string;
  branchName?: string;
  rootDomain?: string;
  onClose: () => void;
  onSaved?: () => void;
};

export default function WebsiteSettingsSheet({
  open,
  accountId,
  schoolId,
  branchId,
  schoolName,
  branchName,
  rootDomain = "eleeveon.com",
  onClose,
  onSaved,
}: WebsiteSettingsSheetProps) {
  const templates = useMemo(
    () => getWebsiteTemplates(),
    [],
  );

  const fallbackTemplate =
    getDefaultWebsiteTemplate();

  const [tab, setTab] =
    useState<WebsiteEditorTab>("template");

  const [draft, setDraft] =
    useState<WebsiteSettingsDraft>(() =>
      websiteSettingsDraft({
        schoolName,
        branchName,
        defaultTemplateKey:
          fallbackTemplate?.key,
      }),
    );

  const [settings, setSettings] =
    useState<WebsiteTemplateSettings>(() =>
      createWebsiteTemplateSettings(
        undefined,
        fallbackTemplate,
      ),
    );

  const [customDomain, setCustomDomain] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const selectedTemplate =
    getWebsiteTemplate(
      settings.templateKey ||
        draft.templateKey,
    ) || fallbackTemplate;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    setLoading(true);
    setMessage(null);

    Promise.all([
      db.websiteSettings
        .where("schoolId")
        .equals(schoolId)
        .toArray(),
      db.websiteTemplateSettings
        .where("schoolId")
        .equals(schoolId)
        .toArray(),
      db.websiteTemplateAssignments
        .where("schoolId")
        .equals(schoolId)
        .toArray(),
      db.websiteDomains
        .where("schoolId")
        .equals(schoolId)
        .toArray(),
    ])
      .then(
        ([
          websiteRows,
          templateSettingRows,
          assignmentRows,
          domainRows,
        ]) => {
          if (cancelled) return;

          const website = (
            websiteRows as AnyRow[]
          ).find(
            (row) =>
              !row.isDeleted &&
              (!branchId ||
                !row.branchId ||
                row.branchId === branchId),
          );

          const websiteId =
            website?.id;

          const assignment = (
            assignmentRows as AnyRow[]
          ).find(
            (row) =>
              !row.isDeleted &&
              row.active !== false &&
              row.isDefault !== false &&
              (!websiteId ||
                row.websiteSettingId ===
                  websiteId),
          );

          const savedTemplateSetting = (
            templateSettingRows as AnyRow[]
          ).find(
            (row) =>
              !row.isDeleted &&
              row.active !== false &&
              (
                row.id ===
                  assignment?.templateSettingId ||
                row.websiteSettingId ===
                  websiteId
              ),
          );

          const nextDraft =
            websiteSettingsDraft({
              ...website,
              id: websiteId,
              schoolName,
              branchName,
              seoKeywordsText:
                Array.isArray(
                  website?.seoKeywords,
                )
                  ? website.seoKeywords.join(
                      ", ",
                    )
                  : website
                      ?.seoKeywordsText || "",
            });

          const template =
            getWebsiteTemplate(
              savedTemplateSetting
                ?.templateKey ||
                website?.templateKey ||
                nextDraft.templateKey,
            ) || fallbackTemplate;

          const nextSettings =
            createWebsiteTemplateSettings(
              savedTemplateSetting?.settings ||
                website
                  ?.templateSettings,
              template,
            );

          const domain = (
            domainRows as AnyRow[]
          ).find(
            (row) =>
              !row.isDeleted &&
              row.domainType === "custom" &&
              (!websiteId ||
                row.websiteSettingId ===
                  websiteId),
          );

          setDraft(nextDraft);
          setSettings(nextSettings);
          setCustomDomain(
            domain?.hostname || "",
          );
          setLoading(false);
        },
      )
      .catch((error: unknown) => {
        if (cancelled) return;

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load website settings.",
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    schoolId,
    branchId,
    schoolName,
    branchName,
    fallbackTemplate,
  ]);

  const patchSettings = useCallback(
    <K extends keyof WebsiteTemplateSettings>(
      key: K,
      value: WebsiteTemplateSettings[K],
    ) => {
      setSettings((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const selectTemplate = (
    template: WebsiteTemplateDefinition,
  ) => {
    setSettings((current) =>
      applyWebsiteTemplateDesign(
        current,
        template,
      ),
    );

    setDraft((current) => ({
      ...current,
      templateKey: template.key,
    }));
  };

  const save = async () => {
    if (!draft.siteName.trim()) {
      setMessage(
        "Enter a website name before saving.",
      );
      return;
    }

    if (!draft.eleeveonSlug.trim()) {
      setMessage(
        "Enter an Eleeveon subdomain before saving.",
      );
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const now = Date.now();
      const deviceId =
        localStorage.getItem(
          "eleeveon_device_id",
        ) ||
        localStorage.getItem(
          "deviceId",
        ) ||
        "browser";

      const websiteId =
        draft.id || id();

      const existingWebsite =
        draft.id
          ? await db.websiteSettings.get(
              draft.id,
            )
          : undefined;

      const websiteRecord = {
        ...(existingWebsite || {}),
        id: websiteId,
        accountId,
        schoolId,
        branchId: branchId || null,

        siteName: draft.siteName.trim(),
        tagline:
          draft.tagline.trim() || null,
        description:
          draft.description.trim() || null,

        templateKey:
          settings.templateKey,
        templateVersion:
          settings.templateVersion,

        eleeveonSlug:
          draft.eleeveonSlug.trim(),

        status: draft.status,
        defaultLanguage:
          draft.defaultLanguage || "en",
        searchEngineIndexing:
          draft.searchEngineIndexing,

        seoTitle:
          draft.seoTitle.trim() || null,
        seoDescription:
          draft.seoDescription.trim() ||
          null,
        seoKeywords: splitKeywords(
          draft.seoKeywordsText,
        ),

        analyticsProvider:
          draft.analyticsProvider.trim() ||
          null,
        analyticsTrackingId:
          draft.analyticsTrackingId.trim() ||
          null,

        publishedAt:
          draft.status === "published"
            ? existingWebsite?.publishedAt ||
              now
            : existingWebsite?.publishedAt ||
              null,

        active: true,
        createdAt:
          existingWebsite?.createdAt || now,
        updatedAt: now,
        version:
          Number(
            existingWebsite?.version || 0,
          ) + 1,
        deviceId,
        createdByDeviceId:
          existingWebsite
            ?.createdByDeviceId ||
          deviceId,
        updatedByDeviceId: deviceId,
        synced: SyncStatus.PENDING,
        isDeleted: false,
      };

      await db.websiteSettings.put(
        websiteRecord as any,
      );

      const existingTemplateSettings =
        await db.websiteTemplateSettings
          .where("websiteSettingId")
          .equals(websiteId)
          .toArray();

      const currentTemplateSetting =
        existingTemplateSettings.find(
          (row) =>
            !row.isDeleted &&
            row.active !== false,
        );

      const templateSettingId =
        currentTemplateSetting?.id ||
        id();

      const templateSettingRecord: WebsiteTemplateSetting =
        {
          ...(currentTemplateSetting || {}),
          id: templateSettingId,
          accountId,
          schoolId,
          branchId: branchId || null,
          websiteSettingId: websiteId,
          templateKey:
            settings.templateKey,
          templateVersion:
            settings.templateVersion,
          settings,
          active: true,
          createdAt:
            currentTemplateSetting
              ?.createdAt || now,
          updatedAt: now,
          version:
            Number(
              currentTemplateSetting
                ?.version || 0,
            ) + 1,
          deviceId,
          createdByDeviceId:
            currentTemplateSetting
              ?.createdByDeviceId ||
            deviceId,
          updatedByDeviceId:
            deviceId,
          synced: SyncStatus.PENDING,
          isDeleted: false,
        };

      await db.websiteTemplateSettings.put(
        templateSettingRecord,
      );

      const existingAssignments =
        await db.websiteTemplateAssignments
          .where("websiteSettingId")
          .equals(websiteId)
          .toArray();

      const currentAssignment =
        existingAssignments.find(
          (row) =>
            !row.isDeleted &&
            row.scopeType ===
              "website" &&
            row.active !== false,
        );

      const assignmentRecord: WebsiteTemplateAssignment =
        {
          ...(currentAssignment || {}),
          id:
            currentAssignment?.id ||
            id(),
          accountId,
          schoolId,
          branchId: branchId || null,
          websiteSettingId: websiteId,
          templateSettingId,
          scopeType: "website",
          scopeId: websiteId,
          isDefault: true,
          active: true,
          createdAt:
            currentAssignment
              ?.createdAt || now,
          updatedAt: now,
          version:
            Number(
              currentAssignment?.version ||
                0,
            ) + 1,
          deviceId,
          createdByDeviceId:
            currentAssignment
              ?.createdByDeviceId ||
            deviceId,
          updatedByDeviceId:
            deviceId,
          synced: SyncStatus.PENDING,
          isDeleted: false,
        };

      await db.websiteTemplateAssignments.put(
        assignmentRecord,
      );

      const existingDomains =
        await db.websiteDomains
          .where("websiteSettingId")
          .equals(websiteId)
          .toArray();

      const subdomain =
        existingDomains.find(
          (row: AnyRow) =>
            row.domainType ===
            "eleeveon_subdomain",
        );

      await db.websiteDomains.put({
        ...(subdomain || {}),
        id: subdomain?.id || id(),
        accountId,
        schoolId,
        branchId: branchId || null,
        websiteSettingId: websiteId,
        domainType:
          "eleeveon_subdomain",
        hostname: `${draft.eleeveonSlug}.${rootDomain}`,
        status: "active",
        sslStatus: "active",
        isPrimary: !customDomain,
        active: true,
        createdAt:
          subdomain?.createdAt || now,
        updatedAt: now,
        version:
          Number(subdomain?.version || 0) +
          1,
        deviceId,
        createdByDeviceId:
          subdomain?.createdByDeviceId ||
          deviceId,
        updatedByDeviceId: deviceId,
        synced: SyncStatus.PENDING,
        isDeleted: false,
      } as any);

      const normalizedDomain =
        normalizeCustomDomain(
          customDomain,
        );

      const savedCustomDomain =
        existingDomains.find(
          (row: AnyRow) =>
            row.domainType === "custom",
        );

      if (normalizedDomain) {
        await db.websiteDomains.put({
          ...(savedCustomDomain || {}),
          id:
            savedCustomDomain?.id || id(),
          accountId,
          schoolId,
          branchId: branchId || null,
          websiteSettingId: websiteId,
          domainType: "custom",
          hostname: normalizedDomain,
          status:
            savedCustomDomain?.status ||
            "pending",
          sslStatus:
            savedCustomDomain?.sslStatus ||
            "pending",
          isPrimary: true,
          active: true,
          createdAt:
            savedCustomDomain?.createdAt ||
            now,
          updatedAt: now,
          version:
            Number(
              savedCustomDomain?.version ||
                0,
            ) + 1,
          deviceId,
          createdByDeviceId:
            savedCustomDomain
              ?.createdByDeviceId ||
            deviceId,
          updatedByDeviceId: deviceId,
          synced: SyncStatus.PENDING,
          isDeleted: false,
        } as any);
      } else if (savedCustomDomain) {
        await db.websiteDomains.put({
          ...savedCustomDomain,
          active: false,
          isDeleted: true,
          updatedAt: now,
          version:
            Number(
              savedCustomDomain.version ||
                0,
            ) + 1,
          updatedByDeviceId: deviceId,
          synced: SyncStatus.PENDING,
        } as any);
      }

      setDraft((current) => ({
        ...current,
        id: websiteId,
      }));

      setMessage(
        draft.status === "published"
          ? "Website settings saved and published."
          : "Website settings saved.",
      );

      onSaved?.();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save website settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="ba-sheet-backdrop website-settings-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Website settings"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="ba-sheet report-template-suite-sheet website-settings-modal"
        style={
          {
            "--ba-primary": "#2f6fed",
          } as React.CSSProperties
        }
      >
        <div className="ba-sheet-head">
          <div>
            <h2>School Website</h2>
            <p>
              Choose a template, control what appears, edit labels and preview
              the exact public website before publishing.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close website settings"
          >
            ✕
          </button>
        </div>

        <div className="website-settings-status-row">
          <span
            className={`website-settings-status-dot ${
              draft.status === "published" ? "published" : "draft"
            }`}
          />
          <strong>
            {draft.status === "published" ? "Published" : "Draft"}
          </strong>
          <span>{selectedTemplate?.name || "Website template"}</span>
        </div>

        <nav
          className="website-settings-tabs"
          aria-label="Website settings sections"
        >
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={tab === item.key ? "active" : ""}
              onClick={() => setTab(item.key)}
            >
              <strong>{item.label}</strong>
            </button>
          ))}
        </nav>

        <div className="website-settings-workspace">
          <aside className="website-settings-controls">
            <div className="website-settings-panel">
              {loading ? (
                <div className="website-settings-state" role="status">
                  <span className="website-settings-spinner" />
                  <strong>Loading website settings…</strong>
                </div>
              ) : null}

              {!loading && tab === "template" ? (
                <WebsiteTemplateSelector
                  templates={templates}
                  selectedKey={
                    selectedTemplate?.key || settings.templateKey
                  }
                  settings={settings}
                  disabled={saving}
                  onSelect={selectTemplate}
                />
              ) : null}

              {!loading && tab === "display" ? (
                <WebsiteDisplayControls
                  settings={settings}
                  disabled={saving}
                  onChange={patchSettings}
                />
              ) : null}

              {!loading && tab === "labels" ? (
                <WebsiteLabelControls
                  settings={settings}
                  disabled={saving}
                  onChange={patchSettings}
                />
              ) : null}

              {!loading && tab === "content" ? (
                <WebsiteContentOverrides
                  settings={settings}
                  disabled={saving}
                  onChange={patchSettings}
                />
              ) : null}

              {!loading && tab === "order" ? (
                <WebsiteSectionOrder
                  settings={settings}
                  disabled={saving}
                  onChange={(sectionOrder) =>
                    patchSettings("sectionOrder", sectionOrder)
                  }
                />
              ) : null}

              {!loading && tab === "domain" ? (
                <WebsiteDomainControls
                  slug={draft.eleeveonSlug}
                  customDomain={customDomain}
                  rootDomain={rootDomain}
                  disabled={saving}
                  onSlugChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      eleeveonSlug: value,
                    }))
                  }
                  onCustomDomainChange={setCustomDomain}
                />
              ) : null}

              {!loading && tab === "seo" ? (
                <div className="website-settings-form-grid">
                  <label className="website-settings-field">
                    <span>SEO title</span>
                    <input
                      value={draft.seoTitle}
                      disabled={saving}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          seoTitle: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="website-settings-field website-settings-field-wide">
                    <span>SEO description</span>
                    <textarea
                      value={draft.seoDescription}
                      disabled={saving}
                      rows={4}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          seoDescription: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="website-settings-field website-settings-field-wide">
                    <span>SEO keywords</span>
                    <input
                      value={draft.seoKeywordsText}
                      disabled={saving}
                      placeholder="school, admissions, Accra"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          seoKeywordsText: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              ) : null}

              {!loading && tab === "publishing" ? (
                <WebsitePublishingControls
                  draft={draft}
                  disabled={saving}
                  onStatusChange={(status: WebsiteStatus) =>
                    setDraft((current) => ({
                      ...current,
                      status,
                    }))
                  }
                  onIndexingChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      searchEngineIndexing: value,
                    }))
                  }
                />
              ) : null}
            </div>
          </aside>

          <main className="website-settings-preview">
            <div className="website-settings-preview-head">
              <div>
                <strong>Live Preview</strong>
                <span>The exact renderer used by the public website.</span>
              </div>

              <span className="website-settings-preview-badge">
                {selectedTemplate?.name || "Template"}
              </span>
            </div>

            <WebsitePreview
              accountId={accountId}
              schoolId={schoolId}
              branchId={branchId}
              websiteSettingId={draft.id}
              draft={draft}
              settings={settings}
            />
          </main>
        </div>

        {message ? (
          <div
            className={`website-settings-message ${
              /unable|error|enter/i.test(message) ? "error" : "success"
            }`}
            role="status"
          >
            {message}
          </div>
        ) : null}

        <div className="ba-sheet-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Close
          </button>

          <button
            type="button"
            className="primary"
            onClick={save}
            disabled={saving || loading}
          >
            {saving
              ? "Saving…"
              : draft.status === "published"
                ? "Save & Publish"
                : "Save Settings"}
          </button>
        </div>

        <style jsx>{`
          .website-settings-modal {
            width: min(1180px, 100%);
            max-height: min(92dvh, 900px);
            padding: 14px;
            overflow-y: auto;
          }

          .website-settings-status-row {
            display: flex;
            align-items: center;
            gap: 7px;
            min-height: 34px;
            margin-bottom: 10px;
            padding: 7px 10px;
            border: 1px solid var(--border, rgba(148, 163, 184, 0.22));
            border-radius: 16px;
            background: color-mix(
              in srgb,
              var(--muted, #64748b) 7%,
              transparent
            );
            color: var(--muted, #64748b);
            font-size: 11px;
            font-weight: 800;
          }

          .website-settings-status-row strong {
            color: var(--text, #0f172a);
            font-size: 12px;
            font-weight: 1000;
          }

          .website-settings-status-row > span:last-child {
            margin-left: auto;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .website-settings-status-dot {
            width: 9px;
            height: 9px;
            flex: 0 0 auto;
            border-radius: 999px;
            background: #f59e0b;
            box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.12);
          }

          .website-settings-status-dot.published {
            background: #22c55e;
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
          }

          .website-settings-tabs {
            display: flex;
            gap: 7px;
            overflow-x: auto;
            margin-bottom: 12px;
            padding: 2px 1px 6px;
            scrollbar-width: none;
          }

          .website-settings-tabs::-webkit-scrollbar {
            display: none;
          }

          .website-settings-tabs button {
            flex: 0 0 auto;
            min-height: 36px;
            padding: 0 12px;
            border: 1px solid var(--border, rgba(148, 163, 184, 0.24));
            border-radius: 999px;
            background: var(--card-bg, var(--surface, #fff));
            color: var(--muted, #64748b);
            cursor: pointer;
          }

          .website-settings-tabs button strong {
            font-size: 11px;
            font-weight: 950;
          }

          .website-settings-tabs button.active {
            border-color: var(--ba-primary, #2563eb);
            background: var(--ba-primary, #2563eb);
            color: #fff;
            box-shadow: 0 10px 24px
              color-mix(in srgb, var(--ba-primary, #2563eb) 22%, transparent);
          }

          .website-settings-workspace {
            display: grid;
            grid-template-columns: minmax(300px, 0.8fr) minmax(0, 1.2fr);
            gap: 12px;
            align-items: start;
          }

          .website-settings-controls,
          .website-settings-preview {
            min-width: 0;
            border: 1px solid var(--border, rgba(148, 163, 184, 0.22));
            border-radius: 20px;
            background: var(--card-bg, var(--surface, #fff));
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
          }

          .website-settings-controls {
            overflow: hidden;
          }

          .website-settings-panel {
            max-height: min(62dvh, 620px);
            overflow-y: auto;
            padding: 11px;
          }

          .website-settings-preview {
            position: sticky;
            top: 0;
            overflow: hidden;
          }

          .website-settings-preview-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
            padding: 10px 11px;
            border-bottom: 1px solid var(--border, rgba(148, 163, 184, 0.18));
            background: color-mix(
              in srgb,
              var(--muted, #64748b) 5%,
              transparent
            );
          }

          .website-settings-preview-head strong,
          .website-settings-preview-head span {
            display: block;
          }

          .website-settings-preview-head strong {
            color: var(--text, #0f172a);
            font-size: 13px;
            font-weight: 1000;
          }

          .website-settings-preview-head div > span {
            margin-top: 2px;
            color: var(--muted, #64748b);
            font-size: 10px;
            font-weight: 750;
          }

          .website-settings-preview-badge {
            flex: 0 0 auto;
            padding: 6px 9px;
            border-radius: 999px;
            background: color-mix(
              in srgb,
              var(--ba-primary, #2563eb) 12%,
              transparent
            );
            color: var(--ba-primary, #2563eb);
            font-size: 10px;
            font-weight: 1000;
          }

          .website-settings-preview :global(.website-preview-shell) {
            border: 0;
            border-radius: 0;
          }

          .website-settings-state {
            min-height: 180px;
            display: grid;
            place-items: center;
            align-content: center;
            gap: 9px;
            color: var(--muted, #64748b);
            text-align: center;
          }

          .website-settings-spinner {
            width: 30px;
            height: 30px;
            border: 3px solid
              color-mix(in srgb, var(--ba-primary, #2563eb) 18%, transparent);
            border-top-color: var(--ba-primary, #2563eb);
            border-radius: 999px;
            animation: websiteSettingsSpin 0.8s linear infinite;
          }

          .website-settings-message {
            margin-top: 10px;
            padding: 10px 12px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: 850;
          }

          .website-settings-message.success {
            background: rgba(34, 197, 94, 0.12);
            color: #166534;
          }

          .website-settings-message.error {
            background: rgba(239, 68, 68, 0.12);
            color: #991b1b;
          }

          @keyframes websiteSettingsSpin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 860px) {
            .website-settings-modal {
              width: min(760px, 100%);
            }

            .website-settings-workspace {
              grid-template-columns: minmax(0, 1fr);
            }

            .website-settings-preview {
              position: static;
            }

            .website-settings-panel {
              max-height: none;
            }
          }

          @media (max-width: 560px) {
            .website-settings-modal {
              max-height: 94dvh;
              padding: 12px;
              border-radius: 26px 26px 20px 20px;
            }

            .website-settings-tabs {
              margin-inline: -2px;
            }

            .website-settings-workspace {
              gap: 9px;
            }

            .website-settings-preview-head {
              align-items: center;
            }
          }
        `}</style>
      </section>
    </div>
  );

}