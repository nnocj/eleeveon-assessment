"use client";

import React from "react";

import type {
  WebsiteTemplateDefinition,
  WebsiteTemplateSettings,
} from "../../types";

export type WebsiteTemplateSelectorProps = {
  templates: WebsiteTemplateDefinition[];
  selectedKey: string;
  settings: WebsiteTemplateSettings;
  disabled?: boolean;
  onSelect: (
    template: WebsiteTemplateDefinition,
  ) => void;
};

export default function WebsiteTemplateSelector({
  templates,
  selectedKey,
  disabled = false,
  onSelect,
}: WebsiteTemplateSelectorProps) {
  return (
    <div className="website-settings-grid website-template-selector">
      {templates.map((template) => {
        const selected =
          template.key === selectedKey;

        return (
          <button
            key={template.key}
            type="button"
            disabled={disabled}
            className={[
              "website-template-option",
              selected ? "is-selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSelect(template)}
          >
            <span className="website-template-option-head">
              <strong>{template.name}</strong>
              <small>{template.version}</small>
            </span>

            <span className="website-template-option-tone">
              {template.tone}
            </span>

            <span className="website-template-option-description">
              {template.description}
            </span>

            {selected ? (
              <span className="website-template-option-status">
                Selected
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
