"use client";

import React from "react";

import type {
  WebsiteTemplateSettings,
} from "../../types";

type BooleanSettingKey = {
  [K in keyof WebsiteTemplateSettings]:
    WebsiteTemplateSettings[K] extends boolean
      ? K
      : never;
}[keyof WebsiteTemplateSettings];

type ToggleDefinition = {
  key: BooleanSettingKey;
  label: string;
  description?: string;
};

const TOGGLES: ToggleDefinition[] = [
  { key: "showLogo", label: "Show school logo" },
  { key: "showMotto", label: "Show school motto" },
  { key: "showBranchName", label: "Show branch name" },
  { key: "showHero", label: "Show hero section" },
  { key: "showHeroImage", label: "Show hero image" },
  { key: "showStatistics", label: "Show statistics" },
  { key: "showStudentCount", label: "Show student count" },
  { key: "showTeacherCount", label: "Show teacher count" },
  { key: "showClassCount", label: "Show class count" },
  { key: "showSubjectCount", label: "Show subject count" },
  { key: "showAbout", label: "Show about section" },
  { key: "showPrincipal", label: "Show principal" },
  { key: "showPrincipalPhoto", label: "Show principal photo" },
  { key: "showAcademicStructures", label: "Show academic levels" },
  { key: "showPrograms", label: "Show programmes" },
  { key: "showProgramDescriptions", label: "Show programme descriptions" },
  { key: "showSubjects", label: "Show subjects" },
  { key: "showSubjectCodes", label: "Show subject codes" },
  { key: "showOrganizations", label: "Show school life" },
  { key: "showTeachers", label: "Show teachers" },
  { key: "showTeacherPhotos", label: "Show teacher photos" },
  { key: "showHighlights", label: "Show highlights" },
  { key: "showAnnouncements", label: "Show announcements" },
  { key: "showEvents", label: "Show events" },
  { key: "showGallery", label: "Show gallery" },
  { key: "showContact", label: "Show contact information" },
  { key: "showPhone", label: "Show phone number" },
  { key: "showEmail", label: "Show email address" },
  { key: "showAddress", label: "Show physical address" },
  { key: "showMap", label: "Show map" },
  { key: "showSocialLinks", label: "Show social links" },
  { key: "showFooter", label: "Show footer" },
  { key: "showPoweredByEleeveon", label: "Show powered by Eleeveon" },
];

export type WebsiteDisplayControlsProps = {
  settings: WebsiteTemplateSettings;
  disabled?: boolean;
  onChange: (
    key: BooleanSettingKey,
    value: boolean,
  ) => void;
};

export default function WebsiteDisplayControls({
  settings,
  disabled = false,
  onChange,
}: WebsiteDisplayControlsProps) {
  return (
    <div className="website-settings-list">
      {TOGGLES.map((item) => (
        <label
          key={item.key}
          className="website-settings-toggle"
        >
          <span>
            <strong>{item.label}</strong>
            {item.description ? (
              <small>{item.description}</small>
            ) : null}
          </span>

          <input
            type="checkbox"
            disabled={disabled}
            checked={Boolean(settings[item.key])}
            onChange={(event) =>
              onChange(
                item.key,
                event.target.checked,
              )
            }
          />
        </label>
      ))}
    </div>
  );
}
