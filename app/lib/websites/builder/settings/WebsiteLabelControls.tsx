"use client";

import React from "react";

import type {
  WebsiteTemplateSettings,
} from "../../types";

type LabelSettingKey =
  | "homeLabel"
  | "aboutLabel"
  | "statisticsLabel"
  | "principalLabel"
  | "academicStructuresLabel"
  | "programsLabel"
  | "subjectsLabel"
  | "organizationsLabel"
  | "teachersLabel"
  | "highlightsLabel"
  | "announcementsLabel"
  | "eventsLabel"
  | "galleryLabel"
  | "contactLabel"
  | "phoneLabel"
  | "emailLabel"
  | "addressLabel"
  | "footerText";

const FIELDS: Array<{
  key: LabelSettingKey;
  label: string;
}> = [
  { key: "homeLabel", label: "Home navigation label" },
  { key: "aboutLabel", label: "About section label" },
  { key: "statisticsLabel", label: "Statistics section label" },
  { key: "principalLabel", label: "Principal section label" },
  { key: "academicStructuresLabel", label: "Academic levels label" },
  { key: "programsLabel", label: "Programmes label" },
  { key: "subjectsLabel", label: "Subjects label" },
  { key: "organizationsLabel", label: "School life label" },
  { key: "teachersLabel", label: "Teachers label" },
  { key: "highlightsLabel", label: "Highlights label" },
  { key: "announcementsLabel", label: "Announcements label" },
  { key: "eventsLabel", label: "Events label" },
  { key: "galleryLabel", label: "Gallery label" },
  { key: "contactLabel", label: "Contact label" },
  { key: "phoneLabel", label: "Phone label" },
  { key: "emailLabel", label: "Email label" },
  { key: "addressLabel", label: "Address label" },
  { key: "footerText", label: "Footer text" },
];

export type WebsiteLabelControlsProps = {
  settings: WebsiteTemplateSettings;
  disabled?: boolean;
  onChange: (
    key: LabelSettingKey,
    value: string,
  ) => void;
};

export default function WebsiteLabelControls({
  settings,
  disabled = false,
  onChange,
}: WebsiteLabelControlsProps) {
  return (
    <div className="website-settings-form-grid">
      {FIELDS.map((field) => (
        <label
          key={field.key}
          className="website-settings-field"
        >
          <span>{field.label}</span>
          <input
            value={settings[field.key]}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                field.key,
                event.target.value,
              )
            }
          />
        </label>
      ))}
    </div>
  );
}
