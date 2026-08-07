"use client";

/**
 * app/components/GlobalBrandingRuntime.tsx
 * ---------------------------------------------------------
 * GLOBAL BRANDING RUNTIME
 * ---------------------------------------------------------
 *
 * Purpose:
 * - Applies browser-level branding at all times, not only when Branchsettings opens.
 * - Keeps favicon, Apple touch icon, document title and theme-color aligned with
 *   the currently selected workspace.
 *
 * Source order:
 * 1. selected-role workspace session from eleeveon_open_workspace
 * 2. active membership context
 * 3. active school / branch context
 * 4. settings context
 * 5. default Eleeveon fallbacks from /public
 *
 * Ownership rule:
 * - Developer/platform roles keep the Eleeveon title and default Eleeveon favicon.
 * - School-facing roles see the active school name as the app title and the school
 *   logo as favicon so the system feels owned by the institution they operate under.
 * - School-facing roles include owner, school_admin, branch_admin, accountant,
 *   teacher, student and parent.
 *
 * Media behavior:
 * - School-facing roles prefer school logo first, then branch/settings logo.
 * - Platform roles always use the default Eleeveon favicon.
 * - Falls back to /favicon.ico and /android-chrome-512x512.png.
 * - Does not mutate theme variables, does not write to IndexedDB, and does not
 *   perform any save/sync action.
 *
 * Usage:
 * - Place inside the provider tree, after ActiveBranchProvider and
 *   ActiveMembershipProvider are available.
 */

import { useEffect, useMemo } from "react";

import { useSettings } from "../context/settings-context";
import { useActiveBranch } from "../context/active-branch-context";
import { useActiveMembership } from "../context/active-membership-context";

// ======================================================
// CONSTANTS
// ======================================================

const OPEN_WORKSPACE_KEY = "eleeveon_open_workspace";

const DEFAULT_APP_TITLE = "Eleeveon School Management";
const DEFAULT_FAVICON = "/favicon.ico";
const DEFAULT_APP_ICON = "/android-chrome-512x512.png";
const DEFAULT_APPLE_ICON = "/apple-touch-icon.png";

const PLATFORM_ROLES = new Set([
  "developer",
  "super_admin",
  "platform_admin",
  "platform",
  "platform_team",
  "platform_owner",
]);

type OpenWorkspaceSession = {
  membership?: Record<string, any> | null;
  role?: string | null;
  schoolId?: number | string | null;
  branchId?: number | string | null;
  memberName?: string | null;
  fullName?: string | null;
  userName?: string | null;
  openedAt?: number;
};

// ======================================================
// SAFE BROWSER HELPERS
// ======================================================

function safeStorageRead(key: string) {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeJsonRead<T>(key: string): T | null {
  const raw = safeStorageRead(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readOpenWorkspaceSession() {
  return safeJsonRead<OpenWorkspaceSession>(OPEN_WORKSPACE_KEY);
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function cleanMediaUrl(value: unknown) {
  const url = cleanText(value);

  if (!url) return "";
  if (url.startsWith("blob:")) return "";
  if (url.startsWith("data:image/")) return "";

  return url;
}

function normalizeRole(value: unknown) {
  return cleanText(value).toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function isPlatformRole(role: string) {
  return PLATFORM_ROLES.has(normalizeRole(role));
}

function upsertMeta(name: string, content: string) {
  if (typeof document === "undefined") return;

  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

function upsertIconLink(rel: string, href: string) {
  if (typeof document === "undefined") return;

  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
}

function setDocumentTitle(title: string) {
  if (typeof document === "undefined") return;
  document.title = title || DEFAULT_APP_TITLE;
}

// ======================================================
// COMPONENT
// ======================================================

export default function GlobalBrandingRuntime() {
  const { settings } = useSettings() as any;

  const { activeSchool, activeBranch } = useActiveBranch() as any;

  const { activeMembership } = useActiveMembership() as any;

  const openWorkspace = useMemo(() => readOpenWorkspaceSession(), []);

  const role = useMemo(() => {
    return (
      normalizeRole(openWorkspace?.role) ||
      normalizeRole(openWorkspace?.membership?.role) ||
      normalizeRole(activeMembership?.role) ||
      normalizeRole(activeMembership?.membershipRole) ||
      normalizeRole(activeMembership?.userRole)
    );
  }, [
    activeMembership?.membershipRole,
    activeMembership?.role,
    activeMembership?.userRole,
    openWorkspace?.membership?.role,
    openWorkspace?.role,
  ]);

  const platformRole = useMemo(() => isPlatformRole(role), [role]);

  const schoolName = useMemo(() => {
    return (
      cleanText(openWorkspace?.membership?.school?.name) ||
      cleanText(openWorkspace?.membership?.schoolName) ||
      cleanText(activeMembership?.school?.name) ||
      cleanText(activeMembership?.schoolName) ||
      cleanText(activeSchool?.name) ||
      cleanText(settings?.schoolName) ||
      cleanText(settings?.name)
    );
  }, [
    activeMembership?.school?.name,
    activeMembership?.schoolName,
    activeSchool?.name,
    openWorkspace?.membership?.school?.name,
    openWorkspace?.membership?.schoolName,
    settings?.name,
    settings?.schoolName,
  ]);

  const schoolLogoUrl = useMemo(() => {
    return (
      cleanMediaUrl(openWorkspace?.membership?.school?.logo) ||
      cleanMediaUrl(activeMembership?.school?.logo) ||
      cleanMediaUrl(activeSchool?.logo) ||
      cleanMediaUrl(settings?.schoolLogo)
    );
  }, [
    activeMembership?.school?.logo,
    activeSchool?.logo,
    openWorkspace?.membership?.school?.logo,
    settings?.schoolLogo,
  ]);

  const branchLogoUrl = useMemo(() => {
    return (
      cleanMediaUrl(openWorkspace?.membership?.branch?.logo) ||
      cleanMediaUrl(activeMembership?.branch?.logo) ||
      cleanMediaUrl(activeBranch?.logo) ||
      cleanMediaUrl(settings?.branchLogo) ||
      cleanMediaUrl(settings?.logo)
    );
  }, [
    activeBranch?.logo,
    activeMembership?.branch?.logo,
    openWorkspace?.membership?.branch?.logo,
    settings?.branchLogo,
    settings?.logo,
  ]);

  const logoUrl = useMemo(() => {
    if (platformRole) return DEFAULT_FAVICON;

    return schoolLogoUrl || branchLogoUrl || DEFAULT_FAVICON;
  }, [branchLogoUrl, platformRole, schoolLogoUrl]);

  const appleIconUrl = useMemo(() => {
    if (platformRole) return DEFAULT_APPLE_ICON;

    return schoolLogoUrl || branchLogoUrl || DEFAULT_APPLE_ICON || DEFAULT_APP_ICON;
  }, [branchLogoUrl, platformRole, schoolLogoUrl]);

  const themeColor = useMemo(() => {
    return (
      cleanText(settings?.primaryColor) ||
      cleanText(settings?.themeColor) ||
      "#2f6fed"
    );
  }, [settings?.primaryColor, settings?.themeColor]);

  const title = useMemo(() => {
    if (platformRole) return DEFAULT_APP_TITLE;
    return schoolName || DEFAULT_APP_TITLE;
  }, [platformRole, schoolName]);

  useEffect(() => {
    setDocumentTitle(title);
  }, [title]);

  useEffect(() => {
    upsertIconLink("icon", logoUrl || DEFAULT_FAVICON);
    upsertIconLink("shortcut icon", logoUrl || DEFAULT_FAVICON);
    upsertIconLink("apple-touch-icon", appleIconUrl || DEFAULT_APPLE_ICON);
  }, [appleIconUrl, logoUrl]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.style.setProperty("--eds-brand-primary", themeColor);
    root.style.setProperty("--primary-color", themeColor);
    root.style.setProperty("--dashboard-primary", themeColor);
    root.style.setProperty("--branch-primary", themeColor);
    root.style.setProperty("--accent-color", themeColor);

    // LocalAppearanceRuntime owns the neutral light/dark window colour.
    // Keep the brand available without forcing the OS chrome to primary blue.
    upsertMeta("application-name", title);
    upsertMeta("apple-mobile-web-app-title", title);
  }, [themeColor, title]);

  return null;
}
