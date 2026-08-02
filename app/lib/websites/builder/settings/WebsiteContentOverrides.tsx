"use client";

import React from "react";

import type {
  WebsiteTemplateSettings,
} from "../../types";

type ContentKey =
  | "heroEyebrow"
  | "heroHeading"
  | "heroBody"
  | "primaryActionLabel"
  | "primaryActionHref"
  | "secondaryActionLabel"
  | "secondaryActionHref"
  | "principalMessage"
  | "aboutText";

export type WebsiteContentOverridesProps = {
  settings: WebsiteTemplateSettings;
  disabled?: boolean;
  onChange: (
    key: ContentKey,
    value: string,
  ) => void;
};

export default function WebsiteContentOverrides({
  settings,
  disabled = false,
  onChange,
}: WebsiteContentOverridesProps) {
  return (
    <div className="website-settings-form-grid">
      <label className="website-settings-field">
        <span>Hero eyebrow</span>
        <input
          value={settings.heroEyebrow}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              "heroEyebrow",
              event.target.value,
            )
          }
        />
      </label>

      <label className="website-settings-field">
        <span>Hero heading</span>
        <input
          value={settings.heroHeading}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              "heroHeading",
              event.target.value,
            )
          }
        />
      </label>

      <label className="website-settings-field website-settings-field-wide">
        <span>Hero body</span>
        <textarea
          value={settings.heroBody}
          disabled={disabled}
          rows={4}
          onChange={(event) =>
            onChange(
              "heroBody",
              event.target.value,
            )
          }
        />
      </label>

      <label className="website-settings-field">
        <span>Primary action label</span>
        <input
          value={settings.primaryActionLabel}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              "primaryActionLabel",
              event.target.value,
            )
          }
        />
      </label>

      <label className="website-settings-field">
        <span>Primary action link</span>
        <input
          value={settings.primaryActionHref}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              "primaryActionHref",
              event.target.value,
            )
          }
        />
      </label>

      <label className="website-settings-field">
        <span>Secondary action label</span>
        <input
          value={settings.secondaryActionLabel}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              "secondaryActionLabel",
              event.target.value,
            )
          }
        />
      </label>

      <label className="website-settings-field">
        <span>Secondary action link</span>
        <input
          value={settings.secondaryActionHref}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              "secondaryActionHref",
              event.target.value,
            )
          }
        />
      </label>

      <label className="website-settings-field website-settings-field-wide">
        <span>Principal message</span>
        <textarea
          value={settings.principalMessage}
          disabled={disabled}
          rows={5}
          onChange={(event) =>
            onChange(
              "principalMessage",
              event.target.value,
            )
          }
        />
      </label>

      <label className="website-settings-field website-settings-field-wide">
        <span>About text</span>
        <textarea
          value={settings.aboutText}
          disabled={disabled}
          rows={5}
          onChange={(event) =>
            onChange(
              "aboutText",
              event.target.value,
            )
          }
        />
      </label>
    </div>
  );
}
