"use client";

import React from "react";

import type {
  WebsiteSettingsDraft,
  WebsiteStatus,
} from "../../types";

export type WebsitePublishingControlsProps = {
  draft: WebsiteSettingsDraft;
  disabled?: boolean;
  onStatusChange: (
    status: WebsiteStatus,
  ) => void;
  onIndexingChange: (
    value: boolean,
  ) => void;
};

export default function WebsitePublishingControls({
  draft,
  disabled = false,
  onStatusChange,
  onIndexingChange,
}: WebsitePublishingControlsProps) {
  return (
    <div className="website-settings-list">
      <label className="website-settings-field">
        <span>Website status</span>
        <select
          value={draft.status}
          disabled={disabled}
          onChange={(event) =>
            onStatusChange(
              event.target
                .value as WebsiteStatus,
            )
          }
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
          <option value="archived">Archived</option>
        </select>
      </label>

      <label className="website-settings-toggle">
        <span>
          <strong>Allow search-engine indexing</strong>
          <small>
            Published websites can appear in search results.
          </small>
        </span>

        <input
          type="checkbox"
          disabled={disabled}
          checked={draft.searchEngineIndexing}
          onChange={(event) =>
            onIndexingChange(
              event.target.checked,
            )
          }
        />
      </label>
    </div>
  );
}
