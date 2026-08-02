"use client";

import React from "react";

import {
  normalizeCustomDomain,
  normalizeWebsiteSlug,
  websitePublicAddress,
} from "../../shared/websiteDefaults";

export type WebsiteDomainControlsProps = {
  slug: string;
  customDomain: string;
  rootDomain?: string;
  disabled?: boolean;
  onSlugChange: (value: string) => void;
  onCustomDomainChange: (
    value: string,
  ) => void;
};

export default function WebsiteDomainControls({
  slug,
  customDomain,
  rootDomain = "eleeveon.com",
  disabled = false,
  onSlugChange,
  onCustomDomainChange,
}: WebsiteDomainControlsProps) {
  const address = websitePublicAddress(
    slug,
    rootDomain,
  );

  return (
    <div className="website-settings-form-grid">
      <label className="website-settings-field">
        <span>Eleeveon subdomain</span>
        <input
          value={slug}
          disabled={disabled}
          onChange={(event) =>
            onSlugChange(
              normalizeWebsiteSlug(
                event.target.value,
              ),
            )
          }
        />
        <small>{address}</small>
      </label>

      <label className="website-settings-field">
        <span>Custom domain</span>
        <input
          value={customDomain}
          disabled={disabled}
          placeholder="www.school.edu.gh"
          onChange={(event) =>
            onCustomDomainChange(
              normalizeCustomDomain(
                event.target.value,
              ),
            )
          }
        />
      </label>
    </div>
  );
}
