"use client";

import type {
  AssessmentItemDraft,
} from "./assessment-editor.types";

export function AssessmentItemVisibilityControls({
  draft,
  onChange,
}: {
  draft: AssessmentItemDraft;
  onChange(
    patch: Partial<AssessmentItemDraft>,
  ): void;
}) {
  return (
    <section className="ae-form-section">
      <h4>Report visibility</h4>

      <label>
        Visibility rule
        <select
          value={draft.reportVisibility}
          onChange={(event) =>
            onChange({
              reportVisibility:
                event.target.value as AssessmentItemDraft["reportVisibility"],
            })
          }
        >
          <option value="show">
            Show explicitly
          </option>
          <option value="hide">
            Hide from reports
          </option>
          <option value="inherit">
            Inherit from parent/template
          </option>
        </select>
      </label>

      <label className="ae-check">
        <input
          type="checkbox"
          checked={
            draft.showParentOnReport
          }
          onChange={(event) =>
            onChange({
              showParentOnReport:
                event.target.checked,
            })
          }
        />
        Show this item on reports
      </label>

      <label className="ae-check">
        <input
          type="checkbox"
          checked={
            draft.showChildrenOnReport
          }
          onChange={(event) =>
            onChange({
              showChildrenOnReport:
                event.target.checked,
            })
          }
        />
        Allow child items on reports
      </label>
    </section>
  );
}
